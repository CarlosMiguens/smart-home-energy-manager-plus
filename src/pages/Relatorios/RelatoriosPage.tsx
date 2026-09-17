import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Zap,
  DollarSign,
  TrendingDown,
  Layers,
  Users,
} from 'lucide-react';
import { ComprehensiveReportData } from '../../types';
import { Card } from '../../components/common/Card';
import { energyApi } from '../../services/tauriBridge';
import { formatCurrency, formatKwh, getMonthName } from '../../utils/formatters';

export const RelatoriosPage: React.FC = () => {
  const [report, setReport] = useState<ComprehensiveReportData | null>(null);
  const [reportType, setReportType] = useState<'mensal' | 'aparelhos' | 'comodos' | 'usuarios' | 'economia'>('mensal');

  useEffect(() => {
    energyApi.getComprehensiveReport().then(setReport).catch(console.error);
  }, []);

  const handleExportCSV = () => {
    if (!report) return;

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'mensal') {
      csvContent += 'Ano;Mes;Consumo_kWh;Valor_Reais;Tarifa_Bandeira;Distribuidora\n';
      report.bills.forEach((b) => {
        csvContent += `${b.year};${b.month};${b.kwh_total};${((b.total_cents ?? 0) / 100).toFixed(2)};${b.tariff_flag};${b.distributor}\n`;
      });
    } else if (reportType === 'aparelhos') {
      csvContent += 'Aparelho;Categoria;Potencia_Watts;Horas_Dia;Dias_Mes;Consumo_Mensal_kWh;Custo_Mensal_Reais;Porcentagem_Casa\n';
      report.devices.forEach((d) => {
        csvContent += `${d.device.name};${d.device.category};${d.device.power_watts};${d.device.hours_per_day};${d.device.days_per_month};${d.monthly_kwh};${((d.monthly_cost_cents ?? 0) / 100).toFixed(2)};${d.percentage_of_total}%\n`;
      });
    } else if (reportType === 'comodos') {
      csvContent += 'Comodo;Quantidade_Aparelhos;Consumo_Mensal_kWh;Custo_Mensal_Reais;Porcentagem_Casa\n';
      report.rooms.forEach((r) => {
        csvContent += `${r.room.name};${r.device_count};${r.estimated_monthly_kwh};${((r.estimated_monthly_cents ?? 0) / 100).toFixed(2)};${r.percentage_of_home}%\n`;
      });
    } else if (reportType === 'usuarios') {
      csvContent += 'Usuario;Aparelhos_Atribuidos;Consumo_Mensal_kWh;Custo_Mensal_Reais;Porcentagem_Casa\n';
      report.users.forEach((u) => {
        csvContent += `${u.user.name};${u.device_count};${u.estimated_monthly_kwh};${((u.estimated_monthly_cents ?? 0) / 100).toFixed(2)};${u.percentage_of_home}%\n`;
      });
    } else if (reportType === 'economia') {
      csvContent += 'Plano;Status;Economia_Mensal_kWh;Economia_Mensal_Reais;Economia_Anual_Reais\n';
      report.plans.forEach((p) => {
        csvContent += `${p.name};${p.is_active ? 'Ativo' : 'Pausado'};${p.total_saved_kwh_month};${((p.total_saved_cents_month ?? 0) / 100).toFixed(2)};${((p.total_saved_cents_year ?? 0) / 100).toFixed(2)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_energia_${reportType}_videira.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando dados dos relatórios...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Relatórios e Auditoria de Energia
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Consolidação de dados para conferência e exportação em CSV
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} /> Imprimir / PDF
          </button>
          <button onClick={handleExportCSV} className="btn btn-primary">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Seletor de Tipo de Relatório */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'mensal', label: 'Histórico Mensal', icon: Calendar },
          { id: 'aparelhos', label: 'Por Aparelho', icon: Zap },
          { id: 'comodos', label: 'Por Cômodo', icon: Layers },
          { id: 'usuarios', label: 'Por Morador', icon: Users },
          { id: 'economia', label: 'Planos de Economia', icon: TrendingDown },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setReportType(item.id as any)}
            className={`btn btn-sm ${reportType === item.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <item.icon size={15} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Conteúdo do Relatório */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              {reportType === 'mensal' && 'Relatório do Histórico Mensal de Faturas'}
              {reportType === 'aparelhos' && 'Relatório de Consumo por Equipamento Cadastrado'}
              {reportType === 'comodos' && 'Relatório de Distribuição de Energia por Cômodo'}
              {reportType === 'usuarios' && 'Relatório de Consumo Atribuído por Morador'}
              {reportType === 'economia' && 'Relatório de Ações e Metas de Economia'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {report.settings.household_name} • Videira, Santa Catarina • Tarifa base:{' '}
              {formatCurrency(report.settings.default_kwh_rate_cents)}/kWh
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div style={{ overflowX: 'auto' }}>
          {reportType === 'mensal' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Período</th>
                  <th style={{ padding: '10px' }}>Consumo</th>
                  <th style={{ padding: '10px' }}>Valor Pago</th>
                  <th style={{ padding: '10px' }}>Tarifa Média</th>
                  <th style={{ padding: '10px' }}>Bandeira</th>
                  <th style={{ padding: '10px' }}>Distribuidora</th>
                </tr>
              </thead>
              <tbody>
                {report.bills.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{getMonthName(b.month)} / {b.year}</td>
                    <td style={{ padding: '10px' }}>{formatKwh(b.kwh_total)}</td>
                    <td style={{ padding: '10px', color: 'var(--color-accent-mint)', fontWeight: 600 }}>{formatCurrency(b.total_cents)}</td>
                    <td style={{ padding: '10px' }}>{formatCurrency(b.total_cents / b.kwh_total)}/kWh</td>
                    <td style={{ padding: '10px' }}><span className="badge badge-neutral">{b.tariff_flag}</span></td>
                    <td style={{ padding: '10px' }}>{b.distributor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'aparelhos' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Equipamento</th>
                  <th style={{ padding: '10px' }}>Categoria</th>
                  <th style={{ padding: '10px' }}>Potência</th>
                  <th style={{ padding: '10px' }}>Uso Diário</th>
                  <th style={{ padding: '10px' }}>Consumo/Mês</th>
                  <th style={{ padding: '10px' }}>Custo/Mês</th>
                  <th style={{ padding: '10px' }}>% da Casa</th>
                </tr>
              </thead>
              <tbody>
                {report.devices.map((d) => (
                  <tr key={d.device.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{d.device.name}</td>
                    <td style={{ padding: '10px' }}>{d.device.category}</td>
                    <td style={{ padding: '10px' }}>{d.device.power_watts} W</td>
                    <td style={{ padding: '10px' }}>{d.device.hours_per_day} h/dia</td>
                    <td style={{ padding: '10px' }}>{formatKwh(d.monthly_kwh)}</td>
                    <td style={{ padding: '10px', color: 'var(--color-accent-mint)', fontWeight: 600 }}>{formatCurrency(d.monthly_cost_cents)}</td>
                    <td style={{ padding: '10px' }}>{d.percentage_of_total}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'comodos' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Ambiente</th>
                  <th style={{ padding: '10px' }}>Aparelhos</th>
                  <th style={{ padding: '10px' }}>Consumo Estimado</th>
                  <th style={{ padding: '10px' }}>Custo Estimado</th>
                  <th style={{ padding: '10px' }}>Porcentagem da Casa</th>
                </tr>
              </thead>
              <tbody>
                {report.rooms.map((r) => (
                  <tr key={r.room.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{r.room.name}</td>
                    <td style={{ padding: '10px' }}>{r.device_count} aparelhos</td>
                    <td style={{ padding: '10px' }}>{formatKwh(r.estimated_monthly_kwh)}</td>
                    <td style={{ padding: '10px', color: 'var(--color-accent-mint)', fontWeight: 600 }}>{formatCurrency(r.estimated_monthly_cents)}</td>
                    <td style={{ padding: '10px' }}>{r.percentage_of_home}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'usuarios' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Morador</th>
                  <th style={{ padding: '10px' }}>Aparelhos Atribuídos</th>
                  <th style={{ padding: '10px' }}>Consumo Estimado</th>
                  <th style={{ padding: '10px' }}>Custo Estimado</th>
                  <th style={{ padding: '10px' }}>Porcentagem da Casa</th>
                </tr>
              </thead>
              <tbody>
                {report.users.map((u) => (
                  <tr key={u.user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{u.user.name}</td>
                    <td style={{ padding: '10px' }}>{u.device_count} aparelhos</td>
                    <td style={{ padding: '10px' }}>{formatKwh(u.estimated_monthly_kwh)}</td>
                    <td style={{ padding: '10px', color: 'var(--color-accent-mint)', fontWeight: 600 }}>{formatCurrency(u.estimated_monthly_cents)}</td>
                    <td style={{ padding: '10px' }}>{u.percentage_of_home}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'economia' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Plano de Economia</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Ações</th>
                  <th style={{ padding: '10px' }}>Economia/Mês (kWh)</th>
                  <th style={{ padding: '10px' }}>Economia/Mês (R$)</th>
                  <th style={{ padding: '10px' }}>Economia Projetada/Ano</th>
                </tr>
              </thead>
              <tbody>
                {report.plans.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge ${p.is_active ? 'badge-savings' : 'badge-neutral'}`}>
                        {p.is_active ? 'Ativo' : 'Pausado'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{p.actions.length} recomendações</td>
                    <td style={{ padding: '10px', color: 'var(--color-savings)', fontWeight: 600 }}>{formatKwh(p.total_saved_kwh_month)}</td>
                    <td style={{ padding: '10px', color: 'var(--color-savings)', fontWeight: 600 }}>{formatCurrency(p.total_saved_cents_month)}</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--color-accent-mint)' }}>{formatCurrency(p.total_saved_cents_year)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
