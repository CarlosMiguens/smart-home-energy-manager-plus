import React, { useState } from 'react';
import {
  TrendingDown,
  Sparkles,
  Plus,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DeviceCalculatedMetrics, PlanRecommendationResponse, SavingPlan, SavingPlanAction } from '../../types';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { energyApi } from '../../services/tauriBridge';
import { formatCurrency, formatKwh } from '../../utils/formatters';

interface PlanoEconomiaPageProps {
  plans: SavingPlan[];
  devices: DeviceCalculatedMetrics[];
  onRefreshPlans: () => Promise<void>;
}

export const PlanoEconomiaPage: React.FC<PlanoEconomiaPageProps> = ({
  plans,
  devices,
  onRefreshPlans,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<'percent' | 'max_kwh' | 'reduce_cost'>('percent');
  const [targetValue, setTargetValue] = useState<string>('10');
  const [planName, setPlanName] = useState<string>('Plano Econômico 10%');
  const [suggestions, setSuggestions] = useState<PlanRecommendationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const openGeneratorModal = async () => {
    setPlanName('Plano Redução 10%');
    setTargetType('percent');
    setTargetValue('10');
    setIsGenerating(true);
    setIsModalOpen(true);
    try {
      const resp = await energyApi.generatePlanSuggestions('percent', 10);
      setSuggestions(resp);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTargetChange = async (type: 'percent' | 'max_kwh' | 'reduce_cost', val: string) => {
    setTargetType(type);
    setTargetValue(val);
    const num = parseFloat(val) || 0;
    if (num > 0) {
      setIsGenerating(true);
      try {
        const resp = await energyApi.generatePlanSuggestions(type, num);
        setSuggestions(resp);
      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleSavePlan = async () => {
    if (!suggestions || suggestions.actions.length === 0) {
      alert('Nenhuma ação gerada para esta meta.');
      return;
    }

    const newPlan: SavingPlan = {
      id: `plan-${Date.now()}`,
      name: planName || 'Plano de Economia',
      target_type: targetType,
      target_value: parseFloat(targetValue) || 10,
      is_active: true,
      created_at: new Date().toISOString(),
      actions: suggestions.actions,
      total_saved_kwh_month: suggestions.total_saved_kwh_month,
      total_saved_cents_month: suggestions.total_saved_cents_month,
      total_saved_cents_year: suggestions.total_saved_cents_year,
    };

    try {
      await energyApi.createSavingPlan(newPlan);
      await onRefreshPlans();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar plano.');
    }
  };

  const handleTogglePlan = async (id: string, currentlyActive: boolean) => {
    try {
      await energyApi.toggleSavingPlan(id, !currentlyActive);
      await onRefreshPlans();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('Deseja excluir este plano de economia?')) {
      try {
        await energyApi.deleteSavingPlan(id);
        await onRefreshPlans();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Planos de Economia de Energia
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Recomendações matemáticas automáticas para reduzir gastos sem perder o conforto
          </p>
        </div>

        <button onClick={openGeneratorModal} className="btn btn-primary">
          <Plus size={18} />
          Criar Novo Plano
        </button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="Nenhum plano de economia ativo"
          description="Crie um plano informando quanto deseja economizar (ex: 10% ou R$ 50/mês). O sistema analisará seus aparelhos e sugerirá reduções viáveis de horas de uso."
          actionText="Gerar Primeiro Plano de Economia"
          onAction={openGeneratorModal}
        />
      ) : (
        <div className="grid-cards">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              style={{
                borderColor: plan.is_active ? 'var(--color-accent-mint)' : 'var(--border-subtle)',
                boxShadow: plan.is_active ? '0 0 16px rgba(82, 183, 136, 0.15)' : 'none',
              }}
            >
              <div className="card-header">
                <span className="card-title">
                  <Sparkles size={16} color="var(--color-accent-mint)" />
                  {plan.name}
                </span>
                <span className={`badge ${plan.is_active ? 'badge-savings' : 'badge-neutral'}`}>
                  {plan.is_active ? 'Ativo' : 'Pausado'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Economia Mensal</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-savings)' }}>
                    {formatKwh(plan.total_saved_kwh_month)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {formatCurrency(plan.total_saved_cents_month)}/mês
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Economia Anual</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>
                    {formatCurrency(plan.total_saved_cents_year)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatKwh(plan.total_saved_kwh_month * 12)}/ano
                  </div>
                </div>
              </div>

              {/* Lista de Ações Recomendadas */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Ações Propostas ({plan.actions.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.actions.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{act.device_name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {act.current_hours}h → {act.proposed_hours}h/dia
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--color-savings)', fontWeight: 600 }}>
                          -{formatKwh(act.saved_kwh_month)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {formatCurrency(act.saved_cents_month)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controles do Card */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <button
                  onClick={() => handleTogglePlan(plan.id, plan.is_active)}
                  className={`btn btn-sm ${plan.is_active ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {plan.is_active ? (
                    <>
                      <Pause size={14} /> Pausar Plano
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Ativar Plano
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="btn btn-danger btn-sm"
                  title="Excluir plano"
                  style={{ padding: '6px 12px' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação / Geração de Recomendações */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gerador Inteligente de Plano de Economia"
        maxWidth="600px"
      >
        <div>
          <div className="form-group">
            <label className="form-label">Nome do Plano:</label>
            <input
              type="text"
              className="form-input"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Ex: Plano Econômico -10%"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Meta:</label>
              <select
                className="form-select"
                value={targetType}
                onChange={(e) => handleTargetChange(e.target.value as any, targetValue)}
              >
                <option value="percent">Redução Percentual (%)</option>
                <option value="max_kwh">Meta Máxima (kWh/mês)</option>
                <option value="reduce_cost">Economizar Valor (R$/mês)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {targetType === 'percent'
                  ? 'Porcentagem de Redução (%)'
                  : targetType === 'max_kwh'
                  ? 'Consumo Máximo Almejado (kWh)'
                  : 'Valor a Economizar (R$)'}
              </label>
              <input
                type="number"
                step={targetType === 'percent' ? '5' : '10'}
                className="form-input"
                value={targetValue}
                onChange={(e) => handleTargetChange(targetType, e.target.value)}
              />
            </div>
          </div>

          {/* Sugestões Geradas Deterministicamente */}
          {isGenerating ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-accent-mint)' }}>
              Calculando melhores cenários para os aparelhos da residência...
            </div>
          ) : suggestions && suggestions.actions.length > 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-accent-sage)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> Recomendações Calculadas:
                </span>
                <span className="badge badge-savings">
                  Economia Potencial: {formatKwh(suggestions.total_saved_kwh_month)}/mês
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {suggestions.actions.map((act: SavingPlanAction) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{act.device_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        De {act.current_hours}h para <strong>{act.proposed_hours}h/dia</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--color-savings)', fontWeight: 600 }}>
                        -{formatKwh(act.saved_kwh_month)}/mês
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatCurrency(act.saved_cents_month)}/mês
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Economia Financeira Projetada:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-accent-mint)' }}>
                  {formatCurrency(suggestions.total_saved_cents_month)}/mês ({formatCurrency(suggestions.total_saved_cents_year)}/ano)
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
              Cadastre aparelhos com maior consumo para gerar sugestões.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSavePlan}
              disabled={!suggestions || suggestions.actions.length === 0}
              className="btn btn-primary"
            >
              Salvar e Ativar Plano
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
