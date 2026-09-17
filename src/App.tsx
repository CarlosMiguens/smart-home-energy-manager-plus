import React, { useState, useEffect, useCallback } from 'react';
import './themes/videira.css';
import {
  AppSettings,
  BillCardView,
  DashboardSummary,
  Device,
  DeviceCalculatedMetrics,
  EnergyBill,
  InternalUser,
  Room,
  RoomConsumptionSummary,
  SavingPlan,
  UserConsumptionSummary,
} from './types';
import { energyApi, DEFAULT_SETTINGS } from './services/tauriBridge';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ContasPage } from './pages/Contas/ContasPage';
import { DispositivosPage } from './pages/Dispositivos/DispositivosPage';
import { UsuariosPage } from './pages/Usuarios/UsuariosPage';
import { ComodosPage } from './pages/Comodos/ComodosPage';
import { ComparacaoPage } from './pages/Comparacao/ComparacaoPage';
import { SimuladorPage } from './pages/Simulador/SimuladorPage';
import { PlanoEconomiaPage } from './pages/PlanoEconomia/PlanoEconomiaPage';
import { RelatoriosPage } from './pages/Relatorios/RelatoriosPage';
import { ConfiguracoesPage } from './pages/Configuracoes/ConfiguracoesPage';
import { OnboardingModal } from './pages/Onboarding/OnboardingModal';
import { BillModal } from './components/modals/BillModal';
import { HouseModal } from './components/modals/HouseModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [bills, setBills] = useState<BillCardView[]>([]);
  const [devices, setDevices] = useState<DeviceCalculatedMetrics[]>([]);
  const [users, setUsers] = useState<UserConsumptionSummary[]>([]);
  const [rooms, setRooms] = useState<RoomConsumptionSummary[]>([]);
  const [plans, setPlans] = useState<SavingPlan[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Controle de modais globais e pré-seleção
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isHouseModalOpen, setIsHouseModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<EnergyBill | null>(null);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<EnergyBill | null>(null);
  const [simulatingDeviceId, setSimulatingDeviceId] = useState<string | undefined>(undefined);

  // Carregar dados principais
  const loadAllData = useCallback(async () => {
    try {
      const [s, dash, b, d, u, r, p] = await Promise.all([
        energyApi.getSettings(),
        energyApi.getDashboardSummary(),
        energyApi.listBills(),
        energyApi.listDevices(),
        energyApi.listUsers(),
        energyApi.listRooms(),
        energyApi.listSavingPlans(),
      ]);

      setSettings(s);
      setDashboardSummary(dash);
      setBills(b);
      setDevices(d);
      setUsers(u);
      setRooms(r);
      setPlans(p);

      if (s.theme === 'light' || s.theme === 'dark') {
        setTheme(s.theme);
        document.documentElement.setAttribute('data-theme', s.theme);
      }
    } catch (err) {
      console.error('Erro ao carregar dados locais:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Alternar tema claro/escuro
  const handleToggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (settings) {
      const updated = { ...settings, theme: nextTheme };
      setSettings(updated);
      await energyApi.updateSettings(updated);
    }
  };

  // Handlers para Faturas
  const handleOpenCreateBill = () => {
    setEditingBill(null);
    setIsBillModalOpen(true);
  };

  const handleOpenEditBill = (bill: EnergyBill) => {
    setEditingBill(bill);
    setIsBillModalOpen(true);
  };

  const handleSaveBillModal = async (billData: Partial<EnergyBill>) => {
    if (editingBill) {
      await handleUpdateBill({ ...editingBill, ...billData } as EnergyBill);
    } else {
      await handleCreateBill(billData);
    }
  };

  const handleCreateBill = async (billData: Partial<EnergyBill>) => {
    await energyApi.createBill(billData);
    await loadAllData();
  };

  const handleUpdateBill = async (bill: EnergyBill) => {
    await energyApi.updateBill(bill);
    await loadAllData();
  };

  const handleDeleteBill = async (id: string) => {
    await energyApi.deleteBill(id);
    await loadAllData();
  };

  const handleDuplicateBill = async (id: string) => {
    await energyApi.duplicateBill(id);
    await loadAllData();
  };

  // Handlers para Dispositivos
  const handleCreateDevice = async (deviceData: Partial<Device>) => {
    await energyApi.createDevice(deviceData);
    await loadAllData();
  };

  const handleUpdateDevice = async (device: Device) => {
    await energyApi.updateDevice(device);
    await loadAllData();
  };

  const handleDeleteDevice = async (id: string) => {
    await energyApi.deleteDevice(id);
    await loadAllData();
  };

  const handleNavigateToSimulator = (deviceId: string) => {
    setSimulatingDeviceId(deviceId);
    setCurrentTab('simulador');
  };

  // Handlers para Usuários
  const handleCreateUser = async (userData: Partial<InternalUser>) => {
    await energyApi.createUser(userData);
    await loadAllData();
  };

  const handleUpdateUser = async (user: InternalUser) => {
    await energyApi.updateUser(user);
    await loadAllData();
  };

  const handleDeleteUser = async (id: string) => {
    await energyApi.deleteUser(id);
    await loadAllData();
  };

  // Handlers para Cômodos
  const handleCreateRoom = async (roomData: Partial<Room>) => {
    await energyApi.createRoom(roomData);
    await loadAllData();
  };

  const handleUpdateRoom = async (room: Room) => {
    await energyApi.updateRoom(room);
    await loadAllData();
  };

  const handleDeleteRoom = async (id: string) => {
    await energyApi.deleteRoom(id);
    await loadAllData();
  };

  // Handlers para Configurações
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    await energyApi.updateSettings(newSettings);
    await loadAllData();
  };

  const handleSeedDemoFromOnboarding = async () => {
    await energyApi.seedDemoData();
    await loadAllData();
  };

  const handleResetToNewHouse = async (newHouseName: string, city: string) => {
    await energyApi.clearDemoData();
    const s = await energyApi.getSettings();
    s.household_name = newHouseName;
    s.city = city;
    s.onboarding_completed = true;
    await energyApi.updateSettings(s);
    await loadAllData();
  };

  const rawBillsList = bills.map((b) => b.bill);
  const rawUsersList = users.map((u) => u.user);
  const rawRoomsList = rooms.map((r) => r.room);

  return (
    <div className="app-layout">
      {/* Onboarding no primeiro acesso */}
      {settings && !settings.onboarding_completed && (
        <OnboardingModal
          onComplete={loadAllData}
          onSeedDemo={handleSeedDemoFromOnboarding}
        />
      )}

      {/* Sidebar Desktop */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Conteúdo Central */}
      <div className="main-content">
        <Header
          settings={settings}
          onToggleTheme={handleToggleTheme}
          currentTheme={theme}
        />

        <main style={{ flex: 1 }}>
          {currentTab === 'dashboard' && (
            <DashboardPage
              summary={dashboardSummary}
              bills={rawBillsList}
              onNavigate={setCurrentTab}
              onSelectBill={(b) => {
                setSelectedBillForDetail(b);
                setCurrentTab('contas');
              }}
              onOpenNewBillModal={handleOpenCreateBill}
              onOpenHouseModal={() => setIsHouseModalOpen(true)}
            />
          )}

          {currentTab === 'contas' && (
            <ContasPage
              bills={bills}
              onOpenCreateBill={handleOpenCreateBill}
              onOpenEditBill={handleOpenEditBill}
              onDeleteBill={handleDeleteBill}
              onDuplicateBill={handleDuplicateBill}
              selectedBillForDetail={selectedBillForDetail}
              setSelectedBillForDetail={setSelectedBillForDetail}
            />
          )}

          {currentTab === 'dispositivos' && (
            <DispositivosPage
              devices={devices}
              users={rawUsersList}
              rooms={rawRoomsList}
              onCreateDevice={handleCreateDevice}
              onUpdateDevice={handleUpdateDevice}
              onDeleteDevice={handleDeleteDevice}
              onSimulateDevice={handleNavigateToSimulator}
            />
          )}

          {currentTab === 'usuarios' && (
            <UsuariosPage
              users={users}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {currentTab === 'comodos' && (
            <ComodosPage
              rooms={rooms}
              onCreateRoom={handleCreateRoom}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
            />
          )}

          {currentTab === 'comparar' && (
            <ComparacaoPage bills={bills} />
          )}

          {currentTab === 'simulador' && (
            <SimuladorPage
              devices={devices}
              preselectedDeviceId={simulatingDeviceId}
              onApplyChanges={loadAllData}
            />
          )}

          {currentTab === 'planos' && (
            <PlanoEconomiaPage
              plans={plans}
              devices={devices}
              onRefreshPlans={loadAllData}
            />
          )}

          {currentTab === 'relatorios' && (
            <RelatoriosPage />
          )}

          {currentTab === 'configuracoes' && (
            <ConfiguracoesPage
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onReloadAllData={loadAllData}
              onOpenHouseModal={() => setIsHouseModalOpen(true)}
            />
          )}
        </main>

        {/* Bottom Navigation para Mobile Android */}
        <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />
      </div>

      {/* Modal Global de Cadastro / Edição de Fatura */}
      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        onSave={handleSaveBillModal}
        editingBill={editingBill}
      />

      {/* Modal de Gestão e Criação de Residência com Nome do Usuário */}
      <HouseModal
        isOpen={isHouseModalOpen}
        onClose={() => setIsHouseModalOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onResetToNewHouse={handleResetToNewHouse}
      />
    </div>
  );
};
