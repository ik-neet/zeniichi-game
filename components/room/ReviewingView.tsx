'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Answer } from '@/types/game'

interface ReviewingViewProps {
  question: string
  roundNumber: number
  answers: Answer[]
  isParent: boolean
  onJudge: (result: 'match' | 'no_match') => Promise<void>
}

export function ReviewingView({
  question,
  roundNumber,
  answers,
  isParent,
  onJudge,
}: ReviewingViewProps) {
  const [judging, setJudging] = useState(false)

  const handleJudge = async (result: 'match' | 'no_match') => {
    setJudging(true)
    try {
      await onJudge(result)
    } finally {
      setJudging(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        <div className="text-center space-y-1">
          <Badge variant="outline">ラウンド {roundNumber}</Badge>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">みんなの回答</h2>
        </div>

        {/* 質問 */}
        <Card className="border-2 border-slate-300 dark:border-slate-600">
          <CardContent className="pt-4">
            <p className="text-center text-lg font-semibold text-slate-800 dark:text-slate-200">
              {question}
            </p>
          </CardContent>
        </Card>

        {/* 回答一覧 */}
        <div className="space-y-2">
          {answers.map((answer) => (
            <Card key={answer.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-slate-400 shrink-0 pt-0.5">{answer.player_nickname}</span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 text-right">
                    {answer.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 判定ボタン (親のみ) */}
        {isParent && (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-center text-slate-500 font-medium">
              全員一致していますか？
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleJudge('match')}
                disabled={judging}
                className="h-14 text-base font-bold bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
              >
                🎉 全員一致！
              </Button>
              <Button
                onClick={() => handleJudge('no_match')}
                disabled={judging}
                variant="outline"
                className="h-14 text-base font-bold"
              >
                😔 不一致
              </Button>
            </div>
          </div>
        )}

        {!isParent && (
          <p className="text-sm text-center text-slate-500 py-2">
            親が判定します...
          </p>
        )}
      </div>
    </main>
  )
}
