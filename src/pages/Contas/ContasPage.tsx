import React from 'react';
import {
  Plus,
  Receipt,
  Edit2,
  Copy,
  Trash2,
  TrendingDown,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { BillCardView, EnergyBill } from '../../types';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatKwh, formatPercentage, getMonthName } from '../../utils/formatters';

interface ContasPageProps {
  bills: BillCardView[];
  onOpenCreateBill: () => void;
  onOpenEditBill: (bill: EnergyBill) => void;
  onDeleteBill: (id: string) => Promise<void>;
  onDuplicateBill: (id: string) => Promise<void>;
  selectedBillForDetail: EnergyBill | null;
  setSelectedBillForDetail: (bill: EnergyBill | null) => void;
}

export const ContasPage: React.FC<ContasPageProps> = ({
  bills,
  onOpenCreateBill,
  onOpenEditBill,
  onDeleteBill,
  onDuplicateBill,
  selectedBillForDetail,
  setSelectedBillForDetail,
}) => {
  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Contas de Energia
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Histórico das faturas de luz de Videira SC com comparativo mensal
          </p>
        </div>

        <button onClick={onOpenCreateBill} className="btn btn-primary">
          <Plus size={18} />
          Cadastrar Fatura
        </button>
      </div>

      {bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma conta de luz cadastrada"
          description="Cadastre sua fatura informando apenas o consumo em kWh e o valor total pago para iniciar o gerenciamento."
          actionText="Cadastrar Primeira Conta"
          onAction={onOpenCreateBill}
        />
      ) : (
        <div className="grid-cards">
          {bills.map(({ bill, effective_rate_cents, diff_kwh, diff_kwh_pct, diff_cents, diff_cents_pct }) => {
            const hasPrev = diff_kwh != null;
            const isSavings = hasPrev && diff_kwh <= 0;

            return (
              <Card key={bill.id}>
                <div className="card-header">
                  <span className="card-title">
                    <Calendar size={16} />
                    {getMonthName(bill.month).toUpperCase()} {bill.year}
                  </span>
                  <span className="badge badge-neutral">{bill.tariff_flag}</span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div className="card-value">{formatKwh(bill.kwh_total)}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-accent-mint)' }}>
                    {formatCurrency(bill.total_cents)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Tarifa média: {formatCurrency(effective_rate_cents)}/kWh
                  </div>
                </div>

                {hasPrev && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    <span className={`badge ${isSavings ? 'badge-savings' : 'badge-danger'}`}>
                      {isSavings ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                      {diff_kwh_pct != null ? formatPercentage(diff_kwh_pct) : '0%'} consumo
                    </span>
                    <span className={`badge ${(diff_cents ?? 0) <= 0 ? 'badge-savings' : 'badge-danger'}`}>
                      {diff_cents_pct != null ? formatPercentage(diff_cents_pct) : '0%'} custo
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    onClick={() => setSelectedBillForDetail(bill)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Detalhes
                  </button>
                  <button
                    onClick={() => onOpenEditBill(bill)}
                    className="btn btn-secondary btn-sm"
                    title="Editar fatura"
                    style={{ padding: '6px 10px' }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => onDuplicateBill(bill.id)}
                    className="btn btn-secondary btn-sm"
                    title="Duplicar para próximo mês"
                    style={{ padding: '6px 10px' }}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir a fatura de ${getMonthName(bill.month)}/${bill.year}?`)) {
                        onDeleteBill(bill.id);
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    title="Excluir fatura"
                    style={{ padding: '6px 10px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes da Conta */}
      {selectedBillForDetail && (
        <Modal
          isOpen={!!selectedBillForDetail}
          onClose={() => setSelectedBillForDetail(null)}
          title={`Detalhes da Fatura — ${getMonthName(selectedBillForDetail.month)}/${selectedBillForDetail.year}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consumo Total</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatKwh(selectedBillForDetail.kwh_total)}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valor Pago</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>
                  {formatCurrency(selectedBillForDetail.total_cents)}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Preço Médio Estimado por kWh:</span>
                <span style={{ fontWeight: 600 }}>
                  {formatCurrency(selectedBillForDetail.total_cents / selectedBillForDetail.kwh_total)}/kWh
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bandeira Tarifária:</span>
                <span className="badge badge-neutral">{selectedBillForDetail.tariff_flag}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Distribuidora:</span>
                <span>{selectedBillForDetail.distributor}</span>
              </div>

              {selectedBillForDetail.start_date && selectedBillForDetail.end_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Período de Leitura:</span>
                  <span>{selectedBillForDetail.start_date} até {selectedBillForDetail.end_date}</span>
                </div>
              )}

              {selectedBillForDetail.notes && (
                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <strong>Anotações: </strong> {selectedBillForDetail.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={() => setSelectedBillForDetail(null)} className="btn btn-secondary">
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
