import { nanoid } from 'nanoid'

export function generatePasteId(): string {
  return nanoid(12)
}
