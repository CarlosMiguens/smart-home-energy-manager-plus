import React from 'react';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  sublabel?: string;
  isExceeded?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  sublabel,
  isExceeded,
}) => {
  const clampedPct = Math.min(Math.max(percentage, 0), 100);

  return (
    <div>
      {(label || sublabel) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            marginBottom: '4px',
            color: 'var(--text-secondary)',
          }}
        >
          {label && <span style={{ fontWeight: 500 }}>{label}</span>}
          {sublabel && <span style={{ color: 'var(--text-muted)' }}>{sublabel}</span>}
        </div>
      )}

      <div className="progress-bar-container">
        <div
          className={`progress-bar-fill ${isExceeded ? 'exceeded' : ''}`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
    </div>
  );
};
