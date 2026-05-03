import type { LucideIcon } from 'lucide-react';

interface Props {
  label:    string;
  value:    string | number;
  sub?:     string;
  color?:   string;
  Icon?:    LucideIcon;
  trend?:   { valor: number; label: string };
}

export default function StatCard({ label, value, sub, color = '#6366f1', Icon, trend }: Props) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '20px 24px',
      borderLeft: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </p>
        {Icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: color + '15',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={color}/>
          </div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#1e293b', lineHeight: 1.1 }}>
        {value}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {sub && <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{sub}</p>}
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: trend.valor >= 0 ? '#10b981' : '#ef4444',
          }}>
            {trend.valor >= 0 ? '↑' : '↓'} {Math.abs(trend.valor)}% {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
