import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Tv,
  Users,
  Home,
  GitCompare,
  Sliders,
  TrendingDown,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'contas'
  | 'dispositivos'
  | 'usuarios'
  | 'comodos'
  | 'comparar'
  | 'simulador'
  | 'planos'
  | 'relatorios'
  | 'configuracoes';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const NAV_ITEMS = [
  { id: 'dashboard' as NavTab, label: 'Início', icon: LayoutDashboard },
  { id: 'contas' as NavTab, label: 'Contas', icon: Receipt },
  { id: 'dispositivos' as NavTab, label: 'Dispositivos', icon: Tv },
  { id: 'usuarios' as NavTab, label: 'Usuários', icon: Users },
  { id: 'comodos' as NavTab, label: 'Cômodos', icon: Home },
  { id: 'comparar' as NavTab, label: 'Comparar', icon: GitCompare },
  { id: 'simulador' as NavTab, label: 'Simular Uso', icon: Sliders },
  { id: 'planos' as NavTab, label: 'Plano Economia', icon: TrendingDown },
  { id: 'relatorios' as NavTab, label: 'Relatórios', icon: FileSpreadsheet },
  { id: 'configuracoes' as NavTab, label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <aside className="sidebar-desktop">
      <div>
        <div style={{ padding: '0 8px 24px 8px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Navegação Principal
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'linear-gradient(90deg, rgba(82, 183, 136, 0.15), rgba(82, 183, 136, 0.05))' : 'transparent',
                  color: isActive ? 'var(--color-accent-mint)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-hover)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.88rem',
                  textAlign: 'left',
                  transition: 'var(--transition-fast)',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Videira Sustentável
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Local-first • 100% offline • Celesc SC
        </div>
      </div>
    </aside>
  );
};
