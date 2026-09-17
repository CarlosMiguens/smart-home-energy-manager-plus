use crate::database::{Database, Repository};
use crate::energy_engine::generate_recommendations;
use crate::models::{SavingPlan, SavingPlanAction};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanRecommendationResponse {
    pub actions: Vec<SavingPlanAction>,
    pub total_saved_kwh_month: f64,
    pub total_saved_cents_month: i64,
    pub total_saved_cents_year: i64,
}

#[tauri::command]
pub fn list_saving_plans(db: State<'_, Database>) -> Result<Vec<SavingPlan>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::list_plans(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn generate_plan_suggestions(
    db: State<'_, Database>,
    target_type: String,
    target_value: f64,
) -> Result<PlanRecommendationResponse, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    let devices = Repository::list_devices(&conn).map_err(|e| e.to_string())?;

    let (actions, saved_kwh, saved_cents) = generate_recommendations(
        &devices,
        &target_type,
        target_value,
        settings.default_kwh_rate_cents,
    );

    Ok(PlanRecommendationResponse {
        actions,
        total_saved_kwh_month: (saved_kwh * 10.0).round() / 10.0,
        total_saved_cents_month: saved_cents,
        total_saved_cents_year: saved_cents * 12,
    })
}

#[tauri::command]
pub fn create_saving_plan(
    db: State<'_, Database>,
    mut plan: SavingPlan,
) -> Result<SavingPlan, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if plan.id.trim().is_empty() {
        plan.id = uuid::Uuid::new_v4().to_string();
    }
    if plan.created_at.trim().is_empty() {
        plan.created_at = chrono::Utc::now().to_rfc3339();
    }
    for action in &mut plan.actions {
        if action.id.trim().is_empty() {
            action.id = uuid::Uuid::new_v4().to_string();
        }
        action.plan_id = plan.id.clone();
    }

    Repository::create_plan(&conn, &plan).map_err(|e| e.to_string())?;
    Ok(plan)
}

#[tauri::command]
pub fn toggle_saving_plan(
    db: State<'_, Database>,
    id: String,
    is_active: bool,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::toggle_plan_active(&conn, &id, is_active).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_saving_plan(db: State<'_, Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::delete_plan(&conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}
