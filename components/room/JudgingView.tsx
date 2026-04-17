'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PlayerList } from './PlayerList'
import type { Player, RoundResult } from '@/types/game'

interface JudgingViewProps {
  roundNumber: number
  result: RoundResult
  players: Player[]
  currentSessionId: string
  parentSessionId: string
  isParent: boolean
  isHost: boolean
  onNextRound: () => Promise<void>
}

export function JudgingView({
  roundNumber,
  result,
  players,
  currentSessionId,
  parentSessionId,
  isParent,
  isHost,
  onNextRound,
}: JudgingViewProps) {
  const [loading, setLoading] = useState(false)
  const isMatch = result === 'match'

  const handleNextRound = async () => {
    setLoading(true)
    try {
      await onNextRound()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        {/* 結果表示 */}
        <div className="text-center space-y-3 py-4">
          <div className="text-7xl">{isMatch ? '🎉' : '😔'}</div>
          <div>
            <p className="text-xs text-slate-500">ラウンド {roundNumber}</p>
            <h2
              className={`text-3xl font-bold ${
                isMatch ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isMatch ? '全員一致！' : '不一致...'}
            </h2>
            {isMatch && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
                全員 +1pt 獲得！
              </p>
            )}
          </div>
        </div>

        {/* スコアボード */}
        <Card>
          <CardContent className="pt-4">
            <PlayerList
              players={[...players].sort((a, b) => b.score - a.score)}
              currentSessionId={currentSessionId}
              parentSessionId={parentSessionId}
            />
          </CardContent>
        </Card>

        {/* 次のラウンドへ (親 or ホストが操作) */}
        {(isParent || isHost) && (
          <Button
            onClick={handleNextRound}
            disabled={loading}
            className="w-full h-12 text-base font-semibold"
          >
            {loading ? '処理中...' : '次のラウンドへ →'}
          </Button>
        )}

        {!isParent && !isHost && (
          <p className="text-sm text-center text-slate-500 py-2">
            次のラウンドを待っています...
          </p>
        )}
      </div>
    </main>
  )
}
