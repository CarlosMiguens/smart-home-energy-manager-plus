import React from 'react';
import { Sun, Moon, MapPin } from 'lucide-react';
import { AppSettings } from '../../types';

interface HeaderProps {
  settings: AppSettings | null;
  onToggleTheme: () => void;
  currentTheme: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onToggleTheme,
  currentTheme,
}) => {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon" style={{ overflow: 'hidden', padding: '2px', background: 'transparent' }}>
          <img src="/SMF.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div className="brand-text">
          <div className="brand-title">Smart Home Energy Plus</div>
          <div className="brand-subtitle">
            <MapPin size={10} style={{ flexShrink: 0 }} />
            <span>{settings?.city || 'VIDEIRA'} – {settings?.state ? (settings.state.toLowerCase().includes('catarina') ? 'SANTA CATARINA' : settings.state) : 'SANTA CATARINA'}</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          onClick={onToggleTheme}
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 10px', borderRadius: 'var(--radius-full)' }}
          title="Alternar tema claro/escuro"
        >
          {currentTheme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
};

