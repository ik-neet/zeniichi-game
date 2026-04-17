'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PresetQuestion } from '@/types/game'

interface QuestioningViewProps {
  isParent: boolean
  parentNickname: string
  roundNumber: number
  presetQuestions: PresetQuestion[]
  onSubmitQuestion: (question: string) => Promise<void>
}

export function QuestioningView({
  isParent,
  parentNickname,
  roundNumber,
  presetQuestions,
  onSubmitQuestion,
}: QuestioningViewProps) {
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [usePreset, setUsePreset] = useState(false)

  const handleSubmit = async (q: string) => {
    if (!q.trim()) return
    setSubmitting(true)
    try {
      await onSubmitQuestion(q.trim())
    } finally {
      setSubmitting(false)
    }
  }

  if (!isParent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl animate-pulse">🤔</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            ラウンド {roundNumber}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            <span className="font-semibold">{parentNickname}</span>さんがお題を考えています...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        <div className="text-center space-y-1">
          <Badge className="bg-amber-500 hover:bg-amber-500">ラウンド {roundNumber} - あなたが親</Badge>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">お題を出しましょう</h2>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUsePreset(false)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              !usePreset
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            自分で入力
          </button>
          <button
            type="button"
            onClick={() => setUsePreset(true)}
            className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
              usePreset
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            プリセットから選ぶ
          </button>
        </div>

        {!usePreset ? (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Textarea
                placeholder="例: 好きな食べ物は？"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none"
                rows={3}
                autoFocus
              />
              <Button
                onClick={() => handleSubmit(question)}
                disabled={!question.trim() || submitting}
                className="w-full"
              >
                {submitting ? '出題中...' : '出題する'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">プリセット質問</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {presetQuestions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  プリセット質問がありません
                </p>
              ) : (
                presetQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSubmit(q.text)}
                    disabled={submitting}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors"
                  >
                    {q.text}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
