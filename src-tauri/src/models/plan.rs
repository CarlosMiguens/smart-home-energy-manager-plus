use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavingPlanAction {
    pub id: String,
    pub plan_id: String,
    pub device_id: String,
    pub device_name: String,
    pub current_hours: f64,
    pub proposed_hours: f64,
    pub saved_kwh_month: f64,
    pub saved_cents_month: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavingPlan {
    pub id: String,
    pub name: String,
    pub target_type: String, // "percent" | "max_kwh" | "reduce_cost"
    pub target_value: f64,
    pub is_active: bool,
    pub created_at: String,
    pub actions: Vec<SavingPlanAction>,
    pub total_saved_kwh_month: f64,
    pub total_saved_cents_month: i64,
    pub total_saved_cents_year: i64,
}
