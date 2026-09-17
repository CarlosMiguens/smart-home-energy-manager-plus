import { invoke } from '@tauri-apps/api/core';
import {
  AppSettings,
  BillCardView,
  ComprehensiveReportData,
  DashboardSummary,
  Device,
  DeviceCalculatedMetrics,
  EnergyBill,
  InternalUser,
  MonthComparisonResult,
  PlanRecommendationResponse,
  Room,
  RoomConsumptionSummary,
  SavingPlan,
  SimulationResult,
  UserConsumptionSummary,
  YearComparisonResult,
  YearSummary,
} from '../types';

// Detecta se estamos rodando dentro do WebView do Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && Boolean(
    (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__
  );
};

// Fallback inicial para modo Web e Offline Local
export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  household_name: 'Minha Residência',
  city: 'Videira',
  state: 'Santa Catarina',
  country: 'Brasil',
  currency: 'BRL',
  default_kwh_rate_cents: 88.5, // R$ 0,885/kWh (Celesc SC)
  monthly_kwh_goal: 280.0,
  theme: 'dark',
  energy_unit: 'kWh',
  billing_cycle_start_day: 1,
  onboarding_completed: false,
  is_demo_data_loaded: false,
};

async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
  fallback?: () => Promise<T> | T
): Promise<T> {
  if (isTauri()) {
    try {
      return await invoke<T>(cmd, args);
    } catch (err) {
      console.warn(`Tauri invoke "${cmd}" falhou, utilizando fallback local:`, err);
      if (fallback) return await fallback();
      throw err;
    }
  }
  if (fallback) return await fallback();
  throw new Error(`Comando ${cmd} não suportado neste ambiente.`);
}

// ========================================================
// TAURI BRIDGE COM SUPORTE DUAL (TAURI RUST IPC + WEB LOCAL-FIRST)
// ========================================================

