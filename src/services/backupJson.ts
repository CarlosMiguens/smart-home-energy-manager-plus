import { energyApi } from './tauriBridge';
import { AppSettings, Device, EnergyBill, InternalUser, Room, SavingPlan } from '../types';

export interface FullAppBackup {
  metadata: {
    app_name: string;
    app_version: string;
    exported_at: string;
    city: string;
    state: string;
    total_creations: number;
  };
  household_profile: AppSettings;
  users_profile: InternalUser[];
  rooms: Room[];
  devices: Device[];
  bills: EnergyBill[];
  saving_plans: SavingPlan[];
}

export const backupJsonService = {
  /**
   * Coleta todas as configurações, perfis e criações do usuário e retorna o objeto consolidado.
   */
  async buildBackupData(): Promise<FullAppBackup> {
    const [settings, userSummaries, roomSummaries, deviceMetrics, billCards, plans] = await Promise.all([
      energyApi.getSettings(),
      energyApi.listUsers(),
      energyApi.listRooms(),
      energyApi.listDevices(),
      energyApi.listBills(),
      energyApi.listSavingPlans(),
    ]);

    const rawUsers: InternalUser[] = userSummaries.map((u) => u.user);
    const rawRooms: Room[] = roomSummaries.map((r) => r.room);
    const rawDevices: Device[] = deviceMetrics.map((d) => d.device);
    const rawBills: EnergyBill[] = billCards.map((b) => b.bill);

    const totalCreations = rawUsers.length + rawRooms.length + rawDevices.length + rawBills.length + plans.length;

    const backup: FullAppBackup = {
      metadata: {
        app_name: 'Smart Home Energy Manager Plus',
        app_version: '1.0.0',
        exported_at: new Date().toISOString(),
        city: settings.city || 'Videira',
        state: settings.state || 'Santa Catarina',
        total_creations: totalCreations,
      },
      household_profile: settings,
      users_profile: rawUsers,
      rooms: rawRooms,
      devices: rawDevices,
      bills: rawBills,
      saving_plans: plans,
    };

    return backup;
  },

  /**
   * Salva e faz o download automático de todas as criações como um arquivo .json.
   */
  async downloadCreationsAsJson(customFileName?: string): Promise<{ fileName: string; totalItems: number }> {
    const backup = await this.buildBackupData();
    const jsonString = JSON.stringify(backup, null, 2);

    // Salvar snapshot também no localStorage como contingência imediata
    try {
      localStorage.setItem('sm_last_json_backup', jsonString);
      localStorage.setItem('sm_last_json_backup_time', new Date().toISOString());
    } catch (e) {
      console.warn('Não foi possível salvar cópia no localStorage:', e);
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = customFileName || `smart_energy_criacoes_videira_${dateStr}.json`;

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      fileName,
      totalItems: backup.metadata.total_creations,
    };
  },

  /**
   * Importa e restaura perfis e criações a partir do conteúdo de um arquivo JSON.
   */
  async restoreCreationsFromJson(jsonContent: string): Promise<{
    usersCount: number;
    roomsCount: number;
    devicesCount: number;
    billsCount: number;
    plansCount: number;
  }> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (err) {
      throw new Error('O arquivo selecionado não é um JSON válido.');
    }

    // Suporte tanto para o formato FullAppBackup quanto formatos parciais
    const settings: AppSettings | undefined = parsed.household_profile || parsed.settings;
    const users: InternalUser[] = parsed.users_profile || parsed.users || [];
    const rooms: Room[] = parsed.rooms || [];
    const devices: Device[] = parsed.devices || [];
    const bills: EnergyBill[] = parsed.bills || [];
    const plans: SavingPlan[] = parsed.saving_plans || parsed.plans || [];

    if (!settings && users.length === 0 && rooms.length === 0 && devices.length === 0 && bills.length === 0) {
      throw new Error('O arquivo JSON não contém estruturas reconhecíveis de criações ou perfil.');
    }

    // 1. Restaurar perfil da residência
    if (settings) {
      await energyApi.updateSettings(settings);
    }

    // 2. Restaurar perfis de usuários
    for (const u of users) {
      try {
        await energyApi.createUser(u);
      } catch (e) {
        console.warn('Erro ao restaurar usuário:', u.name, e);
      }
    }

    // 3. Restaurar cômodos
    for (const r of rooms) {
      try {
        await energyApi.createRoom(r);
      } catch (e) {
        console.warn('Erro ao restaurar cômodo:', r.name, e);
      }
    }

    // 4. Restaurar aparelhos
    for (const d of devices) {
      try {
        await energyApi.createDevice(d);
      } catch (e) {
        console.warn('Erro ao restaurar aparelho:', d.name, e);
      }
    }

    // 5. Restaurar faturas
    for (const b of bills) {
      try {
        await energyApi.createBill(b);
      } catch (e) {
        console.warn('Erro ao restaurar fatura:', b.month, b.year, e);
      }
    }

    // 6. Restaurar planos de economia
    for (const p of plans) {
      try {
        await energyApi.createSavingPlan(p);
      } catch (e) {
        console.warn('Erro ao restaurar plano:', p.name, e);
      }
    }

    return {
      usersCount: users.length,
      roomsCount: rooms.length,
      devicesCount: devices.length,
      billsCount: bills.length,
      plansCount: plans.length,
    };
  },
};
