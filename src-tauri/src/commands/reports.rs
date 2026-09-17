use crate::database::{Database, Repository};
use crate::energy_engine::{calculate_cost_cents, monthly_kwh};
use crate::models::{AppSettings, DeviceCalculatedMetrics, EnergyBill, RoomConsumptionSummary, SavingPlan, UserConsumptionSummary};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComprehensiveReportData {
    pub settings: AppSettings,
    pub bills: Vec<EnergyBill>,
    pub devices: Vec<DeviceCalculatedMetrics>,
    pub users: Vec<UserConsumptionSummary>,
    pub rooms: Vec<RoomConsumptionSummary>,
    pub plans: Vec<SavingPlan>,
    pub total_kwh_all_time: f64,
    pub total_cents_all_time: i64,
    pub average_monthly_kwh: f64,
    pub generated_at: String,
}

#[tauri::command]
pub fn get_comprehensive_report(
    db: State<'_, Database>,
) -> Result<ComprehensiveReportData, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    let bills = Repository::list_bills(&conn).map_err(|e| e.to_string())?;
    let raw_devices = Repository::list_devices(&conn).map_err(|e| e.to_string())?;
    let raw_users = Repository::list_users(&conn).map_err(|e| e.to_string())?;
    let raw_rooms = Repository::list_rooms(&conn).map_err(|e| e.to_string())?;
    let plans = Repository::list_plans(&conn).map_err(|e| e.to_string())?;

    let rate_cents = settings.default_kwh_rate_cents;

    let total_kwh_all_time: f64 = bills.iter().map(|b| b.kwh_total).sum();
    let total_cents_all_time: i64 = bills.iter().map(|b| b.total_cents).sum();
    let avg_kwh = if !bills.is_empty() {
        total_kwh_all_time / (bills.len() as f64)
    } else {
        0.0
    };

    let total_home_devices_kwh: f64 = raw_devices
        .iter()
        .map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month))
        .sum();

    // Dispositivos calculados
    let mut devices = Vec::new();
    for d in raw_devices.iter() {
        let p_kw = d.power_watts / 1000.0;
        let d_kwh = p_kw * (d.quantity as f64) * d.hours_per_day;
        let m_kwh = p_kw * (d.quantity as f64) * d.hours_per_day * (d.days_per_month as f64);
        let m_cents = calculate_cost_cents(m_kwh, rate_cents);
        let pct = if total_home_devices_kwh > 0.0 {
            (m_kwh / total_home_devices_kwh) * 100.0
        } else {
            0.0
        };

        devices.push(DeviceCalculatedMetrics {
            device: d.clone(),
            power_kw: p_kw,
            daily_kwh: (d_kwh * 100.0).round() / 100.0,
            monthly_kwh: (m_kwh * 10.0).round() / 10.0,
            hourly_cost_cents: calculate_cost_cents(p_kw * (d.quantity as f64), rate_cents),
            daily_cost_cents: calculate_cost_cents(d_kwh, rate_cents),
            monthly_cost_cents: m_cents,
            percentage_of_total: (pct * 10.0).round() / 10.0,
            cost_15min_cents: calculate_cost_cents(p_kw * (d.quantity as f64) * 0.25, rate_cents),
            cost_30min_cents: calculate_cost_cents(p_kw * (d.quantity as f64) * 0.5, rate_cents),
            cost_1h_cents: calculate_cost_cents(p_kw * (d.quantity as f64) * 1.0, rate_cents),
            cost_2h_cents: calculate_cost_cents(p_kw * (d.quantity as f64) * 2.0, rate_cents),
        });
    }

    // Usuários com métricas
    let mut users = Vec::new();
    for u in raw_users {
        let u_devs: Vec<_> = raw_devices.iter().filter(|d| d.user_id.as_deref() == Some(&u.id)).collect();
        let u_kwh: f64 = u_devs.iter().map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month)).sum();
        let u_cents = calculate_cost_cents(u_kwh, rate_cents);
        let pct = if total_home_devices_kwh > 0.0 { (u_kwh / total_home_devices_kwh) * 100.0 } else { 0.0 };
        users.push(UserConsumptionSummary {
            user: u,
            device_count: u_devs.len(),
            estimated_monthly_kwh: (u_kwh * 10.0).round() / 10.0,
            estimated_monthly_cents: u_cents,
            percentage_of_home: (pct * 10.0).round() / 10.0,
        });
    }

    // Cômodos com métricas
    let mut rooms = Vec::new();
    for r in raw_rooms {
        let r_devs: Vec<_> = raw_devices.iter().filter(|d| d.room_id.as_deref() == Some(&r.id)).collect();
        let r_kwh: f64 = r_devs.iter().map(|d| monthly_kwh(d.power_watts, d.quantity, d.hours_per_day, d.days_per_month)).sum();
        let r_cents = calculate_cost_cents(r_kwh, rate_cents);
        let pct = if total_home_devices_kwh > 0.0 { (r_kwh / total_home_devices_kwh) * 100.0 } else { 0.0 };
        rooms.push(RoomConsumptionSummary {
            room: r,
            device_count: r_devs.len(),
            estimated_monthly_kwh: (r_kwh * 10.0).round() / 10.0,
            estimated_monthly_cents: r_cents,
            percentage_of_home: (pct * 10.0).round() / 10.0,
        });
    }

    Ok(ComprehensiveReportData {
        settings,
        bills,
        devices,
        users,
        rooms,
        plans,
        total_kwh_all_time: (total_kwh_all_time * 10.0).round() / 10.0,
        total_cents_all_time,
        average_monthly_kwh: (avg_kwh * 10.0).round() / 10.0,
        generated_at: chrono::Local::now().to_rfc3339(),
    })
}
