import { NextResponse } from 'next/server'
import { getPaymentMethods } from '@/lib/payment-methods'

export async function GET() {
  const methods = await getPaymentMethods({ enabledOnly: true })
  return NextResponse.json({ methods })
}
