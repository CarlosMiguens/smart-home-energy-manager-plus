import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  TrendingDown,
  ArrowRight,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { DeviceCalculatedMetrics, SimulationResult } from '../../types';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { energyApi } from '../../services/tauriBridge';
import { formatCurrency, formatKwh, formatPercentage } from '../../utils/formatters';

interface SimuladorPageProps {
  devices: DeviceCalculatedMetrics[];
  preselectedDeviceId?: string;
  onApplyChanges: () => Promise<void>;
}

export const SimuladorPage: React.FC<SimuladorPageProps> = ({
  devices,
  preselectedDeviceId,
  onApplyChanges,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [simulatedHours, setSimulatedHours] = useState<number>(4);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  useEffect(() => {
    if (devices.length > 0) {
      const initId = preselectedDeviceId && devices.some((d) => d.device.id === preselectedDeviceId)
        ? preselectedDeviceId
        : devices[0].device.id;
      setSelectedId(initId);
      const dev = devices.find((d) => d.device.id === initId);
      if (dev) {
        setSimulatedHours(Math.max(0.5, Math.round((dev.device.hours_per_day - 1) * 10) / 10));
      }
    }
  }, [devices, preselectedDeviceId]);

  useEffect(() => {
    if (selectedId && simulatedHours >= 0) {
      setAppliedSuccess(false);
      energyApi.simulateDevice(selectedId, simulatedHours).then(setSimulationResult).catch(console.error);
    }
  }, [selectedId, simulatedHours]);

  const handleDeviceChange = (id: string) => {
    setSelectedId(id);
    const dev = devices.find((d) => d.device.id === id);
    if (dev) {
      setSimulatedHours(Math.max(0.5, Math.round((dev.device.hours_per_day - 1) * 10) / 10));
    }
  };

  const handleApply = async () => {
    if (!simulationResult) return;
    setIsApplying(true);
    try {
      await energyApi.applySimulation(simulationResult.device_id, simulatedHours);
      await onApplyChanges();
      setAppliedSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao aplicar simulação');
    } finally {
      setIsApplying(false);
    }
  };

  if (devices.length === 0) {
    return (
      <div className="page-container">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Simulador de Uso
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Simule mudanças de hábitos e veja o impacto financeiro exato na sua conta de luz
        </p>

        <EmptyState
          icon={Sliders}
          title="Nenhum eletrodoméstico cadastrado"
          description="Cadastre seus aparelhos na aba 'Dispositivos' para começar a simular cenários de economia."
        />
      </div>
    );
  }

  const selectedDevice = devices.find((d) => d.device.id === selectedId);

  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Simulador de Cenários de Consumo
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Ajuste as horas diárias dos aparelhos para visualizar a economia mensal e anual antes de aplicar mudanças reais.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Painel de Controle */}
        <Card>
          <div className="card-header">
            <span className="card-title">
              <Sliders size={16} color="var(--color-accent-mint)" />
              Configurar Cenário
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Selecione o Aparelho:</label>
            <select
              className="form-select"
              value={selectedId}
              onChange={(e) => handleDeviceChange(e.target.value)}
            >
              {devices.map((d) => (
                <option key={d.device.id} value={d.device.id}>
                  {d.device.name} ({d.device.power_watts}W — Uso Atual: {d.device.hours_per_day}h/dia)
                </option>
              ))}
            </select>
          </div>

          {selectedDevice && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Uso Atual Cadastrado:</span>
                <span style={{ fontWeight: 700 }}>{selectedDevice.device.hours_per_day} h/dia</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Consumo Atual Estimado:</span>
                <span>{formatKwh(selectedDevice.monthly_kwh)}/mês</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Custo Atual Estimado:</span>
                <span style={{ color: 'var(--color-accent-mint)' }}>
                  {formatCurrency(selectedDevice.monthly_cost_cents)}/mês
                </span>
              </div>
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Novo Tempo de Uso Desejado:
              </label>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>
                {(simulatedHours ?? 0).toFixed(1)} h/dia
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={simulatedHours}
              onChange={(e) => setSimulatedHours(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-accent-mint)', cursor: 'pointer' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
              <span>18h</span>
              <span>24h</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {selectedDevice && [
              selectedDevice.device.hours_per_day - 2,
              selectedDevice.device.hours_per_day - 1,
              selectedDevice.device.hours_per_day * 0.75,
            ].filter((h) => h >= 0.2).map((presetH, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSimulatedHours(Math.round(presetH * 10) / 10)}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, fontSize: '0.75rem' }}
              >
                {Math.round(presetH * 10) / 10}h ({formatPercentage(((presetH - selectedDevice.device.hours_per_day) / selectedDevice.device.hours_per_day) * 100)})
              </button>
            ))}
          </div>
        </Card>

        {/* Painel de Resultados da Simulação */}
        {simulationResult && (
          <Card>
            <div className="card-header">
              <span className="card-title">
                <Sparkles size={16} color="var(--color-accent-sage)" />
                Resultado da Simulação
              </span>
              <span className="badge badge-neutral">Estimativa Real</span>
            </div>

            {/* Comparativo Atual vs Novo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cenário Atual</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, margin: '4px 0' }}>
                  {formatKwh(simulationResult.current_monthly_kwh)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {formatCurrency(simulationResult.current_monthly_cents)}/mês
                </div>
              </div>

              <div style={{ background: 'rgba(82, 183, 136, 0.08)', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-accent-sage)' }}>Novo Cenário</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, margin: '4px 0', color: 'var(--color-accent-mint)' }}>
                  {formatKwh(simulationResult.new_monthly_kwh)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {formatCurrency(simulationResult.new_monthly_cents)}/mês
                </div>
              </div>
            </div>

            {/* Economia Projetada Mensal e Anual */}
            <div
              style={{
                background: simulationResult.saved_monthly_kwh > 0 ? 'rgba(74, 222, 128, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                border: `1px solid ${simulationResult.saved_monthly_kwh > 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {simulationResult.saved_monthly_kwh >= 0 ? 'Economia Mensal Estimada:' : 'Aumento Mensal Estimado:'}
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: simulationResult.saved_monthly_kwh >= 0 ? 'var(--color-savings)' : 'var(--color-warning)' }}>
                  {formatCurrency(Math.abs(simulationResult.saved_monthly_cents))}/mês
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {simulationResult.saved_monthly_kwh >= 0 ? 'Economia Anual Projetada:' : 'Aumento Anual Projetado:'}
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: simulationResult.saved_monthly_kwh >= 0 ? 'var(--color-savings)' : 'var(--color-warning)' }}>
                  {formatCurrency(Math.abs(simulationResult.saved_annual_cents))}/ano
                </span>
              </div>
            </div>

            {/* Confirmação Segura */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              ℹ️ Os dados cadastrados do aparelho não serão alterados até que você confirme explicitamente abaixo.
            </div>

            {appliedSuccess ? (
              <div style={{ background: 'rgba(74, 222, 128, 0.15)', color: 'var(--color-savings)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Check size={18} /> Novo hábito atualizado com sucesso no aparelho!
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={isApplying || simulatedHours === selectedDevice?.device.hours_per_day}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {isApplying ? 'Atualizando...' : 'Confirmar e Atualizar Uso do Aparelho'}
              </button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
