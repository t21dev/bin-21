import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const absDiff = Math.abs(diff)
  const isPast = diff < 0

  const minutes = Math.floor(absDiff / 60000)
  const hours = Math.floor(absDiff / 3600000)
  const days = Math.floor(absDiff / 86400000)

  let text: string
  if (minutes < 1) text = 'just now'
  else if (minutes < 60) text = `${minutes}m`
  else if (hours < 24) text = `${hours}h`
  else text = `${days}d`

  if (text === 'just now') return text
  return isPast ? `${text} ago` : `in ${text}`
}
