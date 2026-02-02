import { NextResponse } from 'next/server'
import { getRawContent } from '@/server/services/paste.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params

  try {
    const content = await getRawContent(id)

    if (content === null) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      )
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
