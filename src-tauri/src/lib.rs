pub mod commands;
pub mod database;
pub mod energy_engine;
pub mod models;

use database::Database;
use std::path::PathBuf;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Obter diretório de dados local do app
            let db_path: PathBuf = match app.path().app_data_dir() {
                Ok(mut path) => {
                    path.push("smart_energy.db");
                    path
                }
                Err(_) => PathBuf::from("smart_energy.db"),
            };

            let db = Database::new(db_path).expect("Falha ao inicializar banco de dados SQLite local");
            app.manage(db);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Faturas
            commands::list_bills,
            commands::create_bill,
            commands::update_bill,
            commands::delete_bill,
            commands::duplicate_bill,
            // Dispositivos
            commands::list_devices_with_metrics,
            commands::create_device,
            commands::update_device,
            commands::delete_device,
            // Usuários
            commands::list_users_with_metrics,
            commands::create_user,
            commands::update_user,
            commands::delete_user,
            // Cômodos
            commands::list_rooms_with_metrics,
            commands::create_room,
            commands::update_room,
            commands::delete_room,
            // Dashboard
            commands::get_dashboard_summary,
            // Comparações
            commands::compare_two_bills,
            commands::get_annual_summaries,
            commands::compare_two_years,
            // Simulador
            commands::simulate_device,
            commands::apply_simulation_to_device,
            // Planos de Economia
            commands::list_saving_plans,
            commands::generate_plan_suggestions,
            commands::create_saving_plan,
            commands::toggle_saving_plan,
            commands::delete_saving_plan,
            // Configurações e Onboarding
            commands::get_settings,
            commands::update_settings,
            commands::complete_onboarding,
            // Demonstração
            commands::seed_demo_data,
            commands::clear_demo_data,
            // Relatórios
            commands::get_comprehensive_report,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao executar Smart Home Energy Manager Plus");
}
