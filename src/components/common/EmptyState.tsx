import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-subtle)',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(82, 183, 136, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-accent-mint)',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
        {title}
      </h3>

      <p style={{ maxWidth: '420px', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: actionText ? '20px' : 0 }}>
        {description}
      </p>

      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
