/// Converte potência de Watts (W) para Quilowatts (kW)
pub fn watts_to_kw(watts: f64) -> f64 {
    watts / 1000.0
}

/// Consumo em kWh por 1 hora de uso
pub fn hourly_kwh(watts: f64, quantity: u32) -> f64 {
    watts_to_kw(watts) * (quantity as f64)
}

/// Consumo diário em kWh
pub fn daily_kwh(watts: f64, quantity: u32, hours_per_day: f64) -> f64 {
    watts_to_kw(watts) * (quantity as f64) * hours_per_day
}

/// Consumo mensal estimado em kWh
pub fn monthly_kwh(watts: f64, quantity: u32, hours_per_day: f64, days_per_month: u32) -> f64 {
    watts_to_kw(watts) * (quantity as f64) * hours_per_day * (days_per_month as f64)
}

/// Custo estimado em centavos com base no consumo em kWh e tarifa (em centavos por kWh)
pub fn calculate_cost_cents(kwh: f64, rate_cents: f64) -> i64 {
    (kwh * rate_cents).round() as i64
}

/// Custo estimado em centavos para uma duração específica em minutos
pub fn duration_cost_cents(watts: f64, quantity: u32, rate_cents: f64, minutes: f64) -> i64 {
    let kwh = watts_to_kw(watts) * (quantity as f64) * (minutes / 60.0);
    calculate_cost_cents(kwh, rate_cents)
}

/// Preço médio efetivo do kWh em centavos = total da conta em centavos / total em kWh
pub fn effective_rate_cents(total_cents: i64, kwh_total: f64) -> f64 {
    if kwh_total <= 0.0 {
        0.0
    } else {
        (total_cents as f64) / kwh_total
    }
}

/// Diferença de consumo ainda não identificada (Conta kWh - Dispositivos kWh)
pub fn unidentified_kwh(bill_kwh: f64, devices_kwh: f64) -> f64 {
    bill_kwh - devices_kwh
}
