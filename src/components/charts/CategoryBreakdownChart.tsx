import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { formatKwh } from '../../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BreakdownItem {
  label: string;
  valueKwh: number;
  percentage: number;
}

interface CategoryBreakdownChartProps {
  items: BreakdownItem[];
  title?: string;
}

const PALETTE = [
  '#2d6a4f',
  '#40916c',
  '#52b788',
  '#74c69d',
  '#95d5b2',
  '#52796f',
  '#84a98c',
  '#b7e4c7',
  '#d8f3dc',
  '#1b4332',
];

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const chartData = {
    labels: items.map((i) => i.label),
    datasets: [
      {
        data: items.map((i) => i.valueKwh),
        backgroundColor: items.map((_, index) => PALETTE[index % PALETTE.length]),
        borderColor: '#081c15',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#c9d6cf',
          font: { size: 11 },
          boxWidth: 12,
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: '#081c15',
        titleColor: '#f8f9fa',
        bodyColor: '#c9d6cf',
        borderColor: 'rgba(116, 198, 157, 0.3)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const item = items[context.dataIndex];
            if (!item) return '';
            return ` ${item.label}: ${formatKwh(item.valueKwh)} (${(item.percentage ?? 0).toFixed(1)}%)`;
          },
        },
      },
    },
    cutout: '68%',
  };

  return (
    <div style={{ height: '240px', width: '100%', position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};
