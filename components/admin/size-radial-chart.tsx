'use client'

import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { type ChartConfig, ChartContainer } from '@/components/ui/recharts-chart'
import { MonoTooltip } from './chart-tooltip'

interface SizeRadialChartProps {
  data: { bucket: string; count: number }[]
}

// Ordered smallest -> largest so the ramp reads as "getting bigger".
const SLICE_COLORS = ['#4ADE80', '#34D399', '#22D3EE', '#F59E0B']

const chartConfig = {
  count: { label: 'Pastes' },
} satisfies ChartConfig

export function SizeRadialChart({ data }: SizeRadialChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-[var(--text-muted)]">{'[▤] Size distribution'}</span>
        <span className="font-mono text-3xl tracking-tighter">{total}</span>
      </div>
      <hr className="my-4 border-t border-dashed border-[var(--border)]" />

      <ChartContainer config={chartConfig} className="aspect-square max-h-[200px]">
        <PieChart>
          <Tooltip content={<MonoTooltip unit="pastes" />} />
          <Pie data={data} dataKey="count" nameKey="bucket" innerRadius="55%" outerRadius="85%" strokeWidth={0}>
            {data.map((d, i) => (
              <Cell key={d.bucket} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="mt-3 space-y-1">
        {data.map((d, i) => (
          <li key={d.bucket} className="flex items-center gap-2 font-mono text-xs">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
            />
            <span className="text-[var(--text-muted)]">{d.bucket}</span>
            <span className="ml-auto tabular-nums">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
