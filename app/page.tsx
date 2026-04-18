'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getSupabaseClient } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreateRoom = async () => {
    setLoading(true)
    try {
      const sessionId = getOrCreateSessionId()
      const supabase = getSupabaseClient()

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          host_session_id: sessionId,
          settings: {
            hostAlwaysParent: true,
            parentSelectionMode: 'random',
            parentCanAnswer: true,
          },
          status: 'waiting',
          expires_at: expiresAt,
        })
        .select('id')
        .single()

      if (error) throw error
      router.push(`/room/${data.id}`)
    } catch (err) {
      console.error('部屋の作成に失敗しました:', err)
      alert('部屋の作成に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="space-y-3">
          <h1 className="text-5xl font-black bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
            🎯 全員一致ゲーム
          </h1>
          <p className="text-lg text-slate-500">
            みんなの答えをひとつにまとめよう
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-violet-100 p-8 space-y-4">
          <div className="space-y-2 text-sm text-slate-600 text-left">
            <p>🎮 <span className="font-medium">部屋を作って</span>友達を招待</p>
            <p>❓ <span className="font-medium">お題に</span>みんなで答える</p>
            <p>🏆 <span className="font-medium">全員一致</span>でポイントゲット！</p>
          </div>

          <Button
            onClick={handleCreateRoom}
            disabled={loading}
            className="btn-animated w-full h-12 text-base font-bold bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white border-0"
            size="lg"
          >
            {loading ? '作成中...' : '🚀 部屋を作る'}
          </Button>
        </div>

        <p className="text-xs text-slate-400">
          ログイン不要・ニックネームだけで遊べます
        </p>
      </div>
    </main>
  )
}
