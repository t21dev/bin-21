'use client'

import { Bar, BarChart, Rectangle, XAxis } from 'recharts'
import { AnimatePresence, motion } from 'motion/react'
import { type ChartConfig, ChartContainer } from '@/components/ui/recharts-chart'

interface LanguageBarChartProps {
  data: { language: string; count: number }[]
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

export function LanguageBarChart({ data }: LanguageBarChartProps) {
  const top = data[0]

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">{'[#] Languages used'}</span>
            <span className="font-mono text-3xl tracking-tighter">{data.length}</span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed border-[var(--border)]" />
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">{'[⬆] Most used'}</span>
            <span className="font-mono text-3xl tracking-tighter">{top?.language ?? '—'}</span>
          </div>
        </div>
        <div className="hidden flex-col justify-end gap-1 sm:flex">
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {'// X-AXIS: '}
            <span className="text-primary">LANGUAGE</span>
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {'// Y-AXIS: '}
            <span className="text-primary">PASTES</span>
          </span>
        </div>
      </div>
      <hr className="my-4 border-t border-dashed border-[var(--border)]" />
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={data}>
          <XAxis
            dataKey="language"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value: string) => value.slice(0, 4)}
          />
          <Bar dataKey="count" fill="var(--color-count-0)" shape={BarShape} activeBar={BarShape} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

interface BarProps {
  index?: number
  value?: number | [number, number]
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  isActive?: boolean
}

// Collapsed bars read as tick marks; hovering expands the one under the cursor.
const COLLAPSED_SCALE = 0.1

function BarShape(props: BarProps) {
  const { fill, x, y, width, height, index, value, isActive } = props

  const xPos = Number(x || 0)
  const yPos = Number(y || 0)
  const realWidth = Number(width || 0)
  const realHeight = Number(height || 0)

  const centerX = xPos + realWidth / 2
  const centerY = yPos + realHeight / 2

  return (
    <>
      <Rectangle {...props} fill="transparent" />

      <AnimatePresence>
        <motion.rect
          key={`bar-${index}`}
          x={xPos}
          y={yPos}
          width={realWidth}
          height={realHeight}
          fill={fill}
          initial={{ scaleX: isActive ? COLLAPSED_SCALE : 1 }}
          animate={{ scaleX: isActive ? 1 : COLLAPSED_SCALE }}
          exit={{ scaleX: COLLAPSED_SCALE }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          style={{
            transformOrigin: `${centerX}px ${centerY}px`,
            transformBox: 'fill-box',
          }}
        />
      </AnimatePresence>
      {isActive && (
        <AnimatePresence>
          <motion.text
            className="font-mono"
            key={`text-${index}`}
            initial={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.2 }}
            x={centerX}
            y={yPos - 5}
            textAnchor="middle"
            fill={fill}
            style={{ pointerEvents: 'none' }}
          >
            {value}
          </motion.text>
        </AnimatePresence>
      )}
    </>
  )
}
