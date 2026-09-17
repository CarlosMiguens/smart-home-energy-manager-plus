import React, { useState } from 'react';
import {
  Plus,
  Tv,
  Edit2,
  Trash2,
  Clock,
  Zap,
  DollarSign,
  User,
  Home,
  Sliders,
} from 'lucide-react';
import { Device, DeviceCalculatedMetrics, InternalUser, Room } from '../../types';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatKwh } from '../../utils/formatters';

interface DispositivosPageProps {
  devices: DeviceCalculatedMetrics[];
  users: InternalUser[];
  rooms: Room[];
  onCreateDevice: (device: Partial<Device>) => Promise<void>;
  onUpdateDevice: (device: Device) => Promise<void>;
  onDeleteDevice: (id: string) => Promise<void>;
  onSimulateDevice: (deviceId: string) => void;
}

const CATEGORIES = [
  'Ar-condicionado',
  'Chuveiro',
  'Geladeira',
  'Freezer',
  'Televisor',
  'Computador',
  'Notebook',
  'Máquina de lavar',
  'Secadora',
  'Micro-ondas',
  'Forno',
  'Iluminação',
  'Ventilador',
  'Aquecedor',
  'Videogame',
  'Carregadores',
  'Outros',
];

export const DispositivosPage: React.FC<DispositivosPageProps> = ({
  devices,
  users,
  rooms,
  onCreateDevice,
  onUpdateDevice,
  onDeleteDevice,
  onSimulateDevice,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Formulário
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Ar-condicionado');
  const [customCategory, setCustomCategory] = useState('');
  const [powerWatts, setPowerWatts] = useState('1200');
  const [quantity, setQuantity] = useState('1');
  const [hoursPerDay, setHoursPerDay] = useState('6');
  const [daysPerMonth, setDaysPerMonth] = useState('30');
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [notes, setNotes] = useState('');

  // Estado para seletor de duração do card "Quanto custa usar?"
  const [durationSelections, setDurationSelections] = useState<Record<string, number>>({});

  const openCreateModal = () => {
    setEditingDevice(null);
    setName('');
    setCategory('Ar-condicionado');
    setCustomCategory('');
    setPowerWatts('1200');
    setQuantity('1');
    setHoursPerDay('4');
    setDaysPerMonth('30');
    setRoomId('');
    setUserId('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: Device) => {
    setEditingDevice(d);
    setName(d.name);
    if (CATEGORIES.includes(d.category)) {
      setCategory(d.category);
      setCustomCategory('');
    } else {
      setCategory('Outros');
      setCustomCategory(d.category);
    }
    setPowerWatts(d.power_watts.toString());
    setQuantity(d.quantity.toString());
    setHoursPerDay(d.hours_per_day.toString());
    setDaysPerMonth(d.days_per_month.toString());
    setRoomId(d.room_id || '');
    setUserId(d.user_id || '');
    setNotes(d.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const watts = parseFloat(powerWatts) || 0;
    const qty = parseInt(quantity) || 1;
    const hours = parseFloat(hoursPerDay) || 0;
    const days = parseInt(daysPerMonth) || 30;

    if (!name || watts <= 0) {
      alert('Informe um nome e uma potência válida em Watts.');
      return;
    }

    const finalCategory = category === 'Outros' && customCategory.trim() ? customCategory.trim() : category;

    const payload: Partial<Device> = {
      name,
      category: finalCategory,
      power_watts: watts,
      quantity: qty,
      hours_per_day: hours,
      days_per_month: days,
      room_id: roomId || undefined,
      user_id: userId || undefined,
      notes: notes || undefined,
    };

    if (editingDevice) {
      await onUpdateDevice({ ...editingDevice, ...payload } as Device);
    } else {
      await onCreateDevice(payload);
    }

    setIsModalOpen(false);
  };

  const getDurationCost = (metric: DeviceCalculatedMetrics, minutes: number) => {
    if (minutes === 15) return metric.cost_15min_cents;
    if (minutes === 30) return metric.cost_30min_cents;
    if (minutes === 60) return metric.cost_1h_cents;
    if (minutes === 120) return metric.cost_2h_cents;
    // Custo customizado
    const kw = metric.power_kw * metric.device.quantity;
    const h = minutes / 60;
    return Math.round(kw * h * 88.5);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Meus Dispositivos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Eletrodomésticos da residência com cálculo de potência, consumo e custo por tempo de uso
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          Adicionar Aparelho
        </button>
      </div>

      {devices.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="Nenhum eletrodoméstico cadastrado"
          description="Cadastre seus aparelhos para estimar os gastos mensais por cômodo, descobrir quanto custa usar cada equipamento por hora e planejar reduções."
          actionText="Cadastrar Primeiro Aparelho"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid-cards">
          {devices.map((metric) => {
            const { device } = metric;
            const selectedDuration = durationSelections[device.id] || 60;

            return (
              <Card key={device.id}>
                <div className="card-header">
                  <span className="card-title">
                    <Zap size={16} color="var(--color-accent-mint)" />
                    {device.name}
                  </span>
                  <span className="badge badge-neutral">{device.category}</span>
                </div>

                {/* Métricas Principais */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consumo Mensal</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatKwh(metric.monthly_kwh)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custo Estimado</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>
                      {formatCurrency(metric.monthly_cost_cents)}/mês
                    </div>
                  </div>
                </div>

                {/* Especificações Técnicas */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                  <div>
                    <strong>Potência:</strong> {device.power_watts} W ({metric.power_kw} kW) {device.quantity > 1 ? `× ${device.quantity} un.` : ''}
                  </div>
                  <div>
                    <strong>Uso:</strong> {device.hours_per_day} h/dia • {device.days_per_month} dias/mês ({formatKwh(metric.daily_kwh)}/dia)
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                    {device.room_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <Home size={13} /> {device.room_name}
                      </span>
                    )}
                    {device.user_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <User size={13} /> {device.user_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Módulo: "Quanto custa usar este aparelho?" */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent-sage)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> Quanto custa usar?
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(getDurationCost(metric, selectedDuration))}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[15, 30, 60, 120].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setDurationSelections({ ...durationSelections, [device.id]: dur })}
                        className={`btn btn-sm ${selectedDuration === dur ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '2px 6px', fontSize: '0.72rem', minHeight: '26px' }}
                      >
                        {dur < 60 ? `${dur}m` : `${dur / 60}h`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    onClick={() => onSimulateDevice(device.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Sliders size={14} /> Simular
                  </button>
                  <button
                    onClick={() => openEditModal(device)}
                    className="btn btn-secondary btn-sm"
                    title="Editar aparelho"
                    style={{ padding: '6px 10px' }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir aparelho ${device.name}?`)) {
                        onDeleteDevice(device.id);
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    title="Excluir aparelho"
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

      {/* Modal de Criação / Edição de Aparelho */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDevice ? 'Editar Aparelho' : 'Novo Aparelho Elétrico'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do Aparelho *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Ar-condicionado Inverter 12.000 BTUs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {category === 'Outros' ? (
              <div className="form-group">
                <label className="form-label">Categoria Personalizada</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome da categoria"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Potência em Watts (W) *</label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                placeholder="Ex: 1200"
                value={powerWatts}
                onChange={(e) => setPowerWatts(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Horas de Uso por Dia *</label>
              <input
                type="number"
                min="0.05"
                max="24"
                step="0.1"
                className="form-input"
                placeholder="Ex: 6"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Dias Utilizados no Mês</label>
              <input
                type="number"
                min="1"
                max="31"
                className="form-input"
                value={daysPerMonth}
                onChange={(e) => setDaysPerMonth(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cômodo da Casa</label>
              <select
                className="form-select"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                <option value="">(Nenhum selecionado)</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Usuário Principal da Residência</label>
            <select
              className="form-select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">(Uso compartilhado / Nenhum)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observações (Opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Utilizado no ciclo quente durante o inverno"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDevice ? 'Salvar Alterações' : 'Adicionar Aparelho'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