export const energyApi = {
  // Configurações
  async getSettings(): Promise<AppSettings> {
    const res = await safeInvoke<AppSettings>('get_settings', undefined, () => {
      const saved = localStorage.getItem('sm_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });
    if (res && res.household_name && res.household_name.includes('Silva')) {
      res.household_name = 'Minha Residência';
      localStorage.setItem('sm_settings', JSON.stringify(res));
    }
    return res;
  },

  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    return safeInvoke('update_settings', { settings }, () => {
      localStorage.setItem('sm_settings', JSON.stringify(settings));
      return settings;
    });
  },

  async completeOnboarding(
    householdName: string,
    city: string,
    firstBillKwh: number,
    firstBillCents: number,
    monthlyGoalKwh: number
  ): Promise<AppSettings> {
    return safeInvoke(
      'complete_onboarding',
      {
        householdName,
        city,
        firstBillKwh,
        firstBillCents,
        monthlyGoalKwh,
      },
      async () => {
        const current = await this.getSettings();
        current.household_name = householdName;
        current.city = city;
        current.monthly_kwh_goal = monthlyGoalKwh;
        current.onboarding_completed = true;
        if (firstBillKwh > 0 && firstBillCents > 0) {
          current.default_kwh_rate_cents = firstBillCents / firstBillKwh;
        }
        await this.updateSettings(current);
        return current;
      }
    );
  },

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    return safeInvoke('get_dashboard_summary', undefined, async () => {
      const settings = await this.getSettings();
      const bills = await this.listBills();
      const devices = await this.listDevices();
      const plans = await this.listSavingPlans();

      const currBill = bills[0]?.bill;
      const prevBill = bills[1]?.bill;

      const currKwh = currBill ? currBill.kwh_total : devices.reduce((acc, d) => acc + d.monthly_kwh, 0);
      const goalPct = settings.monthly_kwh_goal > 0 ? (currKwh / settings.monthly_kwh_goal) * 100 : 0;

      const totalDevKwh = devices.reduce((acc, d) => acc + d.monthly_kwh, 0);
      const totalDevCents = Math.round(totalDevKwh * settings.default_kwh_rate_cents);

      const unidentified = currBill ? Math.max(0, currBill.kwh_total - totalDevKwh) : undefined;
      const devPctBill = currBill && currBill.kwh_total > 0 ? (totalDevKwh / currBill.kwh_total) * 100 : undefined;

      const topConsumers = [...devices].sort((a, b) => b.monthly_kwh - a.monthly_kwh).slice(0, 5);
      const activePlan = plans.find((p) => p.is_active);

      const insights = [
        'Videira SC: Consumo residencial monitorado localmente com persistência segura.',
        currBill ? `Sua fatura mais recente registrou ${currBill.kwh_total} kWh.` : 'Adicione suas contas para gerar comparativos automáticos.',
        topConsumers[0] ? `O maior consumidor cadastrado é o ${topConsumers[0].device.name} (${topConsumers[0].monthly_kwh} kWh/mês).` : 'Cadastre eletrodomésticos para detalhar seus gastos.',
      ];

      return {
        settings,
        current_bill: currBill,
        previous_bill: prevBill,
        goal_progress: {
          current_kwh: currKwh,
          goal_kwh: settings.monthly_kwh_goal,
          percentage_used: goalPct,
          days_remaining: 12,
          is_exceeded: currKwh > settings.monthly_kwh_goal,
        },
        total_devices_kwh: totalDevKwh,
        total_devices_cents: totalDevCents,
        unidentified_kwh: unidentified,
        devices_percentage_of_bill: devPctBill,
        top_consumers: topConsumers,
        active_plan: activePlan,
        insights,
        total_bills_count: bills.length,
        total_devices_count: devices.length,
      };
    });
  },

  // Faturas de Energia
  async listBills(): Promise<BillCardView[]> {
    return safeInvoke('list_bills', undefined, () => {
      const raw = localStorage.getItem('sm_bills');
      const bills: EnergyBill[] = raw ? JSON.parse(raw) : [];
      return bills.map((b, i) => {
        const prev = bills[i + 1];
        const diffKwh = prev ? b.kwh_total - prev.kwh_total : undefined;
        const pctKwh = prev && prev.kwh_total > 0 ? ((b.kwh_total - prev.kwh_total) / prev.kwh_total) * 100 : undefined;
        const diffCents = prev ? b.total_cents - prev.total_cents : undefined;
        const pctCents = prev && prev.total_cents > 0 ? ((b.total_cents - prev.total_cents) / prev.total_cents) * 100 : undefined;
        return {
          bill: b,
          effective_rate_cents: b.kwh_total > 0 ? b.total_cents / b.kwh_total : 0,
          diff_kwh: diffKwh,
          diff_kwh_pct: pctKwh,
          diff_cents: diffCents,
          diff_cents_pct: pctCents,
        };
      });
    });
  },

  async createBill(bill: Partial<EnergyBill>): Promise<EnergyBill> {
    return safeInvoke('create_bill', { bill }, () => {
      const raw = localStorage.getItem('sm_bills');
      const bills: EnergyBill[] = raw ? JSON.parse(raw) : [];
      const newBill: EnergyBill = {
        id: bill.id || `bill-${Date.now()}`,
        month: bill.month || 1,
        year: bill.year || 2026,
        start_date: bill.start_date,
        end_date: bill.end_date,
        kwh_total: bill.kwh_total || 0,
        total_cents: bill.total_cents || 0,
        kwh_rate_cents: bill.kwh_rate_cents || (bill.kwh_total ? bill.total_cents! / bill.kwh_total : 88.5),
        additional_taxes_cents: bill.additional_taxes_cents || 0,
        tariff_flag: bill.tariff_flag || 'Verde',
        distributor: bill.distributor || 'Celesc',
        notes: bill.notes,
        created_at: new Date().toISOString(),
      };
      bills.unshift(newBill);
      bills.sort((a, b) => b.year - a.year || b.month - a.month);
      localStorage.setItem('sm_bills', JSON.stringify(bills));
      return newBill;
    });
  },

  async updateBill(bill: EnergyBill): Promise<EnergyBill> {
    return safeInvoke('update_bill', { bill }, () => {
      const raw = localStorage.getItem('sm_bills');
      let bills: EnergyBill[] = raw ? JSON.parse(raw) : [];
      bills = bills.map((b) => (b.id === bill.id ? bill : b));
      localStorage.setItem('sm_bills', JSON.stringify(bills));
      return bill;
    });
  },

  async deleteBill(id: string): Promise<void> {
    return safeInvoke('delete_bill', { id }, () => {
      const raw = localStorage.getItem('sm_bills');
      let bills: EnergyBill[] = raw ? JSON.parse(raw) : [];
      bills = bills.filter((b) => b.id !== id);
      localStorage.setItem('sm_bills', JSON.stringify(bills));
    });
  },

  async duplicateBill(id: string): Promise<EnergyBill> {
    return safeInvoke('duplicate_bill', { id }, async () => {
      const bills = await this.listBills();
      const existing = bills.find((b) => b.bill.id === id);
      if (!existing) throw new Error('Fatura não encontrada');
      let m = existing.bill.month + 1;
      let y = existing.bill.year;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      return this.createBill({
        ...existing.bill,
        id: undefined,
        month: m,
        year: y,
        notes: `Duplicada de ${existing.bill.month}/${existing.bill.year}`,
      });
    });
  },

  // Dispositivos
  async listDevices(): Promise<DeviceCalculatedMetrics[]> {
    return safeInvoke('list_devices_with_metrics', undefined, async () => {
      const settings = await this.getSettings();
      const raw = localStorage.getItem('sm_devices');
      const devices: Device[] = raw ? JSON.parse(raw) : [];
      const totalKwh = devices.reduce(
        (acc, d) => acc + (d.power_watts / 1000) * d.quantity * d.hours_per_day * d.days_per_month,
        0
      );

      return devices.map((d) => {
        const pKw = d.power_watts / 1000;
        const dKwh = pKw * d.quantity * d.hours_per_day;
        const mKwh = dKwh * d.days_per_month;
        const mCents = Math.round(mKwh * settings.default_kwh_rate_cents);
        const dCents = Math.round(dKwh * settings.default_kwh_rate_cents);
        const hCents = Math.round(pKw * d.quantity * settings.default_kwh_rate_cents);
        return {
          device: d,
          power_kw: pKw,
          daily_kwh: Math.round(dKwh * 100) / 100,
          monthly_kwh: Math.round(mKwh * 10) / 10,
          hourly_cost_cents: hCents,
          daily_cost_cents: dCents,
          monthly_cost_cents: mCents,
          percentage_of_total: totalKwh > 0 ? Math.round((mKwh / totalKwh) * 1000) / 10 : 0,
          cost_15min_cents: Math.round(hCents * 0.25),
          cost_30min_cents: Math.round(hCents * 0.5),
          cost_1h_cents: hCents,
          cost_2h_cents: hCents * 2,
        };
      });
    });
  },

  async createDevice(device: Partial<Device>): Promise<Device> {
    return safeInvoke('create_device', { device }, () => {
      const raw = localStorage.getItem('sm_devices');
      const devices: Device[] = raw ? JSON.parse(raw) : [];
      const newDev: Device = {
        id: device.id || `dev-${Date.now()}`,
        name: device.name || 'Novo Aparelho',
        category: device.category || 'Outros',
        power_watts: device.power_watts || 100,
        quantity: device.quantity || 1,
        hours_per_day: device.hours_per_day || 1,
        days_per_month: device.days_per_month || 30,
        room_id: device.room_id,
        room_name: device.room_name,
        user_id: device.user_id,
        user_name: device.user_name,
        notes: device.notes,
        created_at: new Date().toISOString(),
      };
      devices.push(newDev);
      localStorage.setItem('sm_devices', JSON.stringify(devices));
      return newDev;
    });
  },

  async updateDevice(device: Device): Promise<Device> {
    return safeInvoke('update_device', { device }, () => {
      const raw = localStorage.getItem('sm_devices');
      let devices: Device[] = raw ? JSON.parse(raw) : [];
      devices = devices.map((d) => (d.id === device.id ? device : d));
      localStorage.setItem('sm_devices', JSON.stringify(devices));
      return device;
    });
  },

  async deleteDevice(id: string): Promise<void> {
    return safeInvoke('delete_device', { id }, () => {
      const raw = localStorage.getItem('sm_devices');
      let devices: Device[] = raw ? JSON.parse(raw) : [];
      devices = devices.filter((d) => d.id !== id);
      localStorage.setItem('sm_devices', JSON.stringify(devices));
    });
  },

  // Usuários Internos
  async listUsers(): Promise<UserConsumptionSummary[]> {
    return safeInvoke('list_users_with_metrics', undefined, async () => {
      const raw = localStorage.getItem('sm_users');
      const users: InternalUser[] = raw ? JSON.parse(raw) : [];
      const devices = await this.listDevices();
      const totalHome = devices.reduce((a, d) => a + d.monthly_kwh, 0);

      return users.map((u) => {
        const userDevs = devices.filter((d) => d.device.user_id === u.id);
        const kwh = userDevs.reduce((a, d) => a + d.monthly_kwh, 0);
        const cents = userDevs.reduce((a, d) => a + d.monthly_cost_cents, 0);
        return {
          user: u,
          device_count: userDevs.length,
          estimated_monthly_kwh: Math.round(kwh * 10) / 10,
          estimated_monthly_cents: cents,
          percentage_of_home: totalHome > 0 ? Math.round((kwh / totalHome) * 1000) / 10 : 0,
        };
      });
    });
  },

  async createUser(user: Partial<InternalUser>): Promise<InternalUser> {
    return safeInvoke('create_user', { user }, () => {
      const raw = localStorage.getItem('sm_users');
      const users: InternalUser[] = raw ? JSON.parse(raw) : [];
      const newUser: InternalUser = {
        id: user.id || `user-${Date.now()}`,
        name: user.name || 'Novo Usuário',
        avatar: user.avatar || 'User',
        color: user.color || '#2d6a4f',
        notes: user.notes,
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      localStorage.setItem('sm_users', JSON.stringify(users));
      return newUser;
    });
  },

  async updateUser(user: InternalUser): Promise<InternalUser> {
    return safeInvoke('update_user', { user }, () => {
      const raw = localStorage.getItem('sm_users');
      let users: InternalUser[] = raw ? JSON.parse(raw) : [];
      users = users.map((u) => (u.id === user.id ? user : u));
      localStorage.setItem('sm_users', JSON.stringify(users));
      return user;
    });
  },

  async deleteUser(id: string): Promise<void> {
    return safeInvoke('delete_user', { id }, () => {
      const raw = localStorage.getItem('sm_users');
      let users: InternalUser[] = raw ? JSON.parse(raw) : [];
      users = users.filter((u) => u.id !== id);
      localStorage.setItem('sm_users', JSON.stringify(users));
    });
  },

  // Cômodos
  async listRooms(): Promise<RoomConsumptionSummary[]> {
    return safeInvoke('list_rooms_with_metrics', undefined, async () => {
      const raw = localStorage.getItem('sm_rooms');
      const rooms: Room[] = raw ? JSON.parse(raw) : [];
      const devices = await this.listDevices();
      const totalHome = devices.reduce((a, d) => a + d.monthly_kwh, 0);

      return rooms.map((r) => {
        const roomDevs = devices.filter((d) => d.device.room_id === r.id);
        const kwh = roomDevs.reduce((a, d) => a + d.monthly_kwh, 0);
        const cents = roomDevs.reduce((a, d) => a + d.monthly_cost_cents, 0);
        return {
          room: r,
          device_count: roomDevs.length,
          estimated_monthly_kwh: Math.round(kwh * 10) / 10,
          estimated_monthly_cents: cents,
          percentage_of_home: totalHome > 0 ? Math.round((kwh / totalHome) * 1000) / 10 : 0,
        };
      });
    });
  },

  async createRoom(room: Partial<Room>): Promise<Room> {
    return safeInvoke('create_room', { room }, () => {
      const raw = localStorage.getItem('sm_rooms');
      const rooms: Room[] = raw ? JSON.parse(raw) : [];
      const newRoom: Room = {
        id: room.id || `room-${Date.now()}`,
        name: room.name || 'Novo Cômodo',
        icon: room.icon || 'Sofa',
        order_index: rooms.length + 1,
        created_at: new Date().toISOString(),
      };
      rooms.push(newRoom);
      localStorage.setItem('sm_rooms', JSON.stringify(rooms));
      return newRoom;
    });
  },

  async updateRoom(room: Room): Promise<Room> {
    return safeInvoke('update_room', { room }, () => {
      const raw = localStorage.getItem('sm_rooms');
      let rooms: Room[] = raw ? JSON.parse(raw) : [];
      rooms = rooms.map((r) => (r.id === room.id ? room : r));
      localStorage.setItem('sm_rooms', JSON.stringify(rooms));
      return room;
    });
  },

  async deleteRoom(id: string): Promise<void> {
    return safeInvoke('delete_room', { id }, () => {
      const raw = localStorage.getItem('sm_rooms');
      let rooms: Room[] = raw ? JSON.parse(raw) : [];
      rooms = rooms.filter((r) => r.id !== id);
      localStorage.setItem('sm_rooms', JSON.stringify(rooms));
    });
  },

  // Comparações
  async compareTwoBills(billIdA: string, billIdB: string): Promise<MonthComparisonResult> {
    return safeInvoke('compare_two_bills', { billIdA, billIdB }, async () => {
      const bills = await this.listBills();
      const bA = bills.find((b) => b.bill.id === billIdA)?.bill;
      const bB = bills.find((b) => b.bill.id === billIdB)?.bill;
      if (!bA || !bB) throw new Error('Faturas não encontradas');

      const diffKwh = bB.kwh_total - bA.kwh_total;
      const pctKwh = bA.kwh_total > 0 ? (diffKwh / bA.kwh_total) * 100 : 0;
      const diffCents = bB.total_cents - bA.total_cents;
      const pctCents = bA.total_cents > 0 ? (diffCents / bA.total_cents) * 100 : 0;

      return {
        bill_a: bA,
        bill_b: bB,
        comparison: {
          previous_kwh: bA.kwh_total,
          current_kwh: bB.kwh_total,
          diff_kwh: diffKwh,
          pct_kwh: pctKwh,
          previous_cents: bA.total_cents,
          current_cents: bB.total_cents,
          diff_cents: diffCents,
          pct_cents: pctCents,
          is_savings: diffKwh < 0,
        },
      };
    });
  },

  async getAnnualSummaries(): Promise<YearSummary[]> {
    return safeInvoke('get_annual_summaries', undefined, async () => {
      const bills = await this.listBills();
      const map = new Map<number, EnergyBill[]>();
      for (const b of bills) {
        const list = map.get(b.bill.year) || [];
        list.push(b.bill);
        map.set(b.bill.year, list);
      }
      const res: YearSummary[] = [];
      for (const [y, list] of map.entries()) {
        const totKwh = list.reduce((a, b) => a + b.kwh_total, 0);
        const totCents = list.reduce((a, b) => a + b.total_cents, 0);
        res.push({
          year: y,
          total_kwh: Math.round(totKwh * 10) / 10,
          monthly_avg_kwh: Math.round((totKwh / list.length) * 10) / 10,
          total_cents: totCents,
          best_month: [...list].sort((a, b) => a.kwh_total - b.kwh_total)[0],
          worst_month: [...list].sort((a, b) => b.kwh_total - a.kwh_total)[0],
          bill_count: list.length,
        });
      }
      return res.sort((a, b) => b.year - a.year);
    });
  },

  async compareTwoYears(yearA: number, yearB: number): Promise<YearComparisonResult> {
    return safeInvoke('compare_two_years', { yearA, yearB }, async () => {
      const summaries = await this.getAnnualSummaries();
      const sA = summaries.find((s) => s.year === yearA);
      const sB = summaries.find((s) => s.year === yearB);
      if (!sA || !sB) throw new Error('Anos não encontrados');

      const diffKwh = sB.total_kwh - sA.total_kwh;
      const pctKwh = sA.total_kwh > 0 ? (diffKwh / sA.total_kwh) * 100 : 0;
      const diffCents = sB.total_cents - sA.total_cents;
      const pctCents = sA.total_cents > 0 ? (diffCents / sA.total_cents) * 100 : 0;

      return {
        year_a: sA,
        year_b: sB,
        diff_kwh: diffKwh,
        pct_kwh: pctKwh,
        diff_cents: diffCents,
        pct_cents: pctCents,
        is_savings: diffKwh < 0,
      };
    });
  },

  // Simulador
  async simulateDevice(deviceId: string, newHoursPerDay: number): Promise<SimulationResult> {
    return safeInvoke('simulate_device', { deviceId, newHoursPerDay }, async () => {
      const devices = await this.listDevices();
      const item = devices.find((d) => d.device.id === deviceId);
      if (!item) throw new Error('Aparelho não encontrado');
      const settings = await this.getSettings();

      const kw = (item.device.power_watts / 1000) * item.device.quantity;
      const currKwh = kw * item.device.hours_per_day * item.device.days_per_month;
      const newKwh = kw * newHoursPerDay * item.device.days_per_month;
      const savedKwh = currKwh - newKwh;

      const currCents = Math.round(currKwh * settings.default_kwh_rate_cents);
      const newCents = Math.round(newKwh * settings.default_kwh_rate_cents);
      const savedCents = currCents - newCents;

      return {
        device_id: item.device.id,
        device_name: item.device.name,
        power_watts: item.device.power_watts,
        current_hours_per_day: item.device.hours_per_day,
        new_hours_per_day: newHoursPerDay,
        days_per_month: item.device.days_per_month,
        current_monthly_kwh: Math.round(currKwh * 10) / 10,
        new_monthly_kwh: Math.round(newKwh * 10) / 10,
        saved_monthly_kwh: Math.round(savedKwh * 10) / 10,
        current_monthly_cents: currCents,
        new_monthly_cents: newCents,
        saved_monthly_cents: savedCents,
        saved_annual_cents: savedCents * 12,
        saved_annual_kwh: Math.round(savedKwh * 12 * 10) / 10,
      };
    });
  },

  async applySimulation(deviceId: string, newHoursPerDay: number): Promise<void> {
    return safeInvoke('apply_simulation_to_device', { deviceId, newHoursPerDay }, () => {
      const raw = localStorage.getItem('sm_devices');
      let devices: Device[] = raw ? JSON.parse(raw) : [];
      devices = devices.map((d) => (d.id === deviceId ? { ...d, hours_per_day: newHoursPerDay } : d));
      localStorage.setItem('sm_devices', JSON.stringify(devices));
    });
  },

  // Planos de Economia
  async listSavingPlans(): Promise<SavingPlan[]> {
    return safeInvoke('list_saving_plans', undefined, () => {
      const raw = localStorage.getItem('sm_plans');
      return raw ? JSON.parse(raw) : [];
    });
  },

  async generatePlanSuggestions(targetType: string, targetValue: number): Promise<PlanRecommendationResponse> {
    return safeInvoke('generate_plan_suggestions', { targetType, targetValue }, async () => {
      const devices = await this.listDevices();
      const settings = await this.getSettings();
      const top = [...devices].filter((d) => !d.device.category.toLowerCase().includes('geladeira')).slice(0, 3);
      const actions = top.map((d) => {
        const savedH = Math.max(0.2, Math.round(d.device.hours_per_day * 0.25 * 10) / 10);
        const proposed = Math.max(0.1, d.device.hours_per_day - savedH);
        const kw = (d.device.power_watts / 1000) * d.device.quantity;
        const sKwh = kw * savedH * d.device.days_per_month;
        const sCents = Math.round(sKwh * settings.default_kwh_rate_cents);
        return {
          id: `act-${Date.now()}-${Math.random()}`,
          plan_id: '',
          device_id: d.device.id,
          device_name: d.device.name,
          current_hours: d.device.hours_per_day,
          proposed_hours: proposed,
          saved_kwh_month: Math.round(sKwh * 10) / 10,
          saved_cents_month: sCents,
        };
      });

      const totKwh = actions.reduce((a, b) => a + b.saved_kwh_month, 0);
      const totCents = actions.reduce((a, b) => a + b.saved_cents_month, 0);

      return {
        actions,
        total_saved_kwh_month: Math.round(totKwh * 10) / 10,
        total_saved_cents_month: totCents,
        total_saved_cents_year: totCents * 12,
      };
    });
  },

  async createSavingPlan(plan: SavingPlan): Promise<SavingPlan> {
    return safeInvoke('create_saving_plan', { plan }, () => {
      const raw = localStorage.getItem('sm_plans');
      const plans: SavingPlan[] = raw ? JSON.parse(raw) : [];
      plans.push(plan);
      localStorage.setItem('sm_plans', JSON.stringify(plans));
      return plan;
    });
  },

  async toggleSavingPlan(id: string, isActive: boolean): Promise<void> {
    return safeInvoke('toggle_saving_plan', { id, isActive }, () => {
      const raw = localStorage.getItem('sm_plans');
      let plans: SavingPlan[] = raw ? JSON.parse(raw) : [];
      plans = plans.map((p) => ({ ...p, is_active: p.id === id ? isActive : false }));
      localStorage.setItem('sm_plans', JSON.stringify(plans));
    });
  },

  async deleteSavingPlan(id: string): Promise<void> {
    return safeInvoke('delete_saving_plan', { id }, () => {
      const raw = localStorage.getItem('sm_plans');
      let plans: SavingPlan[] = raw ? JSON.parse(raw) : [];
      plans = plans.filter((p) => p.id !== id);
      localStorage.setItem('sm_plans', JSON.stringify(plans));
    });
  },

  // Dados de Demonstração
  async seedDemoData(): Promise<void> {
    return safeInvoke('seed_demo_data', undefined, async () => {
      const demoBills: EnergyBill[] = [
        { id: 'b1', month: 8, year: 2026, kwh_total: 321, total_cents: 28730, tariff_flag: 'Verde', distributor: 'Celesc', additional_taxes_cents: 0, created_at: '' },
        { id: 'b2', month: 7, year: 2026, kwh_total: 348, total_cents: 30150, tariff_flag: 'Amarela', distributor: 'Celesc', additional_taxes_cents: 0, created_at: '' },
        { id: 'b3', month: 6, year: 2026, kwh_total: 335, total_cents: 29815, tariff_flag: 'Verde', distributor: 'Celesc', additional_taxes_cents: 0, created_at: '' },
        { id: 'b4', month: 5, year: 2026, kwh_total: 310, total_cents: 27435, tariff_flag: 'Verde', distributor: 'Celesc', additional_taxes_cents: 0, created_at: '' },
        { id: 'b5', month: 4, year: 2026, kwh_total: 295, total_cents: 26107, tariff_flag: 'Verde', distributor: 'Celesc', additional_taxes_cents: 0, created_at: '' },
        { id: 'b6', month: 3, year: 2026, kwh_total: 305, total_cents: 26992, tariff_flag: 'Verde', distributor: 'Celesc', additional_taxes_cents: 0, created_at: '' },
      ];
      const demoDevs: Device[] = [
        { id: 'd1', name: 'Ar-condicionado Inverter', category: 'Ar-condicionado', power_watts: 1200, quantity: 1, hours_per_day: 6, days_per_month: 30, created_at: '' },
        { id: 'd2', name: 'Chuveiro Eletrônico', category: 'Chuveiro', power_watts: 5500, quantity: 1, hours_per_day: 0.6, days_per_month: 30, created_at: '' },
        { id: 'd3', name: 'Geladeira Frost Free', category: 'Geladeira', power_watts: 160, quantity: 1, hours_per_day: 10, days_per_month: 30, created_at: '' },
        { id: 'd4', name: 'Smart TV 55"', category: 'Televisor', power_watts: 140, quantity: 1, hours_per_day: 5, days_per_month: 30, created_at: '' },
        { id: 'd5', name: 'Computador Desktop', category: 'Computador', power_watts: 250, quantity: 1, hours_per_day: 6, days_per_month: 22, created_at: '' },
      ];
      localStorage.setItem('sm_bills', JSON.stringify(demoBills));
      localStorage.setItem('sm_devices', JSON.stringify(demoDevs));
      const s = await this.getSettings();
      s.is_demo_data_loaded = true;
      s.onboarding_completed = true;
      // Preserva o nome da casa configurado pelo usuário se já existir
      if (!s.household_name || s.household_name.includes('Silva') || s.household_name === 'Casa Videira') {
        s.household_name = 'Casa Modelo (Videira SC)';
      }
      await this.updateSettings(s);
    });
  },

  async clearDemoData(): Promise<void> {
    return safeInvoke('clear_demo_data', undefined, async () => {
      localStorage.removeItem('sm_bills');
      localStorage.removeItem('sm_devices');
      localStorage.removeItem('sm_users');
      localStorage.removeItem('sm_rooms');
      localStorage.removeItem('sm_plans');
      const s = await this.getSettings();
      s.is_demo_data_loaded = false;
      await this.updateSettings(s);
    });
  },

  // Relatórios
  async getComprehensiveReport(): Promise<ComprehensiveReportData> {
    return safeInvoke('get_comprehensive_report', undefined, async () => {
      const settings = await this.getSettings();
      const bills = (await this.listBills()).map((b) => b.bill);
      const devices = await this.listDevices();
      const users = await this.listUsers();
      const rooms = await this.listRooms();
      const plans = await this.listSavingPlans();
      const totKwh = bills.reduce((a, b) => a + b.kwh_total, 0);
      const totCents = bills.reduce((a, b) => a + b.total_cents, 0);

      return {
        settings,
        bills,
        devices,
        users,
        rooms,
        plans,
        total_kwh_all_time: Math.round(totKwh * 10) / 10,
        total_cents_all_time: totCents,
        average_monthly_kwh: bills.length ? Math.round((totKwh / bills.length) * 10) / 10 : 0,
        generated_at: new Date().toISOString(),
      };
    });
  },
};
