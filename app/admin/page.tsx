'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getSupabaseClient } from '@/lib/supabase'
import type { PresetQuestion } from '@/types/game'

export default function AdminPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<PresetQuestion[]>([])
  const [bulkInput, setBulkInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ added: number; errors: string[] } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
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

  const allSelected = questions.length > 0 && selectedIds.size === questions.length
  const someSelected = selectedIds.size > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected || someSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveResult(null)
    try {
      const lines = bulkInput
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      const records: { text: string; category: string }[] = []
      const errors: string[] = []

      for (const line of lines) {
        const commaIdx = line.indexOf(',')
        if (commaIdx === -1) {
          errors.push(`カンマなし: "${line}"`)
          continue
        }
        const text = line.slice(0, commaIdx).trim()
        const category = line.slice(commaIdx + 1).trim()
        if (!text) {
          errors.push(`質問文が空: "${line}"`)
          continue
        }
        records.push({ text, category: category || 'general' })
      }

      if (records.length > 0) {
        const supabase = getSupabaseClient()
        await supabase.from('preset_questions').insert(records)
        setBulkInput('')
        await fetchQuestions()
      }

      setSaveResult({ added: records.length, errors })
    } finally {
      setSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.from('preset_questions').delete().in('id', [...selectedIds])
      setSelectedIds(new Set())
      await fetchQuestions()
    } finally {
      setBulkDeleting(false)
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
            <CardTitle className="text-sm font-medium text-violet-500">質問を一括追加</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="bulk" className="text-violet-700 font-medium">
                  質問文,ジャンル（1行1質問）
                </Label>
                <p className="text-xs text-violet-400">例: 好きな食べ物は？,food</p>
                <Textarea
                  id="bulk"
                  placeholder={"好きな食べ物は？,food\n休日の過ごし方は？,lifestyle\n苦手なものは？,preference"}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  rows={6}
                  className="border-violet-200 focus:border-violet-400 focus:ring-violet-200 font-mono text-sm"
                />
              </div>
              {saveResult && (
                <div className="text-sm space-y-1">
                  {saveResult.added > 0 && (
                    <p className="text-emerald-600">{saveResult.added}件追加しました</p>
                  )}
                  {saveResult.errors.map((err, i) => (
                    <p key={i} className="text-red-500">{err}</p>
                  ))}
                </div>
              )}
              <Button
                type="submit"
                disabled={!bulkInput.trim() || saving}
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-violet-500">
                質問一覧 ({questions.length}件)
              </CardTitle>
              {selectedIds.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 font-medium"
                >
                  {bulkDeleting ? '削除中...' : `${selectedIds.size}件を削除`}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-violet-300 text-center py-4">読み込み中...</p>
            ) : questions.length === 0 ? (
              <p className="text-sm text-violet-300 text-center py-4">質問がありません</p>
            ) : (
              <div className="space-y-2">
                {/* 全選択行 */}
                <div className="flex items-center gap-3 px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-violet-300 accent-violet-500 cursor-pointer"
                  />
                  <span className="text-xs text-violet-400">
                    {allSelected ? '全選択解除' : someSelected ? `${selectedIds.size}件選択中` : '全選択'}
                  </span>
                </div>

                {questions.map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border bg-white transition-colors cursor-pointer ${
                      selectedIds.has(q.id)
                        ? 'border-violet-300 bg-violet-50'
                        : 'border-violet-100 hover:border-violet-200'
                    }`}
                    onClick={() => toggleOne(q.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleOne(q.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-violet-300 accent-violet-500 cursor-pointer shrink-0"
                      />
                      <Badge className="text-xs shrink-0 bg-violet-100 text-violet-600 border-violet-200 hover:bg-violet-100">
                        {q.category}
                      </Badge>
                      <span className="text-sm text-slate-700 truncate">
                        {q.text}
                      </span>
                    </div>
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
