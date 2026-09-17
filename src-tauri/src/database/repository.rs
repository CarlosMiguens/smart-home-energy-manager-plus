use crate::models::*;
use rusqlite::{params, Connection, Result};

pub struct Repository;

impl Repository {
    // ==========================================
    // SETTINGS
    // ==========================================
    pub fn get_settings(conn: &Connection) -> Result<AppSettings> {
        conn.query_row(
            "SELECT id, household_name, city, state, country, currency,
                    default_kwh_rate_cents, monthly_kwh_goal, theme, energy_unit,
                    billing_cycle_start_day, onboarding_completed, is_demo_data_loaded
             FROM settings WHERE id = 1;",
            [],
            |row| {
                Ok(AppSettings {
                    id: row.get(0)?,
                    household_name: row.get(1)?,
                    city: row.get(2)?,
                    state: row.get(3)?,
                    country: row.get(4)?,
                    currency: row.get(5)?,
                    default_kwh_rate_cents: row.get(6)?,
                    monthly_kwh_goal: row.get(7)?,
                    theme: row.get(8)?,
                    energy_unit: row.get(9)?,
                    billing_cycle_start_day: row.get(10)?,
                    onboarding_completed: row.get::<_, i32>(11)? == 1,
                    is_demo_data_loaded: row.get::<_, i32>(12)? == 1,
                })
            },
        )
    }

    pub fn update_settings(conn: &Connection, s: &AppSettings) -> Result<()> {
        conn.execute(
            "UPDATE settings SET
                household_name = ?1,
                city = ?2,
                state = ?3,
                country = ?4,
                currency = ?5,
                default_kwh_rate_cents = ?6,
                monthly_kwh_goal = ?7,
                theme = ?8,
                energy_unit = ?9,
                billing_cycle_start_day = ?10,
                onboarding_completed = ?11,
                is_demo_data_loaded = ?12
             WHERE id = 1;",
            params![
                s.household_name,
                s.city,
                s.state,
                s.country,
                s.currency,
                s.default_kwh_rate_cents,
                s.monthly_kwh_goal,
                s.theme,
                s.energy_unit,
                s.billing_cycle_start_day,
                if s.onboarding_completed { 1 } else { 0 },
                if s.is_demo_data_loaded { 1 } else { 0 },
            ],
        )?;
        Ok(())
    }

