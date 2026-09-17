use crate::database::{Database, Repository};
use crate::energy_engine::{simulate_device_usage, SimulationResult};
use tauri::State;

#[tauri::command]
pub fn simulate_device(
    db: State<'_, Database>,
    device_id: String,
    new_hours_per_day: f64,
) -> Result<SimulationResult, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    let devices = Repository::list_devices(&conn).map_err(|e| e.to_string())?;

    let device = devices
        .iter()
        .find(|d| d.id == device_id)
        .ok_or_else(|| "Aparelho não encontrado".to_string())?;

    let result = simulate_device_usage(
        device.id.clone(),
        device.name.clone(),
        device.power_watts,
        device.quantity,
        device.days_per_month,
        device.hours_per_day,
        new_hours_per_day,
        settings.default_kwh_rate_cents,
    );

    Ok(result)
}

#[tauri::command]
pub fn apply_simulation_to_device(
    db: State<'_, Database>,
    device_id: String,
    new_hours_per_day: f64,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let devices = Repository::list_devices(&conn).map_err(|e| e.to_string())?;

    let mut device = devices
        .iter()
        .find(|d| d.id == device_id)
        .cloned()
        .ok_or_else(|| "Aparelho não encontrado".to_string())?;

    device.hours_per_day = new_hours_per_day;
    Repository::update_device(&conn, &device).map_err(|e| e.to_string())?;
    Ok(())
}
