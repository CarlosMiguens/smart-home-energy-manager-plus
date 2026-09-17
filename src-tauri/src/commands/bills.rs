use crate::database::{Database, Repository};
use crate::energy_engine::effective_rate_cents;
use crate::models::{BillCardView, EnergyBill};
use tauri::State;

#[tauri::command]
pub fn list_bills(db: State<'_, Database>) -> Result<Vec<BillCardView>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let bills = Repository::list_bills(&conn).map_err(|e| e.to_string())?;

    let mut views = Vec::new();
    let n = bills.len();

    for i in 0..n {
        let b = &bills[i];
        let eff_rate = effective_rate_cents(b.total_cents, b.kwh_total);

        // A conta imediatamente anterior no tempo é a próxima no vetor (pois está ordenado DESC)
        let (diff_kwh, diff_kwh_pct, diff_cents, diff_cents_pct) = if i + 1 < n {
            let prev = &bills[i + 1];
            let comp = crate::energy_engine::compare_periods(
                prev.kwh_total,
                b.kwh_total,
                prev.total_cents,
                b.total_cents,
            );
            (
                Some(comp.diff_kwh),
                Some(comp.pct_kwh),
                Some(comp.diff_cents),
                Some(comp.pct_cents),
            )
        } else {
            (None, None, None, None)
        };

        views.push(BillCardView {
            bill: b.clone(),
            effective_rate_cents: eff_rate,
            diff_kwh,
            diff_kwh_pct,
            diff_cents,
            diff_cents_pct,
        });
    }

    Ok(views)
}

#[tauri::command]
pub fn create_bill(db: State<'_, Database>, mut bill: EnergyBill) -> Result<EnergyBill, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if bill.id.trim().is_empty() {
        bill.id = uuid::Uuid::new_v4().to_string();
    }
    if bill.created_at.trim().is_empty() {
        bill.created_at = chrono::Utc::now().to_rfc3339();
    }
    // Se o usuário não informou tarifa explícita, calcula a taxa média estimada
    if bill.kwh_rate_cents.is_none() || bill.kwh_rate_cents.unwrap_or(0.0) <= 0.0 {
        bill.kwh_rate_cents = Some(effective_rate_cents(bill.total_cents, bill.kwh_total));
    }

    Repository::create_bill(&conn, &bill).map_err(|e| e.to_string())?;
    Ok(bill)
}

#[tauri::command]
pub fn update_bill(db: State<'_, Database>, mut bill: EnergyBill) -> Result<EnergyBill, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if bill.kwh_rate_cents.is_none() || bill.kwh_rate_cents.unwrap_or(0.0) <= 0.0 {
        bill.kwh_rate_cents = Some(effective_rate_cents(bill.total_cents, bill.kwh_total));
    }
    Repository::update_bill(&conn, &bill).map_err(|e| e.to_string())?;
    Ok(bill)
}

#[tauri::command]
pub fn delete_bill(db: State<'_, Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::delete_bill(&conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn duplicate_bill(db: State<'_, Database>, id: String) -> Result<EnergyBill, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let existing = Repository::get_bill(&conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Fatura não encontrada".to_string())?;

    let mut next_month = existing.month + 1;
    let mut next_year = existing.year;
    if next_month > 12 {
        next_month = 1;
        next_year += 1;
    }

    let duplicated = EnergyBill {
        id: uuid::Uuid::new_v4().to_string(),
        month: next_month,
        year: next_year,
        start_date: None,
        end_date: None,
        kwh_total: existing.kwh_total,
        total_cents: existing.total_cents,
        kwh_rate_cents: existing.kwh_rate_cents,
        additional_taxes_cents: existing.additional_taxes_cents,
        tariff_flag: existing.tariff_flag,
        distributor: existing.distributor,
        notes: Some(format!("Duplicada de {}/{}", existing.month, existing.year)),
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    Repository::create_bill(&conn, &duplicated).map_err(|e| e.to_string())?;
    Ok(duplicated)
}
