use crate::database::{Database, Repository};
use crate::energy_engine::{compare_periods, PeriodComparison};
use crate::models::EnergyBill;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthComparisonResult {
    pub bill_a: EnergyBill,
    pub bill_b: EnergyBill,
    pub comparison: PeriodComparison,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YearSummary {
    pub year: i32,
    pub total_kwh: f64,
    pub monthly_avg_kwh: f64,
    pub total_cents: i64,
    pub best_month: Option<EnergyBill>,  // menor consumo
    pub worst_month: Option<EnergyBill>, // maior consumo
    pub bill_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YearComparisonResult {
    pub year_a: YearSummary,
    pub year_b: YearSummary,
    pub diff_kwh: f64,
    pub pct_kwh: f64,
    pub diff_cents: i64,
    pub pct_cents: f64,
    pub is_savings: bool,
}

#[tauri::command]
pub fn compare_two_bills(
    db: State<'_, Database>,
    bill_id_a: String,
    bill_id_b: String,
) -> Result<MonthComparisonResult, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let bill_a = Repository::get_bill(&conn, &bill_id_a)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Fatura A não encontrada".to_string())?;
    let bill_b = Repository::get_bill(&conn, &bill_id_b)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Fatura B não encontrada".to_string())?;

    // Considerar A como anterior e B como atual para fins de comparação (B - A)
    let comparison = compare_periods(
        bill_a.kwh_total,
        bill_b.kwh_total,
        bill_a.total_cents,
        bill_b.total_cents,
    );

    Ok(MonthComparisonResult {
        bill_a,
        bill_b,
        comparison,
    })
}

#[tauri::command]
pub fn get_annual_summaries(db: State<'_, Database>) -> Result<Vec<YearSummary>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let bills = Repository::list_bills(&conn).map_err(|e| e.to_string())?;

    let mut by_year: HashMap<i32, Vec<EnergyBill>> = HashMap::new();
    for b in bills {
        by_year.entry(b.year).or_default().push(b);
    }

    let mut summaries = Vec::new();
    let mut years: Vec<i32> = by_year.keys().cloned().collect();
    years.sort_by(|a, b| b.cmp(a)); // Anos mais recentes primeiro

    for y in years {
        let year_bills = by_year.get(&y).unwrap();
        let total_kwh: f64 = year_bills.iter().map(|b| b.kwh_total).sum();
        let total_cents: i64 = year_bills.iter().map(|b| b.total_cents).sum();
        let count = year_bills.len();
        let monthly_avg = if count > 0 {
            total_kwh / (count as f64)
        } else {
            0.0
        };

        let best = year_bills
            .iter()
            .min_by(|a, b| a.kwh_total.partial_cmp(&b.kwh_total).unwrap())
            .cloned();
        let worst = year_bills
            .iter()
            .max_by(|a, b| a.kwh_total.partial_cmp(&b.kwh_total).unwrap())
            .cloned();

        summaries.push(YearSummary {
            year: y,
            total_kwh: (total_kwh * 10.0).round() / 10.0,
            monthly_avg_kwh: (monthly_avg * 10.0).round() / 10.0,
            total_cents,
            best_month: best,
            worst_month: worst,
            bill_count: count,
        });
    }

    Ok(summaries)
}

#[tauri::command]
pub fn compare_two_years(
    db: State<'_, Database>,
    year_a: i32,
    year_b: i32,
) -> Result<YearComparisonResult, String> {
    let summaries = get_annual_summaries(db)?;
    let sum_a = summaries
        .iter()
        .find(|s| s.year == year_a)
        .cloned()
        .ok_or_else(|| format!("Dados para o ano {} não encontrados", year_a))?;
    let sum_b = summaries
        .iter()
        .find(|s| s.year == year_b)
        .cloned()
        .ok_or_else(|| format!("Dados para o ano {} não encontrados", year_b))?;

    let diff_kwh = sum_b.total_kwh - sum_a.total_kwh;
    let pct_kwh = if sum_a.total_kwh > 0.0 {
        (diff_kwh / sum_a.total_kwh) * 100.0
    } else {
        0.0
    };

    let diff_cents = sum_b.total_cents - sum_a.total_cents;
    let pct_cents = if sum_a.total_cents > 0 {
        ((diff_cents as f64) / (sum_a.total_cents as f64)) * 100.0
    } else {
        0.0
    };

    let is_savings = diff_kwh < 0.0 || (diff_kwh == 0.0 && diff_cents <= 0);

    Ok(YearComparisonResult {
        year_a: sum_a,
        year_b: sum_b,
        diff_kwh: (diff_kwh * 10.0).round() / 10.0,
        pct_kwh: (pct_kwh * 10.0).round() / 10.0,
        diff_cents,
        pct_cents: (pct_cents * 10.0).round() / 10.0,
        is_savings,
    })
}
