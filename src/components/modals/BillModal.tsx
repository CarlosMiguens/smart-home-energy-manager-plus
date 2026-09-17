import React, { useState, useEffect } from 'react';
import { Info, Calendar } from 'lucide-react';
import { EnergyBill } from '../../types';
import { Modal } from '../common/Modal';
import { getMonthName } from '../../utils/formatters';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: Partial<EnergyBill>) => Promise<void>;
  editingBill?: EnergyBill | null;
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBill = null,
}) => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [kwhTotal, setKwhTotal] = useState<string>('');
  const [valorTotal, setValorTotal] = useState<string>('');
  const [tarifaKwh, setTarifaKwh] = useState<string>('');
  const [taxasAdicionais, setTaxasAdicionais] = useState<string>('0');
  const [bandeira, setBandeira] = useState<string>('Verde');
  const [distribuidora, setDistribuidora] = useState<string>('Celesc');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (editingBill) {
        setMonth(editingBill.month);
        setYear(editingBill.year);
        setStartDate(editingBill.start_date || '');
        setEndDate(editingBill.end_date || '');
        setKwhTotal(editingBill.kwh_total.toString());
        setValorTotal(((editingBill.total_cents ?? 0) / 100).toFixed(2));
        setTarifaKwh(
          editingBill.kwh_rate_cents
            ? (editingBill.kwh_rate_cents / 100).toFixed(4)
            : ''
        );
        setTaxasAdicionais(
          ((editingBill.additional_taxes_cents ?? 0) / 100).toFixed(2)
        );
        setBandeira(editingBill.tariff_flag || 'Verde');
        setDistribuidora(editingBill.distributor || 'Celesc');
        setNotes(editingBill.notes || '');
      } else {
        setMonth(new Date().getMonth() + 1);
        setYear(new Date().getFullYear());
        setStartDate('');
        setEndDate('');
        setKwhTotal('');
        setValorTotal('');
        setTarifaKwh('');
        setTaxasAdicionais('0');
        setBandeira('Verde');
        setDistribuidora('Celesc');
        setNotes('');
      }
    }
  }, [isOpen, editingBill]);

  const kwhNum = parseFloat(kwhTotal) || 0;
  const valorNum = parseFloat(valorTotal.replace(',', '.')) || 0;
  const computedAverageRate = kwhNum > 0 ? valorNum / kwhNum : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kwhNum || !valorNum) {
      alert('Por favor, informe o consumo em kWh e o valor da conta.');
      return;
    }

    setIsSubmitting(true);
    try {
      const valorCents = Math.round(valorNum * 100);
      const taxaNum = parseFloat(taxasAdicionais.replace(',', '.')) || 0;
      const taxaCents = Math.round(taxaNum * 100);

      const parsedTarifa = parseFloat(tarifaKwh.replace(',', '.'));
      const tarifaCents = !isNaN(parsedTarifa) && parsedTarifa > 0
        ? Math.round(parsedTarifa * 100)
        : Math.round(computedAverageRate * 100);

      const billData: Partial<EnergyBill> = {
        month,
        year,
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
        kwh_total: kwhNum,
        total_cents: valorCents,
        kwh_rate_cents: tarifaCents,
        additional_taxes_cents: taxaCents,
        tariff_flag: bandeira,
        distributor: distribuidora.trim() || 'Celesc',
        notes: notes.trim() || undefined,
      };

      await onSave(billData);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar fatura: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBill ? 'Editar Fatura de Energia' : 'Cadastrar Nova Fatura de Luz'}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Mês de Referência *</label>
            <select
              className="form-select"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ano *</label>
            <input
              type="number"
              className="form-input"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
              min="2020"
              max="2035"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Consumo Total em kWh *</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              placeholder="Ex: 348"
              value={kwhTotal}
              onChange={(e) => setKwhTotal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor Total Pago (R$) *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: 301,50"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Destaque do cálculo automático do preço médio estimado */}
        {kwhNum > 0 && valorNum > 0 && (
          <div
            style={{
              background: 'rgba(82, 183, 136, 0.1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Info size={18} color="var(--color-accent-mint)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Preço médio efetivo calculado: </strong>
              R$ {(computedAverageRate || 0).toFixed(4)} por kWh
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Este é um valor médio estimado obtido dividindo o total da fatura pelo consumo.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Bandeira Tarifária</label>
            <select
              className="form-select"
              value={bandeira}
              onChange={(e) => setBandeira(e.target.value)}
            >
              <option value="Verde">Verde (Sem acréscimo)</option>
              <option value="Amarela">Amarela</option>
              <option value="Vermelha 1">Vermelha Patamar 1</option>
              <option value="Vermelha 2">Vermelha Patamar 2</option>
              <option value="Escassez Hídrica">Escassez Hídrica</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Distribuidora</label>
            <input
              type="text"
              className="form-input"
              value={distribuidora}
              onChange={(e) => setDistribuidora(e.target.value)}
              placeholder="Ex: Celesc"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Data Início Medição (Opcional)</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Data Fim Medição (Opcional)</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Observações da Fatura (Opcional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Inverno em Videira com uso elevado de aquecedor"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : editingBill ? 'Salvar Alterações' : 'Cadastrar Conta'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
