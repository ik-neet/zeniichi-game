'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Answer } from '@/types/game'

const BORDER_COLORS = ['border-violet-400', 'border-cyan-400', 'border-pink-400', 'border-amber-400', 'border-green-400']
const BG_COLORS = ['bg-violet-50', 'bg-cyan-50', 'bg-pink-50', 'bg-amber-50', 'bg-green-50']

interface ReviewingViewProps {
  question: string
  roundNumber: number
  answers: Answer[]
  isParent: boolean
  onJudge: (result: 'match' | 'no_match') => Promise<void>
}

function parseAnswer(content: string): { drawing: string | null; text: string | null } {
  try {
    const parsed = JSON.parse(content)
    return { drawing: parsed.drawing ?? null, text: parsed.text || null }
  } catch {
    return { drawing: null, text: content }
  }
}

export function ReviewingView({ question, roundNumber, answers, isParent, onJudge }: ReviewingViewProps) {
  const [judging, setJudging] = useState(false)
  const [expandedAnswer, setExpandedAnswer] = useState<Answer | null>(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [portraitDismissed, setPortraitDismissed] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    setIsPortrait(mq.matches)
    const handler = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches)
      if (!e.matches) setPortraitDismissed(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleJudge = async (result: 'match' | 'no_match') => {
    setJudging(true)
    try {
      await onJudge(result)
    } finally {
      setJudging(false)
    }
  }

  const expandedParsed = expandedAnswer ? parseAnswer(expandedAnswer.content) : null
  const showPortraitOverlay = isPortrait && !portraitDismissed

  return (
    <>
      {/* 縦画面オーバーレイ */}
      {showPortraitOverlay && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="text-7xl animate-bounce">📱</div>
            <p className="text-2xl font-black text-white">横画面にしてください</p>
            <p className="text-slate-300 text-sm">横向きにすると回答が見やすくなります</p>
            <button
              type="button"
              onClick={() => setPortraitDismissed(true)}
              className="text-slate-400 text-xs underline mt-2"
            >
              このまま続ける
            </button>
          </div>
        </div>
      )}

      {/* 拡大表示モーダル */}
      {expandedAnswer && expandedParsed && (
        <div
          className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-6"
          onClick={() => setExpandedAnswer(null)}
        >
          <div className="max-w-2xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-lg">{expandedAnswer.player_nickname}</span>
              <button
                type="button"
                onClick={() => setExpandedAnswer(null)}
                className="text-white/60 hover:text-white text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            {expandedParsed.drawing && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={expandedParsed.drawing}
                alt={expandedAnswer.player_nickname}
                className="w-full rounded-xl"
                style={{ backgroundColor: '#1e3a5f' }}
              />
            )}
            {expandedParsed.text && (
              <p className="text-white text-lg font-bold">{expandedParsed.text}</p>
            )}
          </div>
        </div>
      )}

      {/* メイン画面（横画面レイアウト） */}
      <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto pt-4 space-y-4">
          {/* ヘッダー */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0 font-bold px-3 py-1 flex-shrink-0">
              ラウンド {roundNumber}
            </Badge>
            <h2 className="text-base font-black text-slate-800 flex-shrink-0">📋 みんなの回答</h2>
            <span className="text-sm font-bold text-slate-700 bg-white rounded-lg px-3 py-1 border border-cyan-200 shadow-sm">
              {question}
            </span>
          </div>

          {/* 2列グリッド */}
          <div className="grid grid-cols-2 gap-3">
            {answers.map((answer, i) => {
              const { drawing, text } = parseAnswer(answer.content)
              return (
                <button
                  key={answer.id}
                  type="button"
                  className={`rounded-xl border-2 ${BORDER_COLORS[i % BORDER_COLORS.length]} ${BG_COLORS[i % BG_COLORS.length]} p-2 text-left cursor-pointer hover:shadow-md transition-shadow active:scale-95`}
                  onClick={() => setExpandedAnswer(answer)}
                >
                  <span className="text-xs font-semibold text-slate-500 block mb-1">{answer.player_nickname}</span>
                  {drawing && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={drawing}
                      alt={answer.player_nickname}
                      className="w-full rounded"
                      style={{ backgroundColor: '#1e3a5f' }}
                    />
                  )}
                  {text && (
                    <p className="text-sm font-bold text-slate-800 mt-1 truncate">{text}</p>
                  )}
                </button>
              )
            })}
          </div>

          {/* 判定ボタン（親のみ） */}
          {isParent && (
            <div className="space-y-2 pt-1">
              <p className="text-sm text-center text-slate-500 font-medium">全員一致していますか？</p>
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
            <p className="text-sm text-center text-slate-400 py-2">親が判定します...</p>
          )}
        </div>
      </main>
    </>
  )
}
