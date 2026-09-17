use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationResult {
    pub device_id: String,
    pub device_name: String,
    pub power_watts: f64,
    pub current_hours_per_day: f64,
    pub new_hours_per_day: f64,
    pub days_per_month: u32,
    pub current_monthly_kwh: f64,
    pub new_monthly_kwh: f64,
    pub saved_monthly_kwh: f64,
    pub current_monthly_cents: i64,
    pub new_monthly_cents: i64,
    pub saved_monthly_cents: i64,
    pub saved_annual_cents: i64,
    pub saved_annual_kwh: f64,
}

pub fn simulate_device_usage(
    device_id: String,
    device_name: String,
    power_watts: f64,
    quantity: u32,
    days_per_month: u32,
    current_hours_per_day: f64,
    new_hours_per_day: f64,
    rate_cents: f64,
) -> SimulationResult {
    let kw = (power_watts / 1000.0) * (quantity as f64);
    let current_monthly_kwh = kw * current_hours_per_day * (days_per_month as f64);
    let new_monthly_kwh = kw * new_hours_per_day * (days_per_month as f64);
    let saved_monthly_kwh = current_monthly_kwh - new_monthly_kwh;

    let current_monthly_cents = (current_monthly_kwh * rate_cents).round() as i64;
    let new_monthly_cents = (new_monthly_kwh * rate_cents).round() as i64;
    let saved_monthly_cents = current_monthly_cents - new_monthly_cents;

    let saved_annual_kwh = saved_monthly_kwh * 12.0;
    let saved_annual_cents = saved_monthly_cents * 12;

    SimulationResult {
        device_id,
        device_name,
        power_watts,
        current_hours_per_day,
        new_hours_per_day,
        days_per_month,
        current_monthly_kwh,
        new_monthly_kwh,
        saved_monthly_kwh,
        current_monthly_cents,
        new_monthly_cents,
        saved_monthly_cents,
        saved_annual_cents,
        saved_annual_kwh,
    }
}
