export interface AppSettings {
  id: number;
  household_name: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  default_kwh_rate_cents: number;
  monthly_kwh_goal: number;
  theme: string;
  energy_unit: string;
  billing_cycle_start_day: number;
  onboarding_completed: boolean;
  is_demo_data_loaded: boolean;
}

export interface InternalUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  notes?: string;
  created_at: string;
}

export interface UserConsumptionSummary {
  user: InternalUser;
  device_count: number;
  estimated_monthly_kwh: number;
  estimated_monthly_cents: number;
  percentage_of_home: number;
}

export interface Room {
  id: string;
  name: string;
  icon: string;
  order_index: number;
  created_at: string;
}

export interface RoomConsumptionSummary {
  room: Room;
  device_count: number;
  estimated_monthly_kwh: number;
  estimated_monthly_cents: number;
  percentage_of_home: number;
}

export interface Device {
  id: string;
  name: string;
  category: string;
  power_watts: number;
  quantity: number;
  hours_per_day: number;
  days_per_month: number;
  room_id?: string;
  room_name?: string;
  user_id?: string;
  user_name?: string;
  notes?: string;
  created_at: string;
}

export interface DeviceCalculatedMetrics {
  device: Device;
  power_kw: number;
  daily_kwh: number;
  monthly_kwh: number;
  hourly_cost_cents: number;
  daily_cost_cents: number;
  monthly_cost_cents: number;
  percentage_of_total: number;
  cost_15min_cents: number;
  cost_30min_cents: number;
  cost_1h_cents: number;
  cost_2h_cents: number;
}

export interface EnergyBill {
  id: string;
  month: number;
  year: number;
  start_date?: string;
  end_date?: string;
  kwh_total: number;
  total_cents: number;
  kwh_rate_cents?: number;
  additional_taxes_cents: number;
  tariff_flag: string;
  distributor: string;
  notes?: string;
  created_at: string;
}

export interface BillCardView {
  bill: EnergyBill;
  effective_rate_cents: number;
  diff_kwh?: number | null;
  diff_kwh_pct?: number | null;
  diff_cents?: number | null;
  diff_cents_pct?: number | null;
}

export interface PeriodComparison {
  previous_kwh: number;
  current_kwh: number;
  diff_kwh: number;
  pct_kwh: number;
  previous_cents: number;
  current_cents: number;
  diff_cents: number;
  pct_cents: number;
  is_savings: boolean;
}

export interface GoalProgress {
  current_kwh: number;
  goal_kwh: number;
  percentage_used: number;
  days_remaining: number;
  is_exceeded: boolean;
}

export interface SavingPlanAction {
  id: string;
  plan_id: string;
  device_id: string;
  device_name: string;
  current_hours: number;
  proposed_hours: number;
  saved_kwh_month: number;
  saved_cents_month: number;
}

export interface PlanRecommendationResponse {
  actions: SavingPlanAction[];
  total_saved_kwh_month: number;
  total_saved_cents_month: number;
  total_saved_cents_year: number;
}

export interface SavingPlan {
  id: string;
  name: string;
  target_type: string;
  target_value: number;
  is_active: boolean;
  created_at: string;
  actions: SavingPlanAction[];
  total_saved_kwh_month: number;
  total_saved_cents_month: number;
  total_saved_cents_year: number;
}

export interface DashboardSummary {
  settings: AppSettings;
  current_bill?: EnergyBill | null;
  previous_bill?: EnergyBill | null;
  bill_comparison?: PeriodComparison | null;
  goal_progress: GoalProgress;
  total_devices_kwh: number;
  total_devices_cents: number;
  unidentified_kwh?: number | null;
  devices_percentage_of_bill?: number | null;
  top_consumers: DeviceCalculatedMetrics[];
  active_plan?: SavingPlan | null;
  insights: string[];
  total_bills_count: number;
  total_devices_count: number;
}

export interface MonthComparisonResult {
  bill_a: EnergyBill;
  bill_b: EnergyBill;
  comparison: PeriodComparison;
}

export interface YearSummary {
  year: number;
  total_kwh: number;
  monthly_avg_kwh: number;
  total_cents: number;
  best_month?: EnergyBill | null;
  worst_month?: EnergyBill | null;
  bill_count: number;
}

export interface YearComparisonResult {
  year_a: YearSummary;
  year_b: YearSummary;
  diff_kwh: number;
  pct_kwh: number;
  diff_cents: number;
  pct_cents: number;
  is_savings: boolean;
}

export interface SimulationResult {
  device_id: string;
  device_name: string;
  power_watts: number;
  current_hours_per_day: number;
  new_hours_per_day: number;
  days_per_month: number;
  current_monthly_kwh: number;
  new_monthly_kwh: number;
  saved_monthly_kwh: number;
  current_monthly_cents: number;
  new_monthly_cents: number;
  saved_monthly_cents: number;
  saved_annual_cents: number;
  saved_annual_kwh: number;
}

export interface ComprehensiveReportData {
  settings: AppSettings;
  bills: EnergyBill[];
  devices: DeviceCalculatedMetrics[];
  users: UserConsumptionSummary[];
  rooms: RoomConsumptionSummary[];
  plans: SavingPlan[];
  total_kwh_all_time: number;
  total_cents_all_time: number;
  average_monthly_kwh: number;
  generated_at: string;
}
