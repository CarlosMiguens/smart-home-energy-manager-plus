use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalProgress {
    pub current_kwh: f64,
    pub goal_kwh: f64,
    pub percentage_used: f64,
    pub days_remaining: u32,
    pub is_exceeded: bool,
}

pub fn calculate_goal_progress(
    current_kwh: f64,
    goal_kwh: f64,
    days_remaining: u32,
) -> GoalProgress {
    let percentage_used = if goal_kwh > 0.0 {
        (current_kwh / goal_kwh) * 100.0
    } else {
        0.0
    };

    GoalProgress {
        current_kwh,
        goal_kwh,
        percentage_used,
        days_remaining,
        is_exceeded: current_kwh > goal_kwh,
    }
}
