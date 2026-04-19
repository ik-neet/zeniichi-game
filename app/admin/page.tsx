'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSupabaseClient } from '@/lib/supabase'
import type { PresetQuestion } from '@/types/game'

export default function AdminPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<PresetQuestion[]>([])
  const [newText, setNewText] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const fetchQuestions = async () => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('preset_questions')
      .select('*')
      .order('created_at')
    setQuestions(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchQuestions() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newText.trim()) return
    setSaving(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.from('preset_questions').insert({
        text: newText.trim(),
        category: newCategory.trim() || 'general',
      })
      setNewText('')
      setNewCategory('')
      await fetchQuestions()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const supabase = getSupabaseClient()
      await supabase.from('preset_questions').delete().eq('id', id)
      await fetchQuestions()
    } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
              管理者画面
            </h1>
            <p className="text-sm text-violet-400 mt-1">プリセット質問の管理</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="border-violet-300 text-violet-600 hover:bg-violet-50 hover:border-violet-400"
          >
            {loggingOut ? 'ログアウト中...' : 'ログアウト'}
          </Button>
        </div>

        {/* 質問追加フォーム */}
        <Card className="border-violet-200 shadow-sm shadow-violet-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-500">質問を追加</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="text" className="text-violet-700 font-medium">質問文</Label>
                <Input
                  id="text"
                  placeholder="例: 好きな食べ物は？"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="border-violet-200 focus:border-violet-400 focus:ring-violet-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-violet-700 font-medium">カテゴリ（省略可）</Label>
                <Input
                  id="category"
                  placeholder="例: food, lifestyle, preference"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="border-violet-200 focus:border-violet-400 focus:ring-violet-200"
                />
              </div>
              <Button
                type="submit"
                disabled={!newText.trim() || saving}
                className="btn-animated bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white font-bold border-0"
              >
                {saving ? '追加中...' : '追加する'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 質問一覧 */}
        <Card className="border-violet-200 shadow-sm shadow-violet-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-500">
              質問一覧 ({questions.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-violet-300 text-center py-4">読み込み中...</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-violet-300 text-center py-4">質問がありません</p>
            ) : (
              <div className="space-y-2">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-violet-100 bg-white"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className="text-xs shrink-0 bg-violet-100 text-violet-600 border-violet-200 hover:bg-violet-100">
                        {q.category}
                      </Badge>
                      <span className="text-sm text-slate-700 truncate">
                        {q.text}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(q.id)}
                      disabled={deletingId === q.id}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      {deletingId === q.id ? '削除中...' : '削除'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
