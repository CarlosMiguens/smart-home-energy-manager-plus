use crate::database::{Database, Repository};
use crate::energy_engine::{calculate_cost_cents, monthly_kwh};
use crate::models::{Room, RoomConsumptionSummary};
use tauri::State;

#[tauri::command]
pub fn list_rooms_with_metrics(
    db: State<'_, Database>,
) -> Result<Vec<RoomConsumptionSummary>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    let rooms = Repository::list_rooms(&conn).map_err(|e| e.to_string())?;
    let devices = Repository::list_devices(&conn).map_err(|e| e.to_string())?;

    let rate_cents = settings.default_kwh_rate_cents;

    let total_home_kwh: f64 = devices
        .iter()
        .map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month))
        .sum();

    let mut summaries = Vec::new();
    for r in rooms {
        let room_devices: Vec<_> = devices
            .iter()
            .filter(|d| d.room_id.as_deref() == Some(&r.id))
            .collect();

        let device_count = room_devices.len();
        let r_kwh: f64 = room_devices
            .iter()
            .map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month))
            .sum();

        let r_cents = calculate_cost_cents(r_kwh, rate_cents);
        let pct = if total_home_kwh > 0.0 {
            (r_kwh / total_home_kwh) * 100.0
        } else {
            0.0
        };

        summaries.push(RoomConsumptionSummary {
            room: r,
            device_count,
            estimated_monthly_kwh: (r_kwh * 10.0).round() / 10.0,
            estimated_monthly_cents: r_cents,
            percentage_of_home: (pct * 10.0).round() / 10.0,
        });
    }

    Ok(summaries)
}

#[tauri::command]
pub fn create_room(db: State<'_, Database>, mut room: Room) -> Result<Room, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if room.id.trim().is_empty() {
        room.id = uuid::Uuid::new_v4().to_string();
    }
    if room.created_at.trim().is_empty() {
        room.created_at = chrono::Utc::now().to_rfc3339();
    }
    Repository::create_room(&conn, &room).map_err(|e| e.to_string())?;
    Ok(room)
}

#[tauri::command]
pub fn update_room(db: State<'_, Database>, room: Room) -> Result<Room, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::update_room(&conn, &room).map_err(|e| e.to_string())?;
    Ok(room)
}

#[tauri::command]
pub fn delete_room(db: State<'_, Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::delete_room(&conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}
