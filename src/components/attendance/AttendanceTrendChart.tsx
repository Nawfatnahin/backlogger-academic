'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, parseISO, startOfWeek } from 'date-fns';

interface AttendanceTrendChartProps {
  records: any[];
  threshold: number;
  target?: number | null;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  records,
  threshold,
  target,
}) => {
  const data = React.useMemo(() => {
    const weeklyData: Record<string, { total: number; present: number }> = {};

    records.forEach(r => {
      if (r.absence_type === 'cancelled') return;
      const weekStart = format(startOfWeek(parseISO(r.class_date)), 'MMM dd');
      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { total: 0, present: 0 };
      }
      weeklyData[weekStart].total++;
      if (r.absence_type === 'present') {
        weeklyData[weekStart].present++;
      }
    });

    return Object.entries(weeklyData)
      .map(([week, stats]) => ({
        week,
        percentage: (stats.present / stats.total) * 100
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }, [records]);

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center px-10">
          Attend at least 2 weeks of classes to see your trend, Sir.
        </p>
      </div>
    );
  }

  const isTrendingUp = data[data.length - 1].percentage >= data[data.length - 2].percentage;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.1} />
          <XAxis 
            dataKey="week" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
            dy={10}
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              border: 'none', 
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#fff'
            }}
            itemStyle={{ color: '#22d3ee' }}
          />
          <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Req', position: 'insideLeft', fill: '#ef4444', fontSize: 10 }} />
          {target && (
            <ReferenceLine y={target} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Target', position: 'insideRight', fill: '#f59e0b', fontSize: 10 }} />
          )}
          <Line 
            type="monotone" 
            dataKey="percentage" 
            stroke={isTrendingUp ? '#10b981' : '#f43f5e'} 
            strokeWidth={4} 
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
