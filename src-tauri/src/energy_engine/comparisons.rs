use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeriodComparison {
    pub previous_kwh: f64,
    pub current_kwh: f64,
    pub diff_kwh: f64,
    pub pct_kwh: f64,
    pub previous_cents: i64,
    pub current_cents: i64,
    pub diff_cents: i64,
    pub pct_cents: f64,
    pub is_savings: bool,
}

pub fn compare_periods(
    previous_kwh: f64,
    current_kwh: f64,
    previous_cents: i64,
    current_cents: i64,
) -> PeriodComparison {
    let diff_kwh = current_kwh - previous_kwh;
    let pct_kwh = if previous_kwh > 0.0 {
        (diff_kwh / previous_kwh) * 100.0
    } else {
        0.0
    };

    let diff_cents = current_cents - previous_cents;
    let pct_cents = if previous_cents > 0 {
        ((diff_cents as f64) / (previous_cents as f64)) * 100.0
    } else {
        0.0
    };

    let is_savings = diff_kwh < 0.0 || (diff_kwh == 0.0 && diff_cents <= 0);

    PeriodComparison {
        previous_kwh,
        current_kwh,
        diff_kwh,
        pct_kwh,
        previous_cents,
        current_cents,
        diff_cents,
        pct_cents,
        is_savings,
    }
}
