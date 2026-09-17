import React from 'react';
import {
  Zap,
  TrendingDown,
  TrendingUp,
  Target,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  HelpCircle,
  Home,
  Edit3,
} from 'lucide-react';
import { DashboardSummary, EnergyBill } from '../../types';
import { Card } from '../../components/common/Card';
import { ProgressBar } from '../../components/common/ProgressBar';
import { MonthlyChart } from '../../components/charts/MonthlyChart';
import { formatCurrency, formatKwh, formatPercentage, getMonthName } from '../../utils/formatters';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  bills: EnergyBill[];
  onNavigate: (tab: any) => void;
  onSelectBill: (bill: EnergyBill) => void;
  onOpenNewBillModal: () => void;
  onOpenHouseModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  bills,
  onNavigate,
  onSelectBill,
  onOpenNewBillModal,
  onOpenHouseModal,
}) => {
  if (!summary) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ color: 'var(--color-accent-mint)', fontSize: '1.2rem', marginBottom: '8px' }}>
          Carregando informações da sua residência...
        </div>
      </div>
    );
  }

  const {
    settings,
    current_bill,
    previous_bill,
    bill_comparison,
    goal_progress,
    total_devices_kwh,
    unidentified_kwh,
    devices_percentage_of_bill,
    top_consumers,
    active_plan,
    insights,
  } = summary;

  const hasBills = !!current_bill;

  return (
    <div className="page-container">
      {/* Cabeçalho de Boas-Vindas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1
              onClick={onOpenHouseModal}
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: '4px',
                cursor: onOpenHouseModal ? 'pointer' : 'default',
              }}
              title="Clique para personalizar a residência"
            >
              {settings.household_name}
              {settings.is_demo_data_loaded && !settings.household_name.toLowerCase().includes('demonstração') && (
                <span style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>
                  (Demonstração – {settings.city || 'Videira'})
                </span>
              )}
            </h1>
            {onOpenHouseModal && (
              <button
                onClick={onOpenHouseModal}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                }}
                title="Personalizar residência com seu nome"
              >
                <Edit3 size={13} />
                <span>Personalizar Casa</span>
              </button>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Gerenciamento sustentável de energia elétrica em {settings.city} – {settings.state}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={onOpenNewBillModal} className="btn btn-primary">
            <PlusCircle size={18} />
            Nova Fatura de Luz
          </button>
        </div>
      </div>

      {/* Grid Superior: Cards Principais */}
      <div className="grid-cards grid-4">
        {/* Card 1: Consumo Atual */}
        <Card>
          <div className="card-header">
            <span className="card-title">
              <Zap size={16} color="var(--color-accent-mint)" />
              Consumo no Mês
            </span>
            {current_bill && (
              <span className="badge badge-neutral">
                {getMonthName(current_bill.month).substring(0, 3)}/{current_bill.year}
              </span>
            )}
          </div>
          <div className="card-value">
            {hasBills ? formatKwh(current_bill.kwh_total) : formatKwh(total_devices_kwh)}
          </div>
          <div className="card-subtext" style={{ marginTop: '4px' }}>
            Valor: {hasBills ? formatCurrency(current_bill.total_cents) : formatCurrency(summary.total_devices_cents)}
          </div>
        </Card>

        {/* Card 2: Comparativo com Conta Anterior */}
        <Card>
          <div className="card-header">
            <span className="card-title">
              {bill_comparison && bill_comparison.is_savings ? (
                <TrendingDown size={16} color="var(--color-savings)" />
              ) : (
                <TrendingUp size={16} color="var(--color-warning)" />
              )}
              Conta Anterior
            </span>
            {previous_bill && (
              <span className="badge badge-neutral">
                {getMonthName(previous_bill.month).substring(0, 3)}/{previous_bill.year}
              </span>
            )}
          </div>
          <div className="card-value">
            {previous_bill ? formatCurrency(previous_bill.total_cents) : '—'}
          </div>
          <div style={{ marginTop: '6px' }}>
            {bill_comparison ? (
              <span className={`badge ${bill_comparison.is_savings ? 'badge-savings' : 'badge-danger'}`}>
                {formatPercentage(bill_comparison.pct_kwh)} consumo ({bill_comparison.is_savings ? 'Economia' : 'Aumento'})
              </span>
            ) : (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Cadastre a 2ª fatura para comparar
              </span>
            )}
          </div>
        </Card>

        {/* Card 3: Meta Mensal */}
        <Card>
          <div className="card-header">
            <span className="card-title">
              <Target size={16} color="var(--color-accent-mint)" />
              Meta Mensal
            </span>
            <span className="badge badge-neutral">{formatKwh(settings.monthly_kwh_goal)}</span>
          </div>
          <div className="card-value">
            {(goal_progress?.percentage_used ?? 0).toFixed(0)}%
          </div>
          <ProgressBar
            percentage={goal_progress?.percentage_used ?? 0}
            sublabel={`${goal_progress?.days_remaining ?? 0} dias restantes`}
            isExceeded={goal_progress?.is_exceeded ?? false}
          />
        </Card>

        {/* Card 4: Economia / Plano Ativo */}
        <Card onClick={() => onNavigate('planos')} style={{ cursor: 'pointer' }}>
          <div className="card-header">
            <span className="card-title">
              <Sparkles size={16} color="var(--color-accent-sage)" />
              Plano Ativo
            </span>
            {active_plan ? (
              <span className="badge badge-savings">Ativo</span>
            ) : (
              <span className="badge badge-neutral">Nenhum</span>
            )}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
            {active_plan ? active_plan.name : 'Criar Plano'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {active_plan ? (
              `Economia: ${formatKwh(active_plan.total_saved_kwh_month)}/mês (${formatCurrency(active_plan.total_saved_cents_month)})`
            ) : (
              'Defina metas para receber sugestões de redução'
            )}
          </div>
        </Card>
      </div>

      {/* Gráfico Mensal Histórico */}
      {bills.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: '1.05rem' }}>
              Histórico dos Últimos 12 Meses
            </span>
            <button onClick={() => onNavigate('contas')} className="btn btn-secondary btn-sm">
              Ver Todas as Contas
            </button>
          </div>
          <MonthlyChart bills={bills} onSelectBill={onSelectBill} />
        </Card>
      )}

      {/* Grid Meio: Maiores Consumidores e Diferença entre Fatura e Aparelhos */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '24px' }}>
        {/* Card: Maiores Consumidores */}
        <Card>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: '1rem' }}>
              Maiores Consumidores
            </span>
            <button onClick={() => onNavigate('dispositivos')} className="btn btn-secondary btn-sm">
              Gerenciar ({summary.total_devices_count})
            </button>
          </div>

          {top_consumers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              Nenhum aparelho cadastrado ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {top_consumers.map((item, index) => (
                <div
                  key={item.device.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? 'var(--color-primary-leaf)' : 'rgba(255,255,255,0.08)',
                        color: index === 0 ? 'var(--color-accent-mint)' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.device.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.device.category} • {item.device.power_watts}W • {item.device.hours_per_day}h/dia
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {formatKwh(item.monthly_kwh)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-mint)' }}>
                      {item.percentage_of_total}% da casa
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Card: Diferença entre Fatura e Aparelhos */}
        <Card>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: '1rem' }}>
              Diferença Conta vs Aparelhos
            </span>
            <span title="Compara a fatura real com as estimativas dos equipamentos">
              <HelpCircle size={16} color="var(--text-muted)" />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Consumo da Fatura Real:</span>
              <span style={{ fontWeight: 700 }}>{current_bill ? formatKwh(current_bill.kwh_total) : '—'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimativa dos Aparelhos:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-accent-mint)' }}>{formatKwh(total_devices_kwh)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} color="var(--color-warning)" />
                Consumo Ainda Não Identificado:
              </span>
              <span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>
                {unidentified_kwh != null ? formatKwh(unidentified_kwh) : '—'}
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              Esta diferença ajuda a identificar novos eletrodomésticos, iluminação ou hábitos da residência que ainda não foram catalogados.
            </div>

            {devices_percentage_of_bill != null && (
              <ProgressBar
                percentage={devices_percentage_of_bill}
                label="Cobertura dos Aparelhos Cadastrados"
                sublabel={`${(devices_percentage_of_bill ?? 0).toFixed(1)}% da fatura`}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Seção de Insights Automáticos */}
      <Card>
        <div className="card-header">
          <span className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={18} color="var(--color-accent-mint)" />
            Insights Inteligentes da Residência
          </span>
          <span className="badge badge-neutral">Videira SC</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {insights.map((insight, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                background: 'rgba(82, 183, 136, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <CheckCircle2 size={16} color="var(--color-accent-mint)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {insight}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
