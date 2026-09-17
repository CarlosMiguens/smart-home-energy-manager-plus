use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InternalUser {
    pub id: String,
    pub name: String,
    pub avatar: String, // nome do avatar ou emoji (ex: "User", "Smile", "Leaf", "Sun")
    pub color: String,  // cor hex (ex: "#2d6a4f", "#52796f", "#e07a5f")
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserConsumptionSummary {
    pub user: InternalUser,
    pub device_count: usize,
    pub estimated_monthly_kwh: f64,
    pub estimated_monthly_cents: i64,
    pub percentage_of_home: f64,
}
