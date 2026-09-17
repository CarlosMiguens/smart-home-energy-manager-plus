use crate::database::{Database, Repository};
use crate::energy_engine::{calculate_cost_cents, monthly_kwh};
use crate::models::{InternalUser, UserConsumptionSummary};
use tauri::State;

#[tauri::command]
pub fn list_users_with_metrics(
    db: State<'_, Database>,
) -> Result<Vec<UserConsumptionSummary>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    let users = Repository::list_users(&conn).map_err(|e| e.to_string())?;
    let devices = Repository::list_devices(&conn).map_err(|e| e.to_string())?;

    let rate_cents = settings.default_kwh_rate_cents;

    let total_home_kwh: f64 = devices
        .iter()
        .map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month))
        .sum();

    let mut summaries = Vec::new();
    for u in users {
        let user_devices: Vec<_> = devices
            .iter()
            .filter(|d| d.user_id.as_deref() == Some(&u.id))
            .collect();

        let device_count = user_devices.len();
        let u_kwh: f64 = user_devices
            .iter()
            .map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month))
            .sum();

        let u_cents = calculate_cost_cents(u_kwh, rate_cents);
        let pct = if total_home_kwh > 0.0 {
            (u_kwh / total_home_kwh) * 100.0
        } else {
            0.0
        };

        summaries.push(UserConsumptionSummary {
            user: u,
            device_count,
            estimated_monthly_kwh: (u_kwh * 10.0).round() / 10.0,
            estimated_monthly_cents: u_cents,
            percentage_of_home: (pct * 10.0).round() / 10.0,
        });
    }

    Ok(summaries)
}

#[tauri::command]
pub fn create_user(db: State<'_, Database>, mut user: InternalUser) -> Result<InternalUser, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if user.id.trim().is_empty() {
        user.id = uuid::Uuid::new_v4().to_string();
    }
    if user.created_at.trim().is_empty() {
        user.created_at = chrono::Utc::now().to_rfc3339();
    }
    Repository::create_user(&conn, &user).map_err(|e| e.to_string())?;
    Ok(user)
}

#[tauri::command]
pub fn update_user(db: State<'_, Database>, user: InternalUser) -> Result<InternalUser, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::update_user(&conn, &user).map_err(|e| e.to_string())?;
    Ok(user)
}

#[tauri::command]
pub fn delete_user(db: State<'_, Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::delete_user(&conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}
