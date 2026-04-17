'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Player } from '@/types/game'

interface AnsweringViewProps {
  question: string
  roundNumber: number
  isParent: boolean
  parentCanAnswer: boolean
  parentNickname: string
  players: Player[]
  answeredSessionIds: string[]
  currentSessionId: string
  hasAnswered: boolean
  onSubmitAnswer: (content: string) => Promise<void>
  onEndAnswering: () => Promise<void>
}

export function AnsweringView({
  question,
  roundNumber,
  isParent,
  parentCanAnswer,
  parentNickname,
  players,
  answeredSessionIds,
  currentSessionId,
  hasAnswered,
  onSubmitAnswer,
  onEndAnswering,
}: AnsweringViewProps) {
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ending, setEnding] = useState(false)

  const canAnswer = !isParent || parentCanAnswer
  const answerCount = answeredSessionIds.length

  const handleSubmit = async () => {
    if (!answer.trim()) return
    setSubmitting(true)
    try {
      await onSubmitAnswer(answer.trim())
      setAnswer('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEndAnswering = async () => {
    setEnding(true)
    try {
      await onEndAnswering()
    } finally {
      setEnding(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        <div className="text-center space-y-1">
          <Badge variant="outline">ラウンド {roundNumber}</Badge>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">回答タイム</h2>
        </div>

        {/* 質問 */}
        <Card className="border-2 border-slate-300 dark:border-slate-600">
          <CardContent className="pt-4">
            <p className="text-center text-lg font-semibold text-slate-800 dark:text-slate-200">
              {question}
            </p>
          </CardContent>
        </Card>

        {/* 回答状況 */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>回答済み: {answerCount}人</span>
          <span>合計: {parentCanAnswer ? players.length : players.length - 1}人</span>
        </div>

        {/* 回答フォーム */}
        {canAnswer && !hasAnswered && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Textarea
                placeholder="回答を入力してください..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="resize-none"
                rows={3}
                autoFocus
              />
              <Button
                onClick={handleSubmit}
                disabled={!answer.trim() || submitting}
                className="w-full"
              >
                {submitting ? '送信中...' : '回答する'}
              </Button>
            </CardContent>
          </Card>
        )}

        {canAnswer && hasAnswered && (
          <div className="text-center py-6 space-y-2">
            <div className="text-4xl">✅</div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">回答済み</p>
            <p className="text-sm text-slate-400">他のプレイヤーの回答を待っています...</p>
          </div>
        )}

        {isParent && !parentCanAnswer && (
          <div className="text-center py-4 space-y-1">
            <p className="text-sm text-slate-500">
              あなたは今回の回答権がありません
            </p>
          </div>
        )}

        {/* 回答終了ボタン (親のみ) */}
        {isParent && (
          <Button
            onClick={handleEndAnswering}
            disabled={ending || answerCount === 0}
            variant="outline"
            className="w-full"
          >
            {ending ? '処理中...' : '回答終了（結果を見る）'}
          </Button>
        )}

        {!isParent && (
          <p className="text-xs text-center text-slate-400">
            {parentNickname}さんが回答終了ボタンを押すと結果が表示されます
          </p>
        )}
      </div>
    </main>
  )
}
