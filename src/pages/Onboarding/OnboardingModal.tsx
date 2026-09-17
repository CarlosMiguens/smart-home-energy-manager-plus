import React, { useState } from 'react';
import { Leaf, ArrowRight, ArrowLeft, Check, Sparkles, Database } from 'lucide-react';
import { energyApi } from '../../services/tauriBridge';

interface OnboardingModalProps {
  onComplete: () => Promise<void>;
  onSeedDemo: () => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  onSeedDemo,
}) => {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [city, setCity] = useState('Videira');
  const [billValue, setBillValue] = useState('300,00');
  const [billKwh, setBillKwh] = useState('350');
  const [goalKwh, setGoalKwh] = useState('280');
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const valNum = parseFloat(billValue.replace(',', '.')) || 300;
      const kwhNum = parseFloat(billKwh) || 350;
      const goalNum = parseFloat(goalKwh) || 280;
      const finalName = householdName.trim() || (userName.trim() ? `Casa do ${userName.trim()}` : 'Minha Residência');

      await energyApi.completeOnboarding(
        finalName,
        city.trim() || 'Videira',
        kwhNum,
        Math.round(valNum * 100),
        goalNum
      );
      await onComplete();
    } catch (err) {
      console.error(err);
      alert('Erro ao concluir primeiro acesso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(8, 28, 21, 0.95)', zIndex: 1000 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px', padding: '32px', border: '1px solid var(--border-hover)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary-leaf), var(--color-accent-mint))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#081c15',
              margin: '0 auto 14px auto',
              boxShadow: '0 4px 14px rgba(82, 183, 136, 0.3)',
            }}
          >
            <img src="/SMF.png" alt="Logo" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            Smart Home Energy Manager Plus
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Eficiência energética residencial • Videira, Santa Catarina
          </p>
        </div>

        {/* Indicador de Passos */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? '28px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: s === step ? 'var(--color-accent-mint)' : s < step ? 'var(--color-primary-leaf)' : 'rgba(255,255,255,0.1)',
                transition: 'var(--transition-fast)',
              }}
            />
          ))}
        </div>

        {/* Passo 1: Nome da Residência */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Passo 1: Crie a sua Residência</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Personalize a casa com o seu nome para organizar os relatórios e métricas.
            </p>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Seu Nome (Responsável)</label>
              <input
                type="text"
                className="form-input"
                value={userName}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserName(val);
                  if (val.trim() && (!householdName || householdName.startsWith('Casa d') || householdName === 'Minha Residência')) {
                    setHouseholdName(`Casa do ${val.trim()}`);
                  }
                }}
                placeholder="Ex: Carlos, Ana..."
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Nome da Residência no Aplicativo *</label>
              <input
                type="text"
                className="form-input"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ex: Casa do Carlos, Apartamento 102..."
              />
            </div>
          </div>
        )}

        {/* Passo 2: Cidade */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Passo 2: Qual a sua cidade?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Utilizado para referência tarifária e sazonalidade climática.
            </p>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Videira"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Passo 3: Valor da Conta */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Passo 3: Valor da sua última conta de luz</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Informe o valor em reais (R$) pago na fatura mais recente.
            </p>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                value={billValue}
                onChange={(e) => setBillValue(e.target.value)}
                placeholder="Ex: 284,37"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Passo 4: Consumo em kWh */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Passo 4: Consumo total em kWh</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Encontrado na sua fatura da distribuidora (Celesc).
            </p>
            <div className="form-group">
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={billKwh}
                onChange={(e) => setBillKwh(e.target.value)}
                placeholder="Ex: 327"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Passo 5: Meta de Consumo */}
        {step === 5 && (
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Passo 5: Defina sua meta mensal</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Qual o limite desejado de consumo em kWh para o mês?
            </p>
            <div className="form-group">
              <input
                type="number"
                className="form-input"
                value={goalKwh}
                onChange={(e) => setGoalKwh(e.target.value)}
                placeholder="Ex: 280"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : (
            <button
              onClick={onSeedDemo}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', color: 'var(--color-accent-mint)' }}
              title="Carrega dados fictícios de Videira SC para teste"
            >
              <Database size={14} /> Carregar Demonstração
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Avançar <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={18} /> {submitting ? 'Finalizando...' : 'Concluir e Abrir Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
