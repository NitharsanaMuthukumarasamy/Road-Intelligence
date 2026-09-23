import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#0284c7', '#dc2626', '#ea580c', '#eab308', '#10b981', '#6366f1'];

export function DefectTypeChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-xs">No defect classifications recorded.</div>;
  }
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
          />
          <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Defect Count">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SeverityDistributionChart({ data = [] }) {
  const sevColors = {
    Critical: '#dc2626',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#10b981',
  };

  const chartData = data.map((d) => ({
    name: d.severity,
    value: d.count,
    color: sevColors[d.severity] || '#64748b',
  }));

  if (!chartData || chartData.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-xs">No severity metrics available.</div>;
  }

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`pie-cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskTimelineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-xs">No chronological inspection records yet.</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
          />
          <Legend verticalAlign="top" height={36} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="avg_risk"
            name="Avg Risk Score"
            stroke="#ea580c"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="defects"
            name="Defects Detected"
            stroke="#0284c7"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
