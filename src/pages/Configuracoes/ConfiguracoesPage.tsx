import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Trash2,
  Save,
  Check,
  MapPin,
  HelpCircle,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';
import { AppSettings } from '../../types';
import { Card } from '../../components/common/Card';
import { energyApi } from '../../services/tauriBridge';
import { formatCurrency } from '../../utils/formatters';

interface ConfiguracoesPageProps {
  settings: AppSettings | null;
  onUpdateSettings: (s: AppSettings) => Promise<void>;
  onReloadAllData: () => Promise<void>;
  onOpenHouseModal?: () => void;
}

export const ConfiguracoesPage: React.FC<ConfiguracoesPageProps> = ({
  settings,
  onUpdateSettings,
  onReloadAllData,
  onOpenHouseModal,
}) => {
  const [householdName, setHouseholdName] = useState('');
  const [city, setCity] = useState('Videira');
  const [state, setState] = useState('Santa Catarina');
  const [country, setCountry] = useState('Brasil');
  const [currency, setCurrency] = useState('BRL');
  const [defaultRate, setDefaultRate] = useState('0.885');
  const [monthlyGoal, setMonthlyGoal] = useState('280');
  const [cycleStartDay, setCycleStartDay] = useState('1');
  const [theme, setTheme] = useState('dark');
  const [isSaved, setIsSaved] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    if (settings) {
      setHouseholdName(settings.household_name);
      setCity(settings.city);
      setState(settings.state);
      setCountry(settings.country);
      setCurrency(settings.currency);
      setDefaultRate(((settings.default_kwh_rate_cents ?? 0) / 100).toFixed(4));
      setMonthlyGoal(settings.monthly_kwh_goal.toString());
      setCycleStartDay(settings.billing_cycle_start_day.toString());
      setTheme(settings.theme);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const rateCents = parseFloat(defaultRate.replace(',', '.')) * 100 || 88.5;
    const goalKwh = parseFloat(monthlyGoal) || 280;
    const cycleDay = parseInt(cycleStartDay) || 1;

    const updated: AppSettings = {
      ...settings,
      household_name: householdName.trim() || 'Minha Residência',
      city: city.trim() || 'Videira',
      state: state.trim() || 'Santa Catarina',
      country: country.trim() || 'Brasil',
      currency,
      default_kwh_rate_cents: rateCents,
      monthly_kwh_goal: goalKwh,
      billing_cycle_start_day: cycleDay,
      theme,
    };

    await onUpdateSettings(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSeedDemo = async () => {
    if (
      confirm(
        'Deseja carregar os dados de demonstração de Videira SC? Isso preencherá 12 meses de contas, 10 eletrodomésticos, 4 moradores, 6 cômodos e 1 plano de economia.'
      )
    ) {
      setLoadingDemo(true);
      try {
        await energyApi.seedDemoData();
        await onReloadAllData();
        alert('Dados de demonstração carregados com sucesso! O nome da sua residência foi preservado.');
      } catch (err) {
        console.error(err);
        alert('Erro ao carregar demonstração.');
      } finally {
        setLoadingDemo(false);
      }
    }
  };

  const handleClearDemo = async () => {
    if (confirm('Tem certeza de que deseja apagar todos os dados de demonstração e faturas?')) {
      setLoadingDemo(true);
      try {
        await energyApi.clearDemoData();
        await onReloadAllData();
        alert('Dados limpos com sucesso.');
      } catch (err) {
        console.error(err);
        alert('Erro ao limpar dados.');
      } finally {
        setLoadingDemo(false);
      }
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Configurações da Residência
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Personalize as taxas locais, metas de economia e opções de armazenamento local-first
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Formulário de Configurações */}
        <Card>
          <form onSubmit={handleSave}>
            <div className="card-header">
              <span className="card-title">
                <MapPin size={16} color="var(--color-accent-mint)" />
                Localização & Parâmetros
              </span>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Nome da Residência *</label>
                {onOpenHouseModal && (
                  <button
                    type="button"
                    onClick={onOpenHouseModal}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                  >
                    Assistente de Nome
                  </button>
                )}
              </div>
              <input
                type="text"
                className="form-input"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ex: Casa do Carlos, Apartamento 102..."
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Personalize com o seu nome (ex: Casa do Carlos, Residência Oliveira).
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <input
                  type="text"
                  className="form-input"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Tarifa Padrão (R$/kWh) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  placeholder="Ex: 0.885"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meta Mensal (kWh) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(e.target.value)}
                  placeholder="Ex: 280"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Moeda Padrão</label>
                <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="BRL">BRL – R$ (Brasil)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Primeiro Dia do Ciclo</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="form-input"
                  value={cycleStartDay}
                  onChange={(e) => setCycleStartDay(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              {isSaved ? (
                <span style={{ color: 'var(--color-savings)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <Check size={18} /> Configurações salvas!
                </span>
              ) : (
                <span />
              )}

              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Salvar Parâmetros
              </button>
            </div>
          </form>
        </Card>

        {/* Painel de Demonstração e Local-First */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div className="card-header">
              <span className="card-title">
                <Database size={16} color="var(--color-accent-mint)" />
                Dados de Demonstração
              </span>
              {settings?.is_demo_data_loaded && (
                <span className="badge badge-warning">Demonstração Ativa</span>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
              Deseja explorar todos os recursos do aplicativo sem precisar cadastrar manualmente dezenas de faturas e aparelhos? Carregue dados completos de simulação (Videira SC).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleSeedDemo}
                disabled={loadingDemo}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loadingDemo ? 'Carregando...' : 'Carregar Dados de Demonstração (Videira SC)'}
              </button>

              <button
                onClick={handleClearDemo}
                disabled={loadingDemo}
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                <Trash2 size={16} /> Apagar Dados de Demonstração
              </button>
            </div>
          </Card>

          <Card>
            <div className="card-header">
              <span className="card-title">
                <Shield size={16} color="var(--color-accent-mint)" />
                Privacidade & Armazenamento Offline
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <strong>Arquitetura Local-First:</strong> Seus dados são salvos exclusivamente no banco de dados SQLite local no seu dispositivo.
              </div>
              <div>
                <strong>Zero Dependência de Nuvem:</strong> Nenhuma informação sobre suas contas ou consumo elétrico é enviada para a internet.
              </div>
              <div>
                <strong>Local do Banco:</strong> Armazenado de forma segura no diretório de aplicativo do sistema operacional.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
