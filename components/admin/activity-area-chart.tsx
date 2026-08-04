'use client'

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer } from '@/components/ui/recharts-chart'
import { MonoTooltip } from './chart-tooltip'

interface ActivityAreaChartProps {
  data: { day: string; count: number }[]
}

const chartConfig = {
  count: {
    label: 'Pastes',
    colors: {
      light: ['#22C55E'],
      dark: ['#4ADE80'],
    },
  },
} satisfies ChartConfig

export function ActivityAreaChart({ data }: ActivityAreaChartProps) {
  const peak = data.reduce((max, d) => (d.count > max.count ? d : max), { day: '—', count: 0 })

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">{'[~] Active days'}</span>
            <span className="font-mono text-3xl tracking-tighter">{data.length}</span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed border-[var(--border)]" />
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">{'[⬆] Busiest day'}</span>
            <span className="font-mono text-3xl tracking-tighter">{peak.count}</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">{peak.day}</span>
          </div>
        </div>
        <div className="hidden flex-col justify-end gap-1 sm:flex">
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {'// X-AXIS: '}
            <span className="text-primary">DATE</span>
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {'// Y-AXIS: '}
            <span className="text-primary">PASTES</span>
          </span>
        </div>
      </div>
      <hr className="my-4 border-t border-dashed border-[var(--border)]" />
      <ChartContainer config={chartConfig}>
        <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="fill-activity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-count-0)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-count-0)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(value: string) => value.slice(5)}
          />
          <YAxis tickLine={false} axisLine={false} width={24} allowDecimals={false} />
          <Tooltip content={<MonoTooltip unit="pastes" />} cursor={{ strokeDasharray: '3 3' }} />
          <Area
            dataKey="count"
            type="monotone"
            stroke="var(--color-count-0)"
            strokeWidth={2}
            fill="url(#fill-activity)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
