use crate::database::{Database, Repository};
use crate::models::AppSettings;
use tauri::State;

#[tauri::command]
pub fn get_settings(db: State<'_, Database>) -> Result<AppSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    if settings.household_name.contains("Silva") {
        settings.household_name = "Minha Residência".to_string();
        let _ = Repository::update_settings(&conn, &settings);
    }
    Ok(settings)
}

#[tauri::command]
pub fn update_settings(
    db: State<'_, Database>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::update_settings(&conn, &settings).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub fn complete_onboarding(
    db: State<'_, Database>,
    household_name: String,
    city: String,
    first_bill_kwh: f64,
    first_bill_cents: i64,
    monthly_goal_kwh: f64,
) -> Result<AppSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut current = Repository::get_settings(&conn).map_err(|e| e.to_string())?;

    current.household_name = household_name;
    current.city = city;
    current.monthly_kwh_goal = monthly_goal_kwh;
    current.onboarding_completed = true;

    // Se informou conta inicial, calcula tarifa padrão estimada
    if first_bill_kwh > 0.0 && first_bill_cents > 0 {
        current.default_kwh_rate_cents =
            crate::energy_engine::effective_rate_cents(first_bill_cents, first_bill_kwh);

        // Criar primeira fatura no histórico
        let now = chrono::Local::now();
        let bill = crate::models::EnergyBill {
            id: uuid::Uuid::new_v4().to_string(),
            month: now.month(),
            year: now.year(),
            start_date: None,
            end_date: None,
            kwh_total: first_bill_kwh,
            total_cents: first_bill_cents,
            kwh_rate_cents: Some(current.default_kwh_rate_cents),
            additional_taxes_cents: 0,
            tariff_flag: "Verde".to_string(),
            distributor: "Celesc".to_string(),
            notes: Some("Fatura cadastrada no onboarding inicial".to_string()),
            created_at: chrono::Utc::now().to_rfc3339(),
        };
        let _ = Repository::create_bill(&conn, &bill);
    }

    use chrono::Datelike;

    Repository::update_settings(&conn, &current).map_err(|e| e.to_string())?;
    Ok(current)
}
