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
    <main className={`min-h-screen p-4 transition-colors duration-500 ${
      isMatch
        ? 'bg-gradient-to-br from-emerald-50 via-white to-green-50'
        : 'bg-gradient-to-br from-rose-50 via-white to-orange-50'
    }`}>
      <div className="max-w-md mx-auto space-y-4 pt-8">
        {/* 結果表示 */}
        <div className="text-center space-y-3 py-4">
          <div className={`text-7xl ${isMatch ? 'animate-bounce' : ''}`}>
            {isMatch ? '🎉' : '😔'}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase">
              ラウンド {roundNumber}
            </p>
            <h2
              className={`text-3xl font-black mt-1 ${
                isMatch
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent'
                  : 'text-slate-500'
              }`}
            >
              {isMatch ? '全員一致！' : '不一致...'}
            </h2>
            {isMatch && (
              <p className="text-sm text-emerald-600 mt-1 font-bold">
                🏆 全員 +1pt 獲得！
              </p>
            )}
          </div>
        </div>

        {/* スコアボード */}
        <Card className={`shadow-md ${
          isMatch ? 'border-emerald-200 shadow-emerald-100' : 'border-rose-200 shadow-rose-100'
        }`}>
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
            className="btn-animated w-full h-12 text-base font-bold bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white border-0"
          >
            {loading ? '処理中...' : '次のラウンドへ →'}
          </Button>
        )}

        {!isParent && !isHost && (
          <p className="text-sm text-center text-slate-400 py-2">
            次のラウンドを待っています...
          </p>
        )}
      </div>
    </main>
  )
}
