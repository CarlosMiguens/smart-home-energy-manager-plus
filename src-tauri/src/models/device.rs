use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Device {
    pub id: String,
    pub name: String,
    pub category: String,
    pub power_watts: f64,
    pub quantity: u32,
    pub hours_per_day: f64,
    pub days_per_month: u32,
    pub room_id: Option<String>,
    pub room_name: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceCalculatedMetrics {
    pub device: Device,
    pub power_kw: f64,
    pub daily_kwh: f64,
    pub monthly_kwh: f64,
    pub hourly_cost_cents: i64,
    pub daily_cost_cents: i64,
    pub monthly_cost_cents: i64,
    pub percentage_of_total: f64,
    pub cost_15min_cents: i64,
    pub cost_30min_cents: i64,
    pub cost_1h_cents: i64,
    pub cost_2h_cents: i64,
}
