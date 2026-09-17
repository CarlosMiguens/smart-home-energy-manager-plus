use rusqlite::{params, Connection, Result};

pub fn apply_migrations(conn: &Connection) -> Result<()> {
    // Tabela de controle de versões de migração
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
        [],
    )?;

    let current_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations;",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if current_version < 1 {
        apply_v1(conn)?;
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (1);",
            params![],
        )?;
    }

    Ok(())
}

fn apply_v1(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        -- Configurações da residência (Padrão Videira SC)
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            household_name TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            country TEXT NOT NULL,
            currency TEXT NOT NULL,
            default_kwh_rate_cents REAL NOT NULL,
            monthly_kwh_goal REAL NOT NULL,
            theme TEXT NOT NULL,
            energy_unit TEXT NOT NULL,
            billing_cycle_start_day INTEGER NOT NULL,
            onboarding_completed INTEGER NOT NULL DEFAULT 0,
            is_demo_data_loaded INTEGER NOT NULL DEFAULT 0
        );

        INSERT OR IGNORE INTO settings (
            id, household_name, city, state, country, currency,
            default_kwh_rate_cents, monthly_kwh_goal, theme, energy_unit,
            billing_cycle_start_day, onboarding_completed, is_demo_data_loaded
        ) VALUES (
            1, 'Minha Residência', 'Videira', 'Santa Catarina', 'Brasil', 'BRL',
            88.5, 280.0, 'dark', 'kWh', 1, 0, 0
        );

        -- Perfis de usuários internos da residência
        CREATE TABLE IF NOT EXISTS internal_users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            avatar TEXT NOT NULL,
            color TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL
        );

        -- Cômodos da residência
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        -- Dispositivos elétricos e eletrodomésticos
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            power_watts REAL NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            hours_per_day REAL NOT NULL,
            days_per_month INTEGER NOT NULL DEFAULT 30,
            room_id TEXT,
            user_id TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES internal_users(id) ON DELETE SET NULL
        );

        -- Faturas de energia elétrica
        CREATE TABLE IF NOT EXISTS energy_bills (
            id TEXT PRIMARY KEY,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            start_date TEXT,
            end_date TEXT,
            kwh_total REAL NOT NULL,
            total_cents INTEGER NOT NULL,
            kwh_rate_cents REAL,
            additional_taxes_cents INTEGER NOT NULL DEFAULT 0,
            tariff_flag TEXT NOT NULL DEFAULT 'Verde',
            distributor TEXT NOT NULL DEFAULT 'Celesc',
            notes TEXT,
            created_at TEXT NOT NULL,
            UNIQUE(month, year)
        );

        -- Planos de economia
        CREATE TABLE IF NOT EXISTS saving_plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_value REAL NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        -- Ações recomendadas do plano de economia
        CREATE TABLE IF NOT EXISTS saving_plan_actions (
            id TEXT PRIMARY KEY,
            plan_id TEXT NOT NULL,
            device_id TEXT NOT NULL,
            device_name TEXT NOT NULL,
            current_hours REAL NOT NULL,
            proposed_hours REAL NOT NULL,
            saved_kwh_month REAL NOT NULL,
            saved_cents_month INTEGER NOT NULL,
            FOREIGN KEY (plan_id) REFERENCES saving_plans(id) ON DELETE CASCADE
        );
        ",
    )?;

    Ok(())
}
