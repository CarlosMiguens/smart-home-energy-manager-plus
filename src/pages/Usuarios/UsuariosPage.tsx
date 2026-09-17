import React, { useState } from 'react';
import { Plus, Users, User, Edit2, Trash2, Zap, DollarSign } from 'lucide-react';
import { InternalUser, UserConsumptionSummary } from '../../types';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatKwh } from '../../utils/formatters';

interface UsuariosPageProps {
  users: UserConsumptionSummary[];
  onCreateUser: (user: Partial<InternalUser>) => Promise<void>;
  onUpdateUser: (user: InternalUser) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

const AVATAR_OPTIONS = ['User', 'Smile', 'Leaf', 'Sun', 'Heart', 'Briefcase', 'Gamepad2'];
const COLOR_OPTIONS = ['#2d6a4f', '#40916c', '#52796f', '#e07a5f', '#3d5a80', '#9b5de5', '#f15bb5'];

export const UsuariosPage: React.FC<UsuariosPageProps> = ({
  users,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('User');
  const [color, setColor] = useState('#2d6a4f');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setAvatar('User');
    setColor('#2d6a4f');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: InternalUser) => {
    setEditingUser(u);
    setName(u.name);
    setAvatar(u.avatar);
    setColor(u.color);
    setNotes(u.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingUser) {
      await onUpdateUser({
        ...editingUser,
        name: name.trim(),
        avatar,
        color,
        notes: notes.trim() || undefined,
      });
    } else {
      await onCreateUser({
        name: name.trim(),
        avatar,
        color,
        notes: notes.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Usuários da Residência
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Perfis locais da família para atribuição de aparelhos e acompanhamento de hábitos
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          Novo Perfil
        </button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum perfil cadastrado"
          description="Crie perfis para os moradores da casa (ex: Carlos, Ana, João, Maria) para identificar quem utiliza cada aparelho."
          actionText="Cadastrar Primeiro Morador"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid-cards">
          {users.map(({ user, device_count, estimated_monthly_kwh, estimated_monthly_cents, percentage_of_home }) => (
            <Card key={user.id}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: user.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {user.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {device_count} {device_count === 1 ? 'aparelho atribuído' : 'aparelhos atribuídos'}
                    </div>
                  </div>
                </div>

                <span className="badge badge-neutral">{percentage_of_home}% da casa</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consumo Estimado</div>
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

              {user.notes && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                  {user.notes}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <button
                  onClick={() => openEditModal(user)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Excluir perfil de ${user.name}?`)) {
                      onDeleteUser(user.id);
                    }
                  }}
                  className="btn btn-danger btn-sm"
                  title="Excluir perfil"
                  style={{ padding: '6px 12px' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Perfil de Usuário' : 'Novo Perfil de Morador'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do Morador *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Carlos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cor de Identificação</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: color === c ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    transform: color === c ? 'scale(1.15)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observações / Hábitos (Opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Utiliza escritório e ar do quarto"
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
              {editingUser ? 'Salvar Alterações' : 'Criar Perfil'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
