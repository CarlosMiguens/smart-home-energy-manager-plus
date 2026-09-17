import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Calendar,
  Zap,
  DollarSign,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { BillCardView, EnergyBill, MonthComparisonResult, YearComparisonResult, YearSummary } from '../../types';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { energyApi } from '../../services/tauriBridge';
import { formatCurrency, formatKwh, formatPercentage, getMonthName } from '../../utils/formatters';

interface ComparacaoPageProps {
  bills: BillCardView[];
}

export const ComparacaoPage: React.FC<ComparacaoPageProps> = ({ bills }) => {
  const [tabMode, setTabMode] = useState<'month' | 'year'>('month');

  // Seletores para comparação de meses
  const [selectedBillA, setSelectedBillA] = useState<string>('');
  const [selectedBillB, setSelectedBillB] = useState<string>('');
  const [monthResult, setMonthResult] = useState<MonthComparisonResult | null>(null);

  // Seletores para comparação anual
  const [annualSummaries, setAnnualSummaries] = useState<YearSummary[]>([]);
  const [selectedYearA, setSelectedYearA] = useState<number>(0);
  const [selectedYearB, setSelectedYearB] = useState<number>(0);
  const [yearResult, setYearResult] = useState<YearComparisonResult | null>(null);

  // Inicializar seletores de meses
  useEffect(() => {
    if (bills.length >= 2) {
      // Por padrão: B = mais recente (bills[0]), A = anterior (bills[1])
      setSelectedBillB(bills[0].bill.id);
      setSelectedBillA(bills[1].bill.id);
    }
  }, [bills]);

  // Carregar dados anuais
  useEffect(() => {
    energyApi.getAnnualSummaries().then((sums) => {
      setAnnualSummaries(sums);
      if (sums.length >= 2) {
        setSelectedYearB(sums[0].year);
        setSelectedYearA(sums[1].year);
      }
    });
  }, [bills]);

  // Executar comparação de meses
  useEffect(() => {
    if (selectedBillA && selectedBillB && selectedBillA !== selectedBillB) {
      energyApi.compareTwoBills(selectedBillA, selectedBillB).then(setMonthResult).catch(console.error);
    }
  }, [selectedBillA, selectedBillB]);

  // Executar comparação anual
  useEffect(() => {
    if (selectedYearA && selectedYearB && selectedYearA !== selectedYearB) {
      energyApi.compareTwoYears(selectedYearA, selectedYearB).then(setYearResult).catch(console.error);
    }
  }, [selectedYearA, selectedYearB]);

  if (bills.length < 2) {
    return (
      <div className="page-container">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Comparação de Consumo
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Compare a evolução do seu consumo entre diferentes meses e anos
        </p>

        <EmptyState
          icon={GitCompare}
          title="Dados insuficientes para comparação"
          description="São necessárias pelo menos duas contas de luz cadastradas para realizar a análise comparativa detalhada."
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Comparação de Períodos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Diferença absoluta, percentual e variação de custos reais
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setTabMode('month')}
            className={`btn btn-sm ${tabMode === 'month' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Mês a Mês
          </button>
          <button
            onClick={() => setTabMode('year')}
            className={`btn btn-sm ${tabMode === 'year' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Anual
          </button>
        </div>
      </div>

      {tabMode === 'month' ? (
        <>
          {/* Seletores de Meses */}
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'center' }}>
              <div>
                <label className="form-label">Mês Anterior (Base de Comparação):</label>
                <select
                  className="form-select"
                  value={selectedBillA}
                  onChange={(e) => setSelectedBillA(e.target.value)}
                >
                  {bills.map(({ bill }) => (
                    <option key={bill.id} value={bill.id}>
                      {getMonthName(bill.month)} {bill.year} ({formatKwh(bill.kwh_total)} — {formatCurrency(bill.total_cents)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center' }}>
                <span className="badge badge-neutral" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  VS
                </span>
              </div>

              <div>
                <label className="form-label">Mês Atual (Para Análise):</label>
                <select
                  className="form-select"
                  value={selectedBillB}
                  onChange={(e) => setSelectedBillB(e.target.value)}
                >
                  {bills.map(({ bill }) => (
                    <option key={bill.id} value={bill.id}>
                      {getMonthName(bill.month)} {bill.year} ({formatKwh(bill.kwh_total)} — {formatCurrency(bill.total_cents)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Resultado da Comparação Mensal */}
          {monthResult && (
            <div>
              {/* Card Destaque de Variação */}
              <div
                style={{
                  background: monthResult.comparison.is_savings ? 'rgba(74, 222, 128, 0.08)' : 'rgba(248, 113, 113, 0.08)',
                  border: `1px solid ${monthResult.comparison.is_savings ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <span
                    className={`badge ${monthResult.comparison.is_savings ? 'badge-savings' : 'badge-danger'}`}
                    style={{ fontSize: '0.85rem', marginBottom: '8px' }}
                  >
                    {monthResult.comparison.is_savings ? (
                      <TrendingDown size={16} />
                    ) : (
                      <TrendingUp size={16} />
                    )}
                    {monthResult.comparison.is_savings ? 'Economia Registrada' : 'Aumento de Consumo'}
                  </span>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '6px 0' }}>
                    {formatKwh(Math.abs(monthResult.comparison.diff_kwh))} (
                    {formatPercentage(monthResult.comparison.pct_kwh)})
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                    {monthResult.comparison.is_savings
                      ? `Economia financeira de ${formatCurrency(Math.abs(monthResult.comparison.diff_cents))} em relação ao mês anterior.`
                      : `Acréscimo de ${formatCurrency(Math.abs(monthResult.comparison.diff_cents))} na fatura deste mês.`}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Variação de Custo</div>
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      color: monthResult.comparison.is_savings ? 'var(--color-savings)' : 'var(--color-danger)',
                    }}
                  >
                    {monthResult.comparison.is_savings ? '-' : '+'}
                    {formatCurrency(Math.abs(monthResult.comparison.diff_cents))}
                  </div>
                </div>
              </div>

              {/* Tabela de Comparação Lado a Lado */}
              <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <Card>
                  <div className="card-header">
                    <span className="card-title">
                      {getMonthName(monthResult.bill_a.month)} {monthResult.bill_a.year} (Anterior)
                    </span>
                    <span className="badge badge-neutral">{monthResult.bill_a.tariff_flag}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Consumo Total:</span>
                      <span style={{ fontWeight: 700 }}>{formatKwh(monthResult.bill_a.kwh_total)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Valor da Fatura:</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(monthResult.bill_a.total_cents)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Preço Efetivo do kWh:</span>
                      <span>{formatCurrency(monthResult.bill_a.total_cents / monthResult.bill_a.kwh_total)}/kWh</span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="card-header">
                    <span className="card-title">
                      {getMonthName(monthResult.bill_b.month)} {monthResult.bill_b.year} (Atual)
                    </span>
                    <span className="badge badge-neutral">{monthResult.bill_b.tariff_flag}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Consumo Total:</span>
                      <span style={{ fontWeight: 700 }}>{formatKwh(monthResult.bill_b.kwh_total)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Valor da Fatura:</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(monthResult.bill_b.total_cents)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Preço Efetivo do kWh:</span>
                      <span>{formatCurrency(monthResult.bill_b.total_cents / monthResult.bill_b.kwh_total)}/kWh</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Comparação Anual */}
          {annualSummaries.length < 2 ? (
            <EmptyState
              icon={Calendar}
              title="Dados de múltiplos anos necessários"
              description="Para comparar anos inteiros, cadastre faturas de pelo menos dois anos diferentes (ex: 2025 e 2026)."
            />
          ) : (
            <>
              <Card style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <label className="form-label">Ano Base:</label>
                    <select
                      className="form-select"
                      value={selectedYearA}
                      onChange={(e) => setSelectedYearA(parseInt(e.target.value))}
                    >
                      {annualSummaries.map((s) => (
                        <option key={s.year} value={s.year}>
                          {s.year} ({formatKwh(s.total_kwh)} — {formatCurrency(s.total_cents)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <span className="badge badge-neutral" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                      VS
                    </span>
                  </div>

                  <div>
                    <label className="form-label">Ano em Comparação:</label>
                    <select
                      className="form-select"
                      value={selectedYearB}
                      onChange={(e) => setSelectedYearB(parseInt(e.target.value))}
                    >
                      {annualSummaries.map((s) => (
                        <option key={s.year} value={s.year}>
                          {s.year} ({formatKwh(s.total_kwh)} — {formatCurrency(s.total_cents)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {yearResult && (
                <div>
                  <div
                    style={{
                      background: yearResult.is_savings ? 'rgba(74, 222, 128, 0.08)' : 'rgba(248, 113, 113, 0.08)',
                      border: `1px solid ${yearResult.is_savings ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px',
                      marginBottom: '24px',
                    }}
                  >
                    <span className={`badge ${yearResult.is_savings ? 'badge-savings' : 'badge-danger'}`}>
                      {yearResult.is_savings ? 'Economia Anual' : 'Aumento Anual'}
                    </span>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0' }}>
                      {formatKwh(Math.abs(yearResult.diff_kwh))} ({formatPercentage(yearResult.pct_kwh)})
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Diferença financeira acumulada no ano: {yearResult.is_savings ? 'Economia de ' : 'Aumento de '}
                      <strong>{formatCurrency(Math.abs(yearResult.diff_cents))}</strong>
                    </p>
                  </div>

                  <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {[yearResult.year_a, yearResult.year_b].map((sum) => (
                      <Card key={sum.year}>
                        <div className="card-header">
                          <span className="card-title">Ano de {sum.year}</span>
                          <span className="badge badge-neutral">{sum.bill_count} faturas</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Consumo Total:</span>
                            <span style={{ fontWeight: 700 }}>{formatKwh(sum.total_kwh)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Média Mensal:</span>
                            <span style={{ fontWeight: 600 }}>{formatKwh(sum.monthly_avg_kwh)}/mês</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Gasto Total no Ano:</span>
                            <span style={{ fontWeight: 700, color: 'var(--color-accent-mint)' }}>
                              {formatCurrency(sum.total_cents)}
                            </span>
                          </div>

                          {sum.best_month && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                              <span style={{ color: 'var(--color-savings)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Award size={14} /> Melhor Mês:
                              </span>
                              <span>{getMonthName(sum.best_month.month)} ({formatKwh(sum.best_month.kwh_total)})</span>
                            </div>
                          )}

                          {sum.worst_month && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={14} /> Maior Consumo:
                              </span>
                              <span>{getMonthName(sum.worst_month.month)} ({formatKwh(sum.worst_month.kwh_total)})</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
