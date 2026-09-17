use crate::database::{Database, Repository};
use crate::energy_engine::{
    calculate_cost_cents, daily_kwh, duration_cost_cents, monthly_kwh, watts_to_kw,
};
use crate::models::{Device, DeviceCalculatedMetrics};
use tauri::State;

#[tauri::command]
pub fn list_devices_with_metrics(
    db: State<'_, Database>,
) -> Result<Vec<DeviceCalculatedMetrics>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    let devices = Repository::list_devices(&conn).map_err(|e| e.to_string())?;

    // Taxa padrão do kWh
    let rate_cents = settings.default_kwh_rate_cents;

    // Calcular consumo total mensal para determinar porcentagens de cada aparelho
    let total_monthly_kwh: f64 = devices
        .iter()
        .map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month))
        .sum();

    let mut list = Vec::new();
    for d in devices {
        let p_kw = watts_to_kw(d.power_watts);
        let d_kwh = daily_kwh(d.power_watts, d.quantity, d.hours_per_day);
        let m_kwh = monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month);

        let d_cents = calculate_cost_cents(d_kwh, rate_cents);
        let m_cents = calculate_cost_cents(m_kwh, rate_cents);

        let c_15 = duration_cost_cents(d.power_watts, d.quantity, rate_cents, 15.0);
        let c_30 = duration_cost_cents(d.power_watts, d.quantity, rate_cents, 30.0);
        let c_1h = duration_cost_cents(d.power_watts, d.quantity, rate_cents, 60.0);
        let c_2h = duration_cost_cents(d.power_watts, d.quantity, rate_cents, 120.0);

        let pct = if total_monthly_kwh > 0.0 {
            (m_kwh / total_monthly_kwh) * 100.0
        } else {
            0.0
        };

        list.push(DeviceCalculatedMetrics {
            device: d,
            power_kw: p_kw,
            daily_kwh: (d_kwh * 100.0).round() / 100.0,
            monthly_kwh: (m_kwh * 10.0).round() / 10.0,
            hourly_cost_cents: c_1h,
            daily_cost_cents: d_cents,
            monthly_cost_cents: m_cents,
            percentage_of_total: (pct * 10.0).round() / 10.0,
            cost_15min_cents: c_15,
            cost_30min_cents: c_30,
            cost_1h_cents: c_1h,
            cost_2h_cents: c_2h,
        });
    }

    Ok(list)
}

#[tauri::command]
pub fn create_device(db: State<'_, Database>, mut device: Device) -> Result<Device, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if device.id.trim().is_empty() {
        device.id = uuid::Uuid::new_v4().to_string();
    }
    if device.created_at.trim().is_empty() {
        device.created_at = chrono::Utc::now().to_rfc3339();
    }
    Repository::create_device(&conn, &device).map_err(|e| e.to_string())?;
    Ok(device)
}

#[tauri::command]
pub fn update_device(db: State<'_, Database>, device: Device) -> Result<Device, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::update_device(&conn, &device).map_err(|e| e.to_string())?;
    Ok(device)
}

#[tauri::command]
pub fn delete_device(db: State<'_, Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::delete_device(&conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}
