import React, { useState } from 'react';
import {
  Plus,
  Home,
  Edit2,
  Trash2,
  Zap,
  DollarSign,
  PieChart as PieIcon,
} from 'lucide-react';
import { Room, RoomConsumptionSummary } from '../../types';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { CategoryBreakdownChart } from '../../components/charts/CategoryBreakdownChart';
import { formatCurrency, formatKwh } from '../../utils/formatters';

interface ComodosPageProps {
  rooms: RoomConsumptionSummary[];
  onCreateRoom: (room: Partial<Room>) => Promise<void>;
  onUpdateRoom: (room: Room) => Promise<void>;
  onDeleteRoom: (id: string) => Promise<void>;
}

const DEFAULT_ROOM_NAMES = [
  'Sala de Estar',
  'Cozinha',
  'Quarto Casal',
  'Quarto Filhos',
  'Banheiro',
  'Escritório',
  'Garagem',
  'Lavanderia',
  'Área Externa',
  'Outros',
];

export const ComodosPage: React.FC<ComodosPageProps> = ({
  rooms,
  onCreateRoom,
  onUpdateRoom,
  onDeleteRoom,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [name, setName] = useState('Sala de Estar');

  const openCreateModal = () => {
    setEditingRoom(null);
    setName('Sala de Estar');
    setIsModalOpen(true);
  };

  const openEditModal = (r: Room) => {
    setEditingRoom(r);
    setName(r.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingRoom) {
      await onUpdateRoom({
        ...editingRoom,
        name: name.trim(),
      });
    } else {
      await onCreateRoom({
        name: name.trim(),
        icon: 'Home',
      });
    }
    setIsModalOpen(false);
  };

  const chartItems = rooms.map((r) => ({
    label: r.room.name,
    valueKwh: r.estimated_monthly_kwh,
    percentage: r.percentage_of_home,
  }));

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Cômodos da Residência
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Divisão e distribuição do consumo elétrico por ambientes da casa
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          Novo Cômodo
        </button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Nenhum cômodo cadastrado"
          description="Cadastre os ambientes da residência para acompanhar onde a energia está sendo consumida."
          actionText="Cadastrar Primeiro Cômodo"
          onAction={openCreateModal}
        />
      ) : (
        <>
          {/* Gráfico de Distribuição por Cômodo */}
          {chartItems.some((i) => i.valueKwh > 0) && (
            <Card style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <span className="card-title" style={{ fontSize: '1rem' }}>
                  <PieIcon size={16} /> Distribuição do Consumo por Ambiente
                </span>
                <span className="badge badge-neutral">Estimativa Mensal</span>
              </div>
              <CategoryBreakdownChart items={chartItems} />
            </Card>
          )}

          {/* Grid de Cards de Cômodos */}
          <div className="grid-cards">
            {rooms.map(({ room, device_count, estimated_monthly_kwh, estimated_monthly_cents, percentage_of_home }) => (
              <Card key={room.id}>
                <div className="card-header">
                  <span className="card-title">
                    <Home size={16} color="var(--color-accent-mint)" />
                    {room.name}
                  </span>
                  <span className="badge badge-neutral">{percentage_of_home}% da casa</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consumo Mensal</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatKwh(estimated_monthly_kwh)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custo Estimado</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>
                      {formatCurrency(estimated_monthly_cents)}/mês
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  {device_count} {device_count === 1 ? 'aparelho instalado' : 'aparelhos instalados'}
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    onClick={() => openEditModal(room)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o cômodo ${room.name}?`)) {
                        onDeleteRoom(room.id);
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    title="Excluir cômodo"
                    style={{ padding: '6px 12px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal de Criação / Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Editar Cômodo' : 'Novo Cômodo'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do Cômodo *</label>
            <input
              type="text"
              list="room-suggestions"
              className="form-input"
              placeholder="Ex: Cozinha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <datalist id="room-suggestions">
              {DEFAULT_ROOM_NAMES.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
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
              {editingRoom ? 'Salvar Alterações' : 'Cadastrar Cômodo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
