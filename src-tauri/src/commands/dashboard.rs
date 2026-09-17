use crate::database::{Database, Repository};
use crate::energy_engine::{
    calculate_cost_cents, calculate_goal_progress, compare_periods,
    monthly_kwh, unidentified_kwh, GoalProgress, PeriodComparison,
};
use crate::models::{AppSettings, DeviceCalculatedMetrics, EnergyBill, SavingPlan};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSummary {
    pub settings: AppSettings,
    pub current_bill: Option<EnergyBill>,
    pub previous_bill: Option<EnergyBill>,
    pub bill_comparison: Option<PeriodComparison>,
    pub goal_progress: GoalProgress,
    pub total_devices_kwh: f64,
    pub total_devices_cents: i64,
    pub unidentified_kwh: Option<f64>,
    pub devices_percentage_of_bill: Option<f64>,
    pub top_consumers: Vec<DeviceCalculatedMetrics>,
    pub active_plan: Option<SavingPlan>,
    pub insights: Vec<String>,
    pub total_bills_count: usize,
    pub total_devices_count: usize,
}

#[tauri::command]
pub fn get_dashboard_summary(db: State<'_, Database>) -> Result<DashboardSummary, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    let bills = Repository::list_bills(&conn).map_err(|e| e.to_string())?;
    let devices = Repository::list_devices(&conn).map_err(|e| e.to_string())?;
    let plans = Repository::list_plans(&conn).map_err(|e| e.to_string())?;

    let rate_cents = settings.default_kwh_rate_cents;

    // Contas atual e anterior
    let current_bill = bills.get(0).cloned();
    let previous_bill = bills.get(1).cloned();

    let bill_comparison = if let (Some(curr), Some(prev)) = (&current_bill, &previous_bill) {
        Some(compare_periods(
            prev.kwh_total,
            curr.kwh_total,
            prev.total_cents,
            curr.total_cents,
        ))
    } else {
        None
    };

    // Consumo do mês para cálculo de progresso de meta
    let current_month_kwh = if let Some(ref cb) = current_bill {
        cb.kwh_total
    } else {
        // Se não houver fatura cadastrada, usa a soma dos dispositivos
        devices
            .iter()
            .map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month))
            .sum()
    };

    // Dias restantes no mês corrente
    let now = chrono::Local::now();
    let days_in_month = match now.month() {
        2 => {
            let y = now.year();
            if (y % 4 == 0 && y % 100 != 0) || y % 400 == 0 {
                29
            } else {
                28
            }
        }
        4 | 6 | 9 | 11 => 30,
        _ => 31,
    };
    let current_day = now.day();
    let days_remaining = if days_in_month >= current_day {
        days_in_month - current_day
    } else {
        0
    };

    let goal_progress = calculate_goal_progress(
        current_month_kwh,
        settings.monthly_kwh_goal,
        days_remaining,
    );

    // Métricas dos dispositivos
    let mut dev_metrics = Vec::new();
    let mut total_devices_kwh = 0.0;

    for d in &devices {
        let m_kwh = monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month);
        total_devices_kwh += m_kwh;
    }

    let total_devices_cents = calculate_cost_cents(total_devices_kwh, rate_cents);

    for d in &devices {
        let p_kw = d.power_watts / 1000.0;
        let d_kwh = p_kw * (d.quantity as f64) * d.hours_per_day;
        let m_kwh = p_kw * (d.quantity as f64) * d.hours_per_day * (d.days_per_month as f64);
        let m_cents = calculate_cost_cents(m_kwh, rate_cents);
        let pct = if total_devices_kwh > 0.0 {
            (m_kwh / total_devices_kwh) * 100.0
        } else {
            0.0
        };

        dev_metrics.push(DeviceCalculatedMetrics {
            device: d.clone(),
            power_kw: p_kw,
            daily_kwh: (d_kwh * 100.0).round() / 100.0,
            monthly_kwh: (m_kwh * 10.0).round() / 10.0,
            hourly_cost_cents: calculate_cost_cents(p_kw * (d.quantity as f64), rate_cents),
            daily_cost_cents: calculate_cost_cents(d_kwh, rate_cents),
            monthly_cost_cents: m_cents,
            percentage_of_total: (pct * 10.0).round() / 10.0,
            cost_15min_cents: calculate_cost_cents(p_kw * (d.quantity as f64) * 0.25, rate_cents),
            cost_30min_cents: calculate_cost_cents(p_kw * (d.quantity as f64) * 0.5, rate_cents),
            cost_1h_cents: calculate_cost_cents(p_kw * (d.quantity as f64) * 1.0, rate_cents),
            cost_2h_cents: calculate_cost_cents(p_kw * (d.quantity as f64) * 2.0, rate_cents),
        });
    }

    // Ordenar ranking maiores consumidores
    dev_metrics.sort_by(|a, b| b.monthly_kwh.partial_cmp(&a.monthly_kwh).unwrap_or(std::cmp::Ordering::Equal));
    let top_consumers = dev_metrics.iter().take(5).cloned().collect();

    // Diferença entre fatura e aparelhos
    let (unidentified, devices_pct_bill) = if let Some(ref cb) = current_bill {
        let un = unidentified_kwh(cb.kwh_total, total_devices_kwh);
        let pct = if cb.kwh_total > 0.0 {
            (total_devices_kwh / cb.kwh_total) * 100.0
        } else {
            0.0
        };
        (Some((un * 10.0).round() / 10.0), Some((pct * 10.0).round() / 10.0))
    } else {
        (None, None)
    };

    // Plano ativo
    let active_plan = plans.iter().find(|p| p.is_active).cloned();

    // Geração de insights reais e determinísticos
    let mut insights = Vec::new();

    if let Some(ref comp) = bill_comparison {
        if comp.diff_kwh < 0.0 {
            insights.push(format!(
                "Seu consumo caiu {:.1}% em relação ao mês anterior (economia de {:.1} kWh).",
                comp.pct_kwh.abs(),
                comp.diff_kwh.abs()
            ));
        } else if comp.diff_kwh > 0.0 {
            insights.push(format!(
                "Atenção: Seu consumo aumentou {:.1}% (+{:.1} kWh) em relação ao mês anterior.",
                comp.pct_kwh, comp.diff_kwh
            ));
        }

        if comp.diff_cents < 0 {
            let saved_reais = (comp.diff_cents.abs() as f64) / 100.0;
            insights.push(format!(
                "Você economizou R$ {:.2} na última conta de luz.",
                saved_reais
            ));
        }
    }

    if let Some(top1) = dev_metrics.first() {
        if top1.percentage_of_total > 15.0 {
            insights.push(format!(
                "O aparelho '{}' representa aproximadamente {:.0}% do consumo estimado dos seus equipamentos cadastrados.",
                top1.device.name, top1.percentage_of_total
            ));
        }
    }

    if bills.len() >= 3 {
        let count = bills.len().min(6);
        let sum_kwh: f64 = bills.iter().take(count).map(|b| b.kwh_total).sum();
        let avg_kwh = sum_kwh / (count as f64);
        insights.push(format!(
            "Seu consumo médio dos últimos {} meses é de {:.1} kWh.",
            count, avg_kwh
        ));
    }

    if let Some(pct) = devices_pct_bill {
        insights.push(format!(
            "As estimativas dos seus dispositivos cadastrados cobrem {:.1}% do consumo registrado na fatura.",
            pct
        ));
    }

    if insights.is_empty() {
        insights.push("Cadastre suas faturas de luz e aparelhos para começar a receber insights personalizados de Videira SC.".to_string());
    }

    use chrono::Datelike;

    Ok(DashboardSummary {
        settings,
        current_bill,
        previous_bill,
        bill_comparison,
        goal_progress,
        total_devices_kwh: (total_devices_kwh * 10.0).round() / 10.0,
        total_devices_cents,
        unidentified_kwh: unidentified,
        devices_percentage_of_bill: devices_pct_bill,
        top_consumers,
        active_plan,
        insights,
        total_bills_count: bills.len(),
        total_devices_count: devices.len(),
    })
}
