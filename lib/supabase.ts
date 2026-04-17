import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ブラウザ側で使用するシングルトンクライアント
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createClient<any>> | null = null

export function getSupabaseClient() {
  if (!client) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client = createClient<any>(supabaseUrl, supabaseAnonKey)
  }
  return client
}
