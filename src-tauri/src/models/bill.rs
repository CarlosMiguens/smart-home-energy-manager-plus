use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnergyBill {
    pub id: String,
    pub month: u32,
    pub year: i32,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub kwh_total: f64,
    pub total_cents: i64,
    pub kwh_rate_cents: Option<f64>,
    pub additional_taxes_cents: i64,
    pub tariff_flag: String, // "Verde", "Amarela", "Vermelha 1", "Vermelha 2"
    pub distributor: String, // ex: "Celesc"
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillCardView {
    pub bill: EnergyBill,
    pub effective_rate_cents: f64,
    pub diff_kwh: Option<f64>,
    pub diff_kwh_pct: Option<f64>,
    pub diff_cents: Option<i64>,
    pub diff_cents_pct: Option<f64>,
}
