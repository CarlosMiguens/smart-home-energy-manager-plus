use crate::models::{Device, SavingPlanAction};

pub fn generate_recommendations(
    devices: &[Device],
    target_type: &str,
    target_value: f64,
    rate_cents: f64,
) -> (Vec<SavingPlanAction>, f64, i64) {
    if devices.is_empty() {
        return (vec![], 0.0, 0);
    }

    // Calcular consumo mensal de cada dispositivo
    let mut dev_consumptions: Vec<(&Device, f64)> = devices
        .iter()
        .map(|d| {
            let kw = (d.power_watts / 1000.0) * (d.quantity as f64);
            let m_kwh = kw * d.hours_per_day * (d.days_per_month as f64);
            (d, m_kwh)
        })
        .collect();

    let total_current_kwh: f64 = dev_consumptions.iter().map(|(_, k)| *k).sum();

    // Determinar meta em kWh
    let target_reduction_kwh = match target_type {
        "percent" => total_current_kwh * (target_value / 100.0),
        "max_kwh" => (total_current_kwh - target_value).max(0.0),
        "reduce_cost" => {
            if rate_cents > 0.0 {
                // target_value em R$ -> converter para centavos e dividir pela tarifa em centavos
                (target_value * 100.0) / rate_cents
            } else {
                0.0
            }
        }
        _ => total_current_kwh * 0.10, // padrão 10%
    };

    if target_reduction_kwh <= 0.0 {
        return (vec![], 0.0, 0);
    }

    // Ordenar por consumo decrescente
    dev_consumptions.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    let mut actions: Vec<SavingPlanAction> = Vec::new();
    let mut accumulated_savings_kwh = 0.0;

    for (device, monthly_kwh) in dev_consumptions {
        if accumulated_savings_kwh >= target_reduction_kwh {
            break;
        }

        // Não sugerir redução para refrigeradores essenciais de 24h
        let cat_lower = device.category.to_lowercase();
        if (cat_lower.contains("geladeira") || cat_lower.contains("freezer")) && device.hours_per_day >= 20.0 {
            continue;
        }

        if device.hours_per_day <= 0.1 {
            continue;
        }

        // Propor redução realista de acordo com a potência e horas
        let proposed_hours = if cat_lower.contains("chuveiro") || cat_lower.contains("banho") {
            // Chuveiro: reduzir 25% a 30% do tempo (ex: 20 min -> 15 min = 0.33h -> 0.25h)
            (device.hours_per_day * 0.75).max(0.1)
        } else if cat_lower.contains("ar-condicionado") || cat_lower.contains("aquecedor") {
            // Ar condicionado ou aquecedor: reduzir 1h a 2h
            (device.hours_per_day - 1.5).max(1.0)
        } else if cat_lower.contains("televis") || cat_lower.contains("tv") || cat_lower.contains("videogame") {
            // Lazer: reduzir 1h
            (device.hours_per_day - 1.0).max(1.0)
        } else if cat_lower.contains("computador") || cat_lower.contains("notebook") {
            // Computador: reduzir 1h em stand-by
            (device.hours_per_day - 1.0).max(2.0)
        } else {
            // Geral: reduzir 20%
            (device.hours_per_day * 0.8).max(0.2)
        };

        if proposed_hours < device.hours_per_day {
            let kw = (device.power_watts / 1000.0) * (device.quantity as f64);
            let new_monthly_kwh = kw * proposed_hours * (device.days_per_month as f64);
            let saved_kwh = (monthly_kwh - new_monthly_kwh).max(0.0);
            let saved_cents = (saved_kwh * rate_cents).round() as i64;

            if saved_kwh > 0.05 {
                accumulated_savings_kwh += saved_kwh;
                actions.push(SavingPlanAction {
                    id: uuid::Uuid::new_v4().to_string(),
                    plan_id: String::new(),
                    device_id: device.id.clone(),
                    device_name: device.name.clone(),
                    current_hours: (device.hours_per_day * 100.0).round() / 100.0,
                    proposed_hours: (proposed_hours * 100.0).round() / 100.0,
                    saved_kwh_month: (saved_kwh * 10.0).round() / 10.0,
                    saved_cents_month: saved_cents,
                });
            }
        }
    }

    let total_saved_cents = (accumulated_savings_kwh * rate_cents).round() as i64;
    (actions, accumulated_savings_kwh, total_saved_cents)
}
