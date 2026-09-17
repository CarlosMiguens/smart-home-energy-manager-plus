import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { EnergyBill } from '../../types';
import { getMonthName, formatCurrency, formatKwh } from '../../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyChartProps {
  bills: EnergyBill[];
  onSelectBill?: (bill: EnergyBill) => void;
}

type MetricType = 'kwh' | 'cents' | 'rate';

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ bills, onSelectBill }) => {
  const [metric, setMetric] = useState<MetricType>('kwh');

  // Ordenar cronologicamente para exibição no gráfico (mais antigo para o mais novo)
  const sortedBills = [...bills].reverse().slice(-12);

  if (sortedBills.length === 0) {
    return null;
  }

  const labels = sortedBills.map((b) => `${getMonthName(b.month).substring(0, 3)}/${String(b.year).slice(2)}`);

  let dataValues: number[] = [];
  let yAxisLabel = '';

  if (metric === 'kwh') {
    dataValues = sortedBills.map((b) => b.kwh_total);
    yAxisLabel = 'Consumo (kWh)';
  } else if (metric === 'cents') {
    dataValues = sortedBills.map((b) => b.total_cents / 100);
    yAxisLabel = 'Valor (R$)';
  } else {
    dataValues = sortedBills.map((b) => {
      const eff = b.kwh_total > 0 ? b.total_cents / b.kwh_total : 0;
      return Math.round(eff) / 100;
    });
    yAxisLabel = 'Preço Médio (R$/kWh)';
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: yAxisLabel,
        data: dataValues,
        backgroundColor: sortedBills.map((_, i) =>
          i === sortedBills.length - 1 ? 'rgba(82, 183, 136, 0.9)' : 'rgba(45, 106, 79, 0.65)'
        ),
        borderColor: 'rgba(82, 183, 136, 1)',
        borderWidth: 1.5,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(116, 198, 157, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#081c15',
        titleColor: '#f8f9fa',
        bodyColor: '#c9d6cf',
        borderColor: 'rgba(116, 198, 157, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (context: any) => {
            const val = context.raw as number;
            if (metric === 'kwh') return formatKwh(val);
            if (metric === 'cents') return formatCurrency(val * 100);
            return `R$ ${(val ?? 0).toFixed(3)} / kWh`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8ca397', font: { size: 12 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8ca397', font: { size: 12 } },
      },
    },
    onClick: (_event: any, elements: any[]) => {
      if (elements.length > 0 && onSelectBill) {
        const index = elements[0].index;
        const selected = sortedBills[index];
        if (selected) onSelectBill(selected);
      }
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Toque em uma coluna para ver os detalhes do mês
        </div>

        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setMetric('kwh')}
            className={`btn btn-sm ${metric === 'kwh' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '4px 10px', minHeight: '28px' }}
          >
            Consumo kWh
          </button>
          <button
            onClick={() => setMetric('cents')}
            className={`btn btn-sm ${metric === 'cents' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '4px 10px', minHeight: '28px' }}
          >
            Valor R$
          </button>
          <button
            onClick={() => setMetric('rate')}
            className={`btn btn-sm ${metric === 'rate' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '4px 10px', minHeight: '28px' }}
          >
            Preço Médio
          </button>
        </div>
      </div>

      <div style={{ height: '260px', width: '100%' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
