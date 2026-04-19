'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Player } from '@/types/game'

const CANVAS_BG = '#1e3a5f'
const PEN_COLOR = '#ffffff'
const PEN_WIDTH = 3

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
  hasAnswered,
  onSubmitAnswer,
  onEndAnswering,
}: AnsweringViewProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const canAnswer = !isParent || parentCanAnswer
  const answerCount = answeredSessionIds.length

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = CANVAS_BG
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    initCanvas()
  }, [initCanvas])

  const getPos = (canvas: HTMLCanvasElement, e: { clientX: number; clientY: number }) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = PEN_COLOR
    ctx.lineWidth = PEN_WIDTH
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(canvas, e.nativeEvent)
    setIsDrawing(true)
    setHasDrawn(true)
    lastPoint.current = pos
    drawLine(pos, pos)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(canvas, e.nativeEvent)
    drawLine(lastPoint.current, pos)
    lastPoint.current = pos
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    lastPoint.current = null
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const touch = e.touches[0]
    const pos = getPos(canvas, touch)
    setIsDrawing(true)
    setHasDrawn(true)
    lastPoint.current = pos
    drawLine(pos, pos)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing || !lastPoint.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const touch = e.touches[0]
    const pos = getPos(canvas, touch)
    drawLine(lastPoint.current, pos)
    lastPoint.current = pos
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(false)
    lastPoint.current = null
  }

  const handleClear = () => {
    setHasDrawn(false)
    initCanvas()
  }

  const handleSubmit = async () => {
    const canvas = canvasRef.current
    const drawing = canvas ? canvas.toDataURL('image/png') : null
    if (!hasDrawn && !text.trim()) return
    setSubmitting(true)
    try {
      const content = JSON.stringify({ drawing, text: text.trim() })
      await onSubmitAnswer(content)
      setText('')
      setHasDrawn(false)
      initCanvas()
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
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        <div className="text-center space-y-1">
          <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0 font-bold px-3 py-1">
            ラウンド {roundNumber}
          </Badge>
          <h2 className="text-xl font-black text-slate-800 mt-2">💬 回答タイム</h2>
        </div>

        {/* 質問 */}
        <Card className="border-2 border-cyan-300 shadow-md shadow-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50">
          <CardContent className="pt-4">
            <p className="text-center text-lg font-bold text-slate-800">
              {question}
            </p>
          </CardContent>
        </Card>

        {/* 回答状況 */}
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-cyan-600 font-semibold">回答済み: {answerCount}人</span>
          <span className="text-slate-400">合計: {parentCanAnswer ? players.length : players.length - 1}人</span>
        </div>

        {/* 回答フォーム */}
        {canAnswer && !hasAnswered && (
          <Card className="border-violet-200 shadow-sm shadow-violet-100">
            <CardContent className="pt-4 space-y-3">
              {/* キャンバス */}
              <div className="relative rounded-lg overflow-hidden" style={{ background: CANVAS_BG }}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={300}
                  className="w-full touch-none cursor-crosshair block"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-2 right-2 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                >
                  クリア
                </button>
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-white/30 text-sm select-none">ここに手書きで回答してください</p>
                  </div>
                )}
              </div>

              {/* テキスト入力 */}
              <Input
                placeholder="テキストで補足（任意）"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="border-violet-200 focus:border-violet-400 focus:ring-violet-200"
              />

              <Button
                onClick={handleSubmit}
                disabled={(!hasDrawn && !text.trim()) || submitting}
                className="btn-animated w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white font-bold border-0"
              >
                {submitting ? '送信中...' : '✏️ 回答する'}
              </Button>
            </CardContent>
          </Card>
        )}

        {canAnswer && hasAnswered && (
          <div className="text-center py-6 space-y-2">
            <div className="text-5xl animate-bounce">✅</div>
            <p className="text-slate-700 font-bold">回答済み！</p>
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
            className="btn-animated w-full border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-500 hover:shadow-md hover:shadow-amber-100 font-semibold"
          >
            {ending ? '処理中...' : '🔍 回答終了（結果を見る）'}
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
