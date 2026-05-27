import { createAdminClient } from '@/lib/supabase/server'

const BUCKET = 'vouchers'

export async function getSignedVoucherUrl(filePath: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600)

  if (error || !data) return null
  return data.signedUrl
}

export function voucherStoragePath(userId: string, orderId: string, ext: string): string {
  return `${userId}/${orderId}.${ext}`
}
