use super::*;
use crate::models::Device;

#[test]
fn test_watts_to_kw() {
    assert_eq!(watts_to_kw(1000.0), 1.0);
    assert_eq!(watts_to_kw(150.0), 0.15);
    assert_eq!(watts_to_kw(5500.0), 5.5);
    assert_eq!(watts_to_kw(0.0), 0.0);
}

#[test]
fn test_tv_consumption_and_cost_example() {
    // TV 150 W, 4h/dia, 30 dias, tarifa R$ 0,90 (90 centavos)
    let watts = 150.0;
    let qty = 1;
    let hours = 4.0;
    let days = 30;
    let rate_cents = 90.0; // R$ 0,90

    let kw = watts_to_kw(watts);
    assert_eq!(kw, 0.15);

    let daily = daily_kwh(watts, qty, hours);
    assert!((daily - 0.6).abs() < 1e-6);

    let monthly = monthly_kwh(watts, qty, hours, days);
    assert!((monthly - 18.0).abs() < 1e-6);

    let cost_cents = calculate_cost_cents(monthly, rate_cents);
    assert_eq!(cost_cents, 1620); // R$ 16,20
}

#[test]
fn test_shower_cost_by_duration() {
    // Chuveiro 5500 W, R$ 0,90/kWh
    let watts = 5500.0;
    let qty = 1;
    let rate_cents = 90.0;

    // 1 hora: 5.5 * 1 * 0.90 = 4.95 -> 495 centavos
    assert_eq!(duration_cost_cents(watts, qty, rate_cents, 60.0), 495);

    // 30 minutos: 5.5 * 0.5 * 0.90 = 2.475 -> 248 centavos arredondados
    assert_eq!(duration_cost_cents(watts, qty, rate_cents, 30.0), 248);

    // 15 minutos: 5.5 * 0.25 * 0.90 = 1.2375 -> 124 centavos arredondados
    assert_eq!(duration_cost_cents(watts, qty, rate_cents, 15.0), 124);
}

#[test]
fn test_effective_kwh_rate() {
    // Conta = R$ 300 (30000 centavos), Consumo = 350 kWh
    // Preço médio = 300 / 350 = ~0.85714 R$/kWh (85.714 centavos)
    let rate = effective_rate_cents(30000, 350.0);
    assert!((rate - 85.7142857).abs() < 0.001);

    // Caso de borda: 0 kWh não divide por zero
    assert_eq!(effective_rate_cents(10000, 0.0), 0.0);
}

#[test]
fn test_period_comparison() {
    // Consumo anterior = 400 kWh, atual = 360 kWh
    // diff = -40 kWh, percentual = -10%
    let prev_kwh = 400.0;
    let curr_kwh = 360.0;
    let prev_cents = 36000;
    let curr_cents = 32400;

    let comp = compare_periods(prev_kwh, curr_kwh, prev_cents, curr_cents);
    assert_eq!(comp.diff_kwh, -40.0);
    assert!((comp.pct_kwh - (-10.0)).abs() < 1e-6);
    assert_eq!(comp.diff_cents, -3600);
    assert!((comp.pct_cents - (-10.0)).abs() < 1e-6);
    assert!(comp.is_savings);
}

#[test]
fn test_goal_progress() {
    let goal = calculate_goal_progress(327.0, 400.0, 10);
    assert!((goal.percentage_used - 81.75).abs() < 1e-6);
    assert!(!goal.is_exceeded);

    let exceeded = calculate_goal_progress(350.0, 300.0, 5);
    assert!(exceeded.is_exceeded);
}

#[test]
fn test_unidentified_kwh() {
    let bill_kwh = 350.0;
    let devices_kwh = 298.0;
    assert_eq!(unidentified_kwh(bill_kwh, devices_kwh), 52.0);
}

#[test]
fn test_simulator() {
    // Ar-condicionado 1200 W (1.2 kW), 30 dias/mês, tarifa R$ 0,855 (85.5 centavos)
    // Atual: 8 h/dia -> 1.2 * 8 * 30 = 288 kWh/mês
    // Novo: 5 h/dia -> 1.2 * 5 * 30 = 180 kWh/mês
    // Economia: 108 kWh/mês
    let sim = simulate_device_usage(
        "dev-1".to_string(),
        "Ar-condicionado".to_string(),
        1200.0,
        1,
        30,
        8.0,
        5.0,
        85.5,
    );

    assert_eq!(sim.current_monthly_kwh, 288.0);
    assert_eq!(sim.new_monthly_kwh, 180.0);
    assert_eq!(sim.saved_monthly_kwh, 108.0);
    assert_eq!(sim.saved_annual_kwh, 1296.0);
    assert_eq!(sim.saved_monthly_cents, 9234); // R$ 92,34
    assert_eq!(sim.saved_annual_cents, 110808); // R$ 1.108,08
}

#[test]
fn test_recommendations() {
    let devices = vec![
        Device {
            id: "d1".to_string(),
            name: "Ar-condicionado".to_string(),
            category: "Ar-condicionado".to_string(),
            power_watts: 1200.0,
            quantity: 1,
            hours_per_day: 8.0,
            days_per_month: 30,
            room_id: None,
            room_name: None,
            user_id: None,
            user_name: None,
            notes: None,
            created_at: "".to_string(),
        },
        Device {
            id: "d2".to_string(),
            name: "Chuveiro".to_string(),
            category: "Chuveiro".to_string(),
            power_watts: 5500.0,
            quantity: 1,
            hours_per_day: 0.6,
            days_per_month: 30,
            room_id: None,
            room_name: None,
            user_id: None,
            user_name: None,
            notes: None,
            created_at: "".to_string(),
        },
    ];

    let (actions, saved_kwh, saved_cents) =
        generate_recommendations(&devices, "percent", 10.0, 90.0);
    assert!(!actions.is_empty());
    assert!(saved_kwh > 0.0);
    assert!(saved_cents > 0);
}
