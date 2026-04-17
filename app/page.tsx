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

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          host_session_id: sessionId,
          settings: {
            parentMode: 'host',
            fixedParentNickname: null,
            parentCanAnswer: true,
          },
          status: 'waiting',
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            🎯 全員一致！
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            みんなの答えをひとつにまとめよう
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-4">
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 text-left">
            <p>🎮 <span className="font-medium">部屋を作って</span>友達を招待</p>
            <p>❓ <span className="font-medium">お題に</span>みんなで答える</p>
            <p>🏆 <span className="font-medium">全員一致</span>でポイントゲット！</p>
          </div>

          <Button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {loading ? '作成中...' : '部屋を作る'}
          </Button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          ログイン不要・ニックネームだけで遊べます
        </p>
      </div>
    </main>
  )
}
