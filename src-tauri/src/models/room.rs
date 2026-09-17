use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Room {
    pub id: String,
    pub name: String,
    pub icon: String, // ex: "Sofa", "ChefHat", "BedDouble", "Bath", "Briefcase", "Car", "Shirt", "Trees"
    pub order_index: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoomConsumptionSummary {
    pub room: Room,
    pub device_count: usize,
    pub estimated_monthly_kwh: f64,
    pub estimated_monthly_cents: i64,
    pub percentage_of_home: f64,
}
