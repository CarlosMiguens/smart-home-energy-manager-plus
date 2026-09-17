use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub id: i64,
    pub household_name: String,
    pub city: String,
    pub state: String,
    pub country: String,
    pub currency: String,
    pub default_kwh_rate_cents: f64,
    pub monthly_kwh_goal: f64,
    pub theme: String, // "dark" | "light" | "auto"
    pub energy_unit: String, // "kWh"
    pub billing_cycle_start_day: u32,
    pub onboarding_completed: bool,
    pub is_demo_data_loaded: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            id: 1,
            household_name: "Minha Residência".to_string(),
            city: "Videira".to_string(),
            state: "Santa Catarina".to_string(),
            country: "Brasil".to_string(),
            currency: "BRL".to_string(),
            default_kwh_rate_cents: 88.5, // R$ 0,885 / kWh
            monthly_kwh_goal: 280.0,
            theme: "dark".to_string(),
            energy_unit: "kWh".to_string(),
            billing_cycle_start_day: 1,
            onboarding_completed: false,
            is_demo_data_loaded: false,
        }
    }
}
