import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Tv,
  TrendingDown,
  Menu,
  X,
  Users,
  Home,
  GitCompare,
  Sliders,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainTabs = [
    { id: 'dashboard' as NavTab, label: 'Início', icon: LayoutDashboard },
    { id: 'contas' as NavTab, label: 'Contas', icon: Receipt },
    { id: 'dispositivos' as NavTab, label: 'Aparelhos', icon: Tv },
    { id: 'planos' as NavTab, label: 'Planos', icon: TrendingDown },
  ];

  const moreTabs = [
    { id: 'usuarios' as NavTab, label: 'Usuários da Casa', icon: Users },
    { id: 'comodos' as NavTab, label: 'Cômodos', icon: Home },
    { id: 'comparar' as NavTab, label: 'Comparar Períodos', icon: GitCompare },
    { id: 'simulador' as NavTab, label: 'Simulador de Uso', icon: Sliders },
    { id: 'relatorios' as NavTab, label: 'Relatórios & Exportar', icon: FileSpreadsheet },
    { id: 'configuracoes' as NavTab, label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      <nav className="bottom-nav">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setDrawerOpen(false);
              }}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`bottom-nav-item ${drawerOpen ? 'active' : ''}`}
        >
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          <span>Mais</span>
        </button>
      </nav>

      {drawerOpen && (
        <div
          className="modal-overlay"
          style={{ alignItems: 'flex-end', padding: 0 }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              borderRadius: '24px 24px 0 0',
              maxHeight: '65vh',
              marginBottom: '64px',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Mais Recursos</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setDrawerOpen(false)}
                style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setDrawerOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '16px 8px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--color-primary)' : 'var(--bg-card)',
                      border: `1px solid ${isActive ? 'var(--color-accent-mint)' : 'var(--border-subtle)'}`,
                      color: isActive ? 'var(--color-accent-mint)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                    }}
                  >
                    <Icon size={24} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
