'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PresetQuestion } from '@/types/game'

interface QuestioningViewProps {
  isParent: boolean
  isHost: boolean
  parentNickname: string
  roundNumber: number
  presetQuestions: PresetQuestion[]
  onSubmitQuestion: (question: string) => Promise<void>
  onEndGame: () => Promise<void>
}

export function QuestioningView({
  isParent,
  isHost,
  parentNickname,
  roundNumber,
  presetQuestions,
  onSubmitQuestion,
  onEndGame,
}: QuestioningViewProps) {
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [usePreset, setUsePreset] = useState(false)
  const [displayedPresets, setDisplayedPresets] = useState<PresetQuestion[]>([])

  const pickRandomPresets = () => {
    const shuffled = [...presetQuestions].sort(() => Math.random() - 0.5)
    setDisplayedPresets(shuffled.slice(0, 10))
  }

  const handleSwitchToPreset = () => {
    setUsePreset(true)
    pickRandomPresets()
  }

  const handleRandomSubmit = () => {
    if (displayedPresets.length === 0) return
    const picked = displayedPresets[Math.floor(Math.random() * displayedPresets.length)]
    handleSubmit(picked.text)
  }

  const handleEndGame = async () => {
    setEnding(true)
    try {
      await onEndGame()
    } finally {
      setEnding(false)
    }
  }

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
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl animate-bounce">🤔</div>
          <h2 className="text-xl font-bold text-slate-800">
            ラウンド {roundNumber}
          </h2>
          <p className="text-slate-500">
            <span className="font-semibold text-violet-600">{parentNickname}</span>さんがお題を考えています...
          </p>
          {isHost && (
            <Button
              onClick={handleEndGame}
              disabled={ending}
              variant="outline"
              className="btn-animated mt-4 border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 font-semibold"
            >
              {ending ? '終了中...' : '🚪 ゲームを終了する'}
            </Button>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        <div className="text-center space-y-1">
          <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 font-bold px-3 py-1">
            ラウンド {roundNumber} — あなたが親 👑
          </Badge>
          <h2 className="text-2xl font-black text-slate-800 mt-2">お題を出しましょう</h2>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUsePreset(false)}
            className={`btn-animated flex-1 py-2 text-sm rounded-lg font-semibold transition-all ${
              !usePreset
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-md shadow-violet-200'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-violet-300'
            }`}
          >
            自分で入力
          </button>
          <button
            type="button"
            onClick={handleSwitchToPreset}
            className={`btn-animated flex-1 py-2 text-sm rounded-lg font-semibold transition-all ${
              usePreset
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-md shadow-violet-200'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-violet-300'
            }`}
          >
            プリセットから選ぶ
          </button>
        </div>

        {!usePreset ? (
          <Card className="border-violet-200 shadow-sm shadow-violet-100">
            <CardContent className="pt-4 space-y-3">
              <Textarea
                placeholder="例: 好きな食べ物は？"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none border-violet-200 focus:border-violet-400 focus:ring-violet-200"
                rows={3}
                autoFocus
              />
              <Button
                onClick={() => handleSubmit(question)}
                disabled={!question.trim() || submitting}
                className="btn-animated w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white font-bold border-0"
              >
                {submitting ? '出題中...' : '📝 出題する'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-violet-200 shadow-sm shadow-violet-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-violet-500">プリセット質問</CardTitle>
                <button
                  type="button"
                  onClick={pickRandomPresets}
                  disabled={submitting}
                  className="text-xs text-violet-400 hover:text-violet-600 transition-colors"
                >
                  🔄 質問を再取得
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {presetQuestions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  プリセット質問がありません
                </p>
              ) : (
                <>
                  {displayedPresets.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSubmit(q.text)}
                      disabled={submitting}
                      className="btn-animated w-full text-left p-3 rounded-lg border border-violet-100 bg-violet-50 hover:bg-violet-100 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100 text-sm text-slate-700 font-medium transition-all"
                    >
                      {q.text}
                    </button>
                  ))}
                  <Button
                    onClick={handleRandomSubmit}
                    disabled={submitting || displayedPresets.length === 0}
                    className="btn-animated w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 hover:shadow-lg hover:shadow-amber-200 text-white font-bold border-0 mt-2"
                  >
                    {submitting ? '出題中...' : '🎲 ランダムに質問を出す'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isHost && (
          <Button
            onClick={handleEndGame}
            disabled={ending}
            variant="outline"
            className="btn-animated w-full border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 font-semibold"
          >
            {ending ? '終了中...' : '🚪 ゲームを終了する'}
          </Button>
        )}
      </div>
    </main>
  )
}
