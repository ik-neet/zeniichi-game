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
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        <div className="text-center space-y-1">
          <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0 font-bold px-3 py-1">
            ラウンド {roundNumber}
          </Badge>
          <h2 className="text-xl font-black text-slate-800 mt-2">📋 みんなの回答</h2>
        </div>

        {/* 質問 */}
        <Card className="border-2 border-cyan-300 shadow-md shadow-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50">
          <CardContent className="pt-4">
            <p className="text-center text-lg font-bold text-slate-800">
              {question}
            </p>
          </CardContent>
        </Card>

        {/* 回答一覧 */}
        <div className="space-y-2">
          {answers.map((answer, i) => {
            const colors = [
              'border-l-violet-400 bg-violet-50',
              'border-l-cyan-400 bg-cyan-50',
              'border-l-pink-400 bg-pink-50',
              'border-l-amber-400 bg-amber-50',
              'border-l-green-400 bg-green-50',
            ]
            const colorClass = colors[i % colors.length]

            let drawing: string | null = null
            let text: string | null = null
            try {
              const parsed = JSON.parse(answer.content)
              drawing = parsed.drawing ?? null
              text = parsed.text || null
            } catch {
              text = answer.content
            }

            return (
              <Card key={answer.id} className={`border-l-4 ${colorClass} border-t-0 border-r-0 border-b-0`}>
                <CardContent className="pt-3 pb-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 block">{answer.player_nickname}</span>
                  {drawing && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={drawing} alt={answer.player_nickname} className="w-full rounded" style={{ backgroundColor: '#1e3a5f' }} />
                  )}
                  {text && (
                    <p className="text-sm font-bold text-slate-800">{text}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
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
                className="btn-animated h-14 text-base font-black bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 hover:shadow-lg hover:shadow-green-200 text-white border-0"
              >
                🎉 全員一致！
              </Button>
              <Button
                onClick={() => handleJudge('no_match')}
                disabled={judging}
                className="btn-animated h-14 text-base font-black bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600 hover:shadow-lg hover:shadow-red-200 text-white border-0"
              >
                😔 不一致
              </Button>
            </div>
          </div>
        )}

        {!isParent && (
          <p className="text-sm text-center text-slate-400 py-2">
            親が判定します...
          </p>
        )}
      </div>
    </main>
  )
}