    // ==========================================
    // INTERNAL USERS
    // ==========================================
    pub fn list_users(conn: &Connection) -> Result<Vec<InternalUser>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, avatar, color, notes, created_at
             FROM internal_users ORDER BY name ASC;",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(InternalUser {
                id: row.get(0)?,
                name: row.get(1)?,
                avatar: row.get(2)?,
                color: row.get(3)?,
                notes: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        let mut users = Vec::new();
        for r in rows {
            users.push(r?);
        }
        Ok(users)
    }

    pub fn create_user(conn: &Connection, u: &InternalUser) -> Result<()> {
        conn.execute(
            "INSERT INTO internal_users (id, name, avatar, color, notes, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6);",
            params![u.id, u.name, u.avatar, u.color, u.notes, u.created_at],
        )?;
        Ok(())
    }

    pub fn update_user(conn: &Connection, u: &InternalUser) -> Result<()> {
        conn.execute(
            "UPDATE internal_users SET name = ?1, avatar = ?2, color = ?3, notes = ?4
             WHERE id = ?5;",
            params![u.name, u.avatar, u.color, u.notes, u.id],
        )?;
        Ok(())
    }

    pub fn delete_user(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM internal_users WHERE id = ?1;", params![id])?;
        Ok(())
    }

    // ==========================================
    // ROOMS
    // ==========================================
    pub fn list_rooms(conn: &Connection) -> Result<Vec<Room>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, order_index, created_at
             FROM rooms ORDER BY order_index ASC, name ASC;",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Room {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                order_index: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;

        let mut rooms = Vec::new();
        for r in rows {
            rooms.push(r?);
        }
        Ok(rooms)
    }

    pub fn create_room(conn: &Connection, r: &Room) -> Result<()> {
        conn.execute(
            "INSERT INTO rooms (id, name, icon, order_index, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5);",
            params![r.id, r.name, r.icon, r.order_index, r.created_at],
        )?;
        Ok(())
    }

    pub fn update_room(conn: &Connection, r: &Room) -> Result<()> {
        conn.execute(
            "UPDATE rooms SET name = ?1, icon = ?2, order_index = ?3
             WHERE id = ?4;",
            params![r.name, r.icon, r.order_index, r.id],
        )?;
        Ok(())
    }

    pub fn delete_room(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM rooms WHERE id = ?1;", params![id])?;
        Ok(())
    }

    // ==========================================
    // DEVICES
    // ==========================================
    pub fn list_devices(conn: &Connection) -> Result<Vec<Device>> {
        let mut stmt = conn.prepare(
            "SELECT d.id, d.name, d.category, d.power_watts, d.quantity,
                    d.hours_per_day, d.days_per_month, d.room_id, r.name AS room_name,
                    d.user_id, u.name AS user_name, d.notes, d.created_at
             FROM devices d
             LEFT JOIN rooms r ON d.room_id = r.id
             LEFT JOIN internal_users u ON d.user_id = u.id
             ORDER BY d.power_watts * d.quantity * d.hours_per_day DESC;",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Device {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                power_watts: row.get(3)?,
                quantity: row.get(4)?,
                hours_per_day: row.get(5)?,
                days_per_month: row.get(6)?,
                room_id: row.get(7)?,
                room_name: row.get(8)?,
                user_id: row.get(9)?,
                user_name: row.get(10)?,
                notes: row.get(11)?,
                created_at: row.get(12)?,
            })
        })?;

        let mut devices = Vec::new();
        for d in rows {
            devices.push(d?);
        }
        Ok(devices)
    }

    pub fn create_device(conn: &Connection, d: &Device) -> Result<()> {
        conn.execute(
            "INSERT INTO devices (
                id, name, category, power_watts, quantity, hours_per_day,
                days_per_month, room_id, user_id, notes, created_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11);",
            params![
                d.id,
                d.name,
                d.category,
                d.power_watts,
                d.quantity,
                d.hours_per_day,
                d.days_per_month,
                d.room_id,
                d.user_id,
                d.notes,
                d.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn update_device(conn: &Connection, d: &Device) -> Result<()> {
        conn.execute(
            "UPDATE devices SET
                name = ?1,
                category = ?2,
                power_watts = ?3,
                quantity = ?4,
                hours_per_day = ?5,
                days_per_month = ?6,
                room_id = ?7,
                user_id = ?8,
                notes = ?9
             WHERE id = ?10;",
            params![
                d.name,
                d.category,
                d.power_watts,
                d.quantity,
                d.hours_per_day,
                d.days_per_month,
                d.room_id,
                d.user_id,
                d.notes,
                d.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_device(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM devices WHERE id = ?1;", params![id])?;
        Ok(())
    }

    // ==========================================
    // ENERGY BILLS
    // ==========================================
    pub fn list_bills(conn: &Connection) -> Result<Vec<EnergyBill>> {
        let mut stmt = conn.prepare(
            "SELECT id, month, year, start_date, end_date, kwh_total,
                    total_cents, kwh_rate_cents, additional_taxes_cents,
                    tariff_flag, distributor, notes, created_at
             FROM energy_bills
             ORDER BY year DESC, month DESC;",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(EnergyBill {
                id: row.get(0)?,
                month: row.get(1)?,
                year: row.get(2)?,
                start_date: row.get(3)?,
                end_date: row.get(4)?,
                kwh_total: row.get(5)?,
                total_cents: row.get(6)?,
                kwh_rate_cents: row.get(7)?,
                additional_taxes_cents: row.get(8)?,
                tariff_flag: row.get(9)?,
                distributor: row.get(10)?,
                notes: row.get(11)?,
                created_at: row.get(12)?,
            })
        })?;

        let mut bills = Vec::new();
        for b in rows {
            bills.push(b?);
        }
        Ok(bills)
    }

    pub fn get_bill(conn: &Connection, id: &str) -> Result<Option<EnergyBill>> {
        let mut stmt = conn.prepare(
            "SELECT id, month, year, start_date, end_date, kwh_total,
                    total_cents, kwh_rate_cents, additional_taxes_cents,
                    tariff_flag, distributor, notes, created_at
             FROM energy_bills WHERE id = ?1;",
        )?;
        let mut rows = stmt.query_map(params![id], |row| {
            Ok(EnergyBill {
                id: row.get(0)?,
                month: row.get(1)?,
                year: row.get(2)?,
                start_date: row.get(3)?,
                end_date: row.get(4)?,
                kwh_total: row.get(5)?,
                total_cents: row.get(6)?,
                kwh_rate_cents: row.get(7)?,
                additional_taxes_cents: row.get(8)?,
                tariff_flag: row.get(9)?,
                distributor: row.get(10)?,
                notes: row.get(11)?,
                created_at: row.get(12)?,
            })
        })?;

        if let Some(r) = rows.next() {
            Ok(Some(r?))
        } else {
            Ok(None)
        }
    }

    pub fn create_bill(conn: &Connection, b: &EnergyBill) -> Result<()> {
        conn.execute(
            "INSERT INTO energy_bills (
                id, month, year, start_date, end_date, kwh_total,
                total_cents, kwh_rate_cents, additional_taxes_cents,
                tariff_flag, distributor, notes, created_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13);",
            params![
                b.id,
                b.month,
                b.year,
                b.start_date,
                b.end_date,
                b.kwh_total,
                b.total_cents,
                b.kwh_rate_cents,
                b.additional_taxes_cents,
                b.tariff_flag,
                b.distributor,
                b.notes,
                b.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn update_bill(conn: &Connection, b: &EnergyBill) -> Result<()> {
        conn.execute(
            "UPDATE energy_bills SET
                month = ?1,
                year = ?2,
                start_date = ?3,
                end_date = ?4,
                kwh_total = ?5,
                total_cents = ?6,
                kwh_rate_cents = ?7,
                additional_taxes_cents = ?8,
                tariff_flag = ?9,
                distributor = ?10,
                notes = ?11
             WHERE id = ?12;",
            params![
                b.month,
                b.year,
                b.start_date,
                b.end_date,
                b.kwh_total,
                b.total_cents,
                b.kwh_rate_cents,
                b.additional_taxes_cents,
                b.tariff_flag,
                b.distributor,
                b.notes,
                b.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_bill(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM energy_bills WHERE id = ?1;", params![id])?;
        Ok(())
    }

    // ==========================================
    // SAVING PLANS
    // ==========================================
    pub fn list_plans(conn: &Connection) -> Result<Vec<SavingPlan>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, target_type, target_value, is_active, created_at
             FROM saving_plans ORDER BY created_at DESC;",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, i32>(4)? == 1,
                row.get::<_, String>(5)?,
            ))
        })?;

        let mut plans = Vec::new();
        for r in rows {
            let (id, name, target_type, target_value, is_active, created_at) = r?;
            // Carregar ações deste plano
            let mut action_stmt = conn.prepare(
                "SELECT id, plan_id, device_id, device_name, current_hours,
                        proposed_hours, saved_kwh_month, saved_cents_month
                 FROM saving_plan_actions WHERE plan_id = ?1;",
            )?;
            let action_rows = action_stmt.query_map(params![id], |arow| {
                Ok(SavingPlanAction {
                    id: arow.get(0)?,
                    plan_id: arow.get(1)?,
                    device_id: arow.get(2)?,
                    device_name: arow.get(3)?,
                    current_hours: arow.get(4)?,
                    proposed_hours: arow.get(5)?,
                    saved_kwh_month: arow.get(6)?,
                    saved_cents_month: arow.get(7)?,
                })
            })?;

            let mut actions = Vec::new();
            let mut total_kwh = 0.0;
            let mut total_cents = 0;

            for a in action_rows {
                let action = a?;
                total_kwh += action.saved_kwh_month;
                total_cents += action.saved_cents_month;
                actions.push(action);
            }

            plans.push(SavingPlan {
                id,
                name,
                target_type,
                target_value,
                is_active,
                created_at,
                actions,
                total_saved_kwh_month: (total_kwh * 10.0).round() / 10.0,
                total_saved_cents_month: total_cents,
                total_saved_cents_year: total_cents * 12,
            });
        }
        Ok(plans)
    }

    pub fn create_plan(conn: &Connection, p: &SavingPlan) -> Result<()> {
        conn.execute(
            "INSERT INTO saving_plans (id, name, target_type, target_value, is_active, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6);",
            params![
                p.id,
                p.name,
                p.target_type,
                p.target_value,
                if p.is_active { 1 } else { 0 },
                p.created_at,
            ],
        )?;

        for a in &p.actions {
            conn.execute(
                "INSERT INTO saving_plan_actions (
                    id, plan_id, device_id, device_name, current_hours,
                    proposed_hours, saved_kwh_month, saved_cents_month
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);",
                params![
                    a.id,
                    p.id,
                    a.device_id,
                    a.device_name,
                    a.current_hours,
                    a.proposed_hours,
                    a.saved_kwh_month,
                    a.saved_cents_month,
                ],
            )?;
        }
        Ok(())
    }

    pub fn toggle_plan_active(conn: &Connection, plan_id: &str, is_active: bool) -> Result<()> {
        if is_active {
            // Se ativando este, podemos desativar outros se desejado, ou permitir apenas um ativo por vez
            conn.execute("UPDATE saving_plans SET is_active = 0;", [])?;
        }
        conn.execute(
            "UPDATE saving_plans SET is_active = ?1 WHERE id = ?2;",
            params![if is_active { 1 } else { 0 }, plan_id],
        )?;
        Ok(())
    }

    pub fn delete_plan(conn: &Connection, id: &str) -> Result<()> {
        conn.execute("DELETE FROM saving_plan_actions WHERE plan_id = ?1;", params![id])?;
        conn.execute("DELETE FROM saving_plans WHERE id = ?1;", params![id])?;
        Ok(())
    }

    // ==========================================
    // CLEAR DEMO DATA
    // ==========================================
    pub fn clear_all_data(conn: &Connection) -> Result<()> {
        conn.execute_batch(
            "DELETE FROM saving_plan_actions;
             DELETE FROM saving_plans;
             DELETE FROM devices;
             DELETE FROM rooms;
             DELETE FROM internal_users;
             DELETE FROM energy_bills;
             UPDATE settings SET is_demo_data_loaded = 0 WHERE id = 1;",
        )?;
        Ok(())
    }
}
