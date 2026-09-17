export function formatCurrency(cents: number): string {
  const reais = (cents || 0) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

export function formatKwh(kwh: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(kwh || 0);
  return `${formatted} kWh`;
}

export function formatPercentage(pct: number, includeSign = true): string {
  const sign = includeSign && pct > 0 ? '+' : '';
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(pct || 0);
  return `${sign}${formatted}%`;
}

export function getMonthName(month: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[month - 1] || `Mês ${month}`;
}
