import React, { useState, useEffect } from 'react';
import { Home, User, MapPin, Target, Sparkles, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../../types';
import { Modal } from '../common/Modal';

interface HouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onResetToNewHouse?: (newHouseName: string, city: string) => Promise<void>;
}

export const HouseModal: React.FC<HouseModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetToNewHouse,
}) => {
  const [userName, setUserName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [city, setCity] = useState('Videira');
  const [state, setState] = useState('Santa Catarina');
  const [monthlyGoal, setMonthlyGoal] = useState('280');
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (settings && isOpen) {
      setHouseholdName(settings.household_name || '');
      setCity(settings.city || 'Videira');
      setState(settings.state || 'Santa Catarina');
      setMonthlyGoal(settings.monthly_kwh_goal ? settings.monthly_kwh_goal.toString() : '280');
      setShowResetConfirm(false);

      // Tentar deduzir o nome do usuário a partir de "Casa do [Nome]" se existir
      if (settings.household_name && settings.household_name.startsWith('Casa do ')) {
        setUserName(settings.household_name.replace('Casa do ', ''));
      } else if (settings.household_name && settings.household_name.startsWith('Casa da ')) {
        setUserName(settings.household_name.replace('Casa da ', ''));
      } else if (settings.household_name && settings.household_name.startsWith('Casa de ')) {
        setUserName(settings.household_name.replace('Casa de ', ''));
      }
    }
  }, [settings, isOpen]);

  // Ao digitar o nome da pessoa, sugerir ou preencher se estiver no padrão
  const handleUserNameChange = (val: string) => {
    setUserName(val);
    const trimmed = val.trim();
    if (trimmed) {
      // Se o campo de residência estiver vazio ou for padrão, preenche automaticamente
      if (!householdName || householdName === 'Minha Residência' || householdName === 'Minha Casa' || householdName.startsWith('Casa d')) {
        setHouseholdName(`Casa do ${trimmed}`);
      }
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    setHouseholdName(suggestion);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const finalName = householdName.trim() || (userName.trim() ? `Casa do ${userName.trim()}` : 'Minha Residência');
    const goalNum = parseFloat(monthlyGoal) || 280;

    setIsSaving(true);
    try {
      const updated: AppSettings = {
        ...settings,
        household_name: finalName,
        city: city.trim() || 'Videira',
        state: state.trim() || 'Santa Catarina',
        monthly_kwh_goal: goalNum,
      };
      await onSaveSettings(updated);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar os dados da residência.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!onResetToNewHouse) return;
    const finalName = householdName.trim() || (userName.trim() ? `Casa do ${userName.trim()}` : 'Minha Residência');
    setIsSaving(true);
    try {
      await onResetToNewHouse(finalName, city.trim() || 'Videira');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar nova casa.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Minha Residência" maxWidth="520px">
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Personalize a residência com o seu nome para organizar seus relatórios e metas de consumo.
        </div>

        {/* Campo: Nome da pessoa / responsável */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} color="var(--color-accent-mint)" />
            Seu Nome (Responsável pela Casa)
          </label>
          <input
            type="text"
            className="form-input"
            value={userName}
            onChange={(e) => handleUserNameChange(e.target.value)}
            placeholder="Ex: Carlos, Mariana, Família Santos..."
            autoFocus
          />
          {userName.trim().length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleApplySuggestion(`Casa do ${userName.trim()}`)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                <Sparkles size={11} /> Usar "Casa do {userName.trim()}"
              </button>
              <button
                type="button"
                onClick={() => handleApplySuggestion(`Residência ${userName.trim()}`)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                <Sparkles size={11} /> Usar "Residência {userName.trim()}"
              </button>
            </div>
          )}
        </div>

        {/* Campo: Nome oficial da Residência */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Home size={14} color="var(--color-accent-mint)" />
            Nome de Exibição da Residência *
          </label>
          <input
            type="text"
            className="form-input"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="Ex: Casa do Carlos, Apartamento 302..."
            required
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Este é o nome principal que aparecerá no cabeçalho e nos relatórios de energia.
          </span>
        </div>

        {/* Linha dupla: Cidade e Estado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> Cidade
            </label>
            <input
              type="text"
              className="form-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Videira"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estado</label>
            <input
              type="text"
              className="form-input"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Santa Catarina"
            />
          </div>
        </div>

        {/* Meta de Consumo */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} color="var(--color-accent-mint)" />
            Meta Mensal de Consumo (kWh)
          </label>
          <input
            type="number"
            className="form-input"
            value={monthlyGoal}
            onChange={(e) => setMonthlyGoal(e.target.value)}
            placeholder="280"
          />
        </div>

        {/* Botões Principais */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="btn btn-primary">
            <Check size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Residência'}
          </button>
        </div>

        {/* Opção para Criar Nova Residência Limpa */}
        {onResetToNewHouse && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {!showResetConfirm ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Quer criar uma casa nova do zero sem contas de teste?
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <RotateCcw size={13} /> Criar Casa Nova Limpa
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <AlertTriangle size={16} /> Iniciar casa nova do zero?
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Isso limpará faturas e aparelhos existentes para que você comece sua nova residência limpa com o nome informado acima.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="btn btn-danger btn-sm"
                    disabled={isSaving}
                  >
                    Confirmar e Iniciar Nova Casa
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};
