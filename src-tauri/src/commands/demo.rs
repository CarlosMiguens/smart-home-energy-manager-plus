use crate::database::{Database, Repository};
use crate::models::*;
use tauri::State;

#[tauri::command]
pub fn seed_demo_data(db: State<'_, Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Limpar dados anteriores
    Repository::clear_all_data(&conn).map_err(|e| e.to_string())?;

    // Atualizar settings para demo
    let mut settings = Repository::get_settings(&conn).map_err(|e| e.to_string())?;
    // Preservar o nome da casa configurado pelo usuário, se já existir
    if settings.household_name.is_empty() || settings.household_name.contains("Silva") || settings.household_name == "Casa Videira" {
        settings.household_name = "Casa Modelo (Videira SC)".to_string();
    }
    settings.city = "Videira".to_string();
    settings.state = "Santa Catarina".to_string();
    settings.country = "Brasil".to_string();
    settings.currency = "BRL".to_string();
    settings.default_kwh_rate_cents = 88.5; // R$ 0,885/kWh (Celesc SC)
    settings.monthly_kwh_goal = 280.0;
    settings.onboarding_completed = true;
    settings.is_demo_data_loaded = true;
    Repository::update_settings(&conn, &settings).map_err(|e| e.to_string())?;

    let now_str = chrono::Utc::now().to_rfc3339();

    // 1. Criar 4 usuários internos
    let users = vec![
        InternalUser {
            id: "user-1".to_string(),
            name: "Carlos".to_string(),
            avatar: "UserCheck".to_string(),
            color: "#2d6a4f".to_string(),
            notes: Some("Utiliza escritório e ar do quarto".to_string()),
            created_at: now_str.clone(),
        },
        InternalUser {
            id: "user-2".to_string(),
            name: "Ana".to_string(),
            avatar: "Smile".to_string(),
            color: "#40916c".to_string(),
            notes: Some("Cozinha e eletros gerais".to_string()),
            created_at: now_str.clone(),
        },
        InternalUser {
            id: "user-3".to_string(),
            name: "João".to_string(),
            avatar: "Gamepad2".to_string(),
            color: "#52796f".to_string(),
            notes: Some("Videogame e TV da sala".to_string()),
            created_at: now_str.clone(),
        },
        InternalUser {
            id: "user-4".to_string(),
            name: "Maria".to_string(),
            avatar: "Heart".to_string(),
            color: "#84a98c".to_string(),
            notes: Some("Quarto de hóspedes e estudos".to_string()),
            created_at: now_str.clone(),
        },
    ];

    for u in &users {
        Repository::create_user(&conn, u).map_err(|e| e.to_string())?;
    }

    // 2. Criar 6 cômodos
    let rooms = vec![
        Room {
            id: "room-1".to_string(),
            name: "Sala de Estar".to_string(),
            icon: "Sofa".to_string(),
            order_index: 1,
            created_at: now_str.clone(),
        },
        Room {
            id: "room-2".to_string(),
            name: "Cozinha".to_string(),
            icon: "UtensilsCrossed".to_string(),
            order_index: 2,
            created_at: now_str.clone(),
        },
        Room {
            id: "room-3".to_string(),
            name: "Quarto Casal".to_string(),
            icon: "BedDouble".to_string(),
            order_index: 3,
            created_at: now_str.clone(),
        },
        Room {
            id: "room-4".to_string(),
            name: "Banheiro".to_string(),
            icon: "Bath".to_string(),
            order_index: 4,
            created_at: now_str.clone(),
        },
        Room {
            id: "room-5".to_string(),
            name: "Escritório".to_string(),
            icon: "Briefcase".to_string(),
            order_index: 5,
            created_at: now_str.clone(),
        },
        Room {
            id: "room-6".to_string(),
            name: "Lavanderia".to_string(),
            icon: "Shirt".to_string(),
            order_index: 6,
            created_at: now_str.clone(),
        },
    ];

    for r in &rooms {
        Repository::create_room(&conn, r).map_err(|e| e.to_string())?;
    }

    // 3. Criar 10 aparelhos representativos
    let devices = vec![
        Device {
            id: "dev-1".to_string(),
            name: "Ar-condicionado Inverter".to_string(),
            category: "Ar-condicionado".to_string(),
            power_watts: 1200.0,
            quantity: 1,
            hours_per_day: 6.0,
            days_per_month: 30,
            room_id: Some("room-3".to_string()),
            room_name: Some("Quarto Casal".to_string()),
            user_id: Some("user-1".to_string()),
            user_name: Some("Carlos".to_string()),
            notes: Some("Ciclo quente/frio em Videira SC".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-2".to_string(),
            name: "Chuveiro Eletrônico".to_string(),
            category: "Chuveiro".to_string(),
            power_watts: 5500.0,
            quantity: 1,
            hours_per_day: 0.6, // ~36 minutos somados da família
            days_per_month: 30,
            room_id: Some("room-4".to_string()),
            room_name: Some("Banheiro".to_string()),
            user_id: None,
            user_name: None,
            notes: Some("Banhos diários no inverno catarinense".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-3".to_string(),
            name: "Geladeira Frost Free Duplex".to_string(),
            category: "Geladeira".to_string(),
            power_watts: 160.0,
            quantity: 1,
            hours_per_day: 10.0, // ciclo do compressor ativo
            days_per_month: 30,
            room_id: Some("room-2".to_string()),
            room_name: Some("Cozinha".to_string()),
            user_id: Some("user-2".to_string()),
            user_name: Some("Ana".to_string()),
            notes: Some("Compressor Procel A".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-4".to_string(),
            name: "Smart TV 55\" 4K".to_string(),
            category: "Televisor".to_string(),
            power_watts: 140.0,
            quantity: 1,
            hours_per_day: 5.0,
            days_per_month: 30,
            room_id: Some("room-1".to_string()),
            room_name: Some("Sala de Estar".to_string()),
            user_id: Some("user-3".to_string()),
            user_name: Some("João".to_string()),
            notes: Some("Streaming e filmes familiares".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-5".to_string(),
            name: "Computador Desktop + Monitor".to_string(),
            category: "Computador".to_string(),
            power_watts: 250.0,
            quantity: 1,
            hours_per_day: 6.0,
            days_per_month: 22,
            room_id: Some("room-5".to_string()),
            room_name: Some("Escritório".to_string()),
            user_id: Some("user-1".to_string()),
            user_name: Some("Carlos".to_string()),
            notes: Some("Home office e engenharia".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-6".to_string(),
            name: "Máquina de Lavar Roupas 12kg".to_string(),
            category: "Máquina de lavar".to_string(),
            power_watts: 600.0,
            quantity: 1,
            hours_per_day: 1.5,
            days_per_month: 12, // 3x por semana
            room_id: Some("room-6".to_string()),
            room_name: Some("Lavanderia".to_string()),
            user_id: Some("user-2".to_string()),
            user_name: Some("Ana".to_string()),
            notes: Some("Ciclos de lavagem completa".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-7".to_string(),
            name: "Micro-ondas 30L".to_string(),
            category: "Micro-ondas".to_string(),
            power_watts: 1200.0,
            quantity: 1,
            hours_per_day: 0.3, // 18 min
            days_per_month: 30,
            room_id: Some("room-2".to_string()),
            room_name: Some("Cozinha".to_string()),
            user_id: None,
            user_name: None,
            notes: Some("Aquecimento rápido de refeições".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-8".to_string(),
            name: "Console de Videogame".to_string(),
            category: "Videogame".to_string(),
            power_watts: 180.0,
            quantity: 1,
            hours_per_day: 2.5,
            days_per_month: 20,
            room_id: Some("room-1".to_string()),
            room_name: Some("Sala de Estar".to_string()),
            user_id: Some("user-3".to_string()),
            user_name: Some("João".to_string()),
            notes: Some("Jogos nos finais de tarde".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-9".to_string(),
            name: "Iluminação LED Geral".to_string(),
            category: "Iluminação".to_string(),
            power_watts: 90.0, // conjunto de lâmpadas
            quantity: 1,
            hours_per_day: 5.0,
            days_per_month: 30,
            room_id: None,
            room_name: None,
            user_id: None,
            user_name: None,
            notes: Some("Lâmpadas LED espalhadas na casa".to_string()),
            created_at: now_str.clone(),
        },
        Device {
            id: "dev-10".to_string(),
            name: "Aquecedor de Ambiente a Óleo".to_string(),
            category: "Aquecedor".to_string(),
            power_watts: 1500.0,
            quantity: 1,
            hours_per_day: 2.0,
            days_per_month: 15,
            room_id: Some("room-3".to_string()),
            room_name: Some("Quarto Casal".to_string()),
            user_id: Some("user-4".to_string()),
            user_name: Some("Maria".to_string()),
            notes: Some("Utilizado nos dias mais frios do inverno em Videira".to_string()),
            created_at: now_str.clone(),
        },
    ];

    for d in &devices {
        Repository::create_device(&conn, d).map_err(|e| e.to_string())?;
    }

    // 4. Criar 12 meses de contas reais e coerentes (com sazonalidade de Videira SC)
    // Meses de inverno (Jun/Jul/Ago) com mais chuveiro/aquecedor; verão (Dez/Jan/Fev) com mais ar
    let bills_data = vec![
        // (mês, ano, kWh, total_centavos, bandeira)
        (8, 2026, 321.0, 28730, "Verde"),    // Agosto 2026
        (7, 2026, 348.0, 30150, "Amarela"),  // Julho 2026
        (6, 2026, 335.0, 29815, "Verde"),    // Junho 2026
        (5, 2026, 310.0, 27435, "Verde"),    // Maio 2026
        (4, 2026, 295.0, 26107, "Verde"),    // Abril 2026
        (3, 2026, 305.0, 26992, "Verde"),    // Março 2026
        (2, 2026, 330.0, 29205, "Amarela"),  // Fevereiro 2026
        (1, 2026, 340.0, 30090, "Amarela"),  // Janeiro 2026
        (12, 2025, 332.0, 29382, "Verde"),   // Dezembro 2025
        (11, 2025, 298.0, 26373, "Verde"),   // Novembro 2025
        (10, 2025, 285.0, 25222, "Verde"),   // Outubro 2025
        (9, 2025, 315.0, 27877, "Verde"),    // Setembro 2025
    ];

    for (m, y, kwh, cents, flag) in bills_data {
        let eff = (cents as f64) / kwh;
        let b = EnergyBill {
            id: format!("bill-{}-{}", y, m),
            month: m,
            year: y,
            start_date: Some(format!("{}-{:02}-01", y, m)),
            end_date: Some(format!("{}-{:02}-28", y, m)),
            kwh_total: kwh,
            total_cents: cents,
            kwh_rate_cents: Some((eff * 100.0).round() / 100.0),
            additional_taxes_cents: 0,
            tariff_flag: flag.to_string(),
            distributor: "Celesc".to_string(),
            notes: Some("Conta de luz demonstrativa - Videira SC".to_string()),
            created_at: now_str.clone(),
        };
        Repository::create_bill(&conn, &b).map_err(|e| e.to_string())?;
    }

    // 5. Criar 1 plano de economia de demonstração ativo
    let plan = SavingPlan {
        id: "plan-demo-1".to_string(),
        name: "Plano Econômico Videira -10%".to_string(),
        target_type: "percent".to_string(),
        target_value: 10.0,
        is_active: true,
        created_at: now_str.clone(),
        actions: vec![
            SavingPlanAction {
                id: "act-1".to_string(),
                plan_id: "plan-demo-1".to_string(),
                device_id: "dev-1".to_string(),
                device_name: "Ar-condicionado Inverter".to_string(),
                current_hours: 6.0,
                proposed_hours: 5.0,
                saved_kwh_month: 36.0,
                saved_cents_month: 3186, // R$ 31,86
            },
            SavingPlanAction {
                id: "act-2".to_string(),
                plan_id: "plan-demo-1".to_string(),
                device_id: "dev-2".to_string(),
                device_name: "Chuveiro Eletrônico".to_string(),
                current_hours: 0.6,
                proposed_hours: 0.45,
                saved_kwh_month: 24.7,
                saved_cents_month: 2185, // R$ 21,85
            },
        ],
        total_saved_kwh_month: 60.7,
        total_saved_cents_month: 5371, // R$ 53,71
        total_saved_cents_year: 5371 * 12, // R$ 644,52
    };

    Repository::create_plan(&conn, &plan).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn clear_demo_data(db: State<'_, Database>) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    Repository::clear_all_data(&conn).map_err(|e| e.to_string())
}
