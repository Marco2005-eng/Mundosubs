import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'No disponible' }, { status: 404 })
}
