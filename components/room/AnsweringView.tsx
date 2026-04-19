'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Player } from '@/types/game'

const CANVAS_BG = '#1e3a5f'
const PEN_COLOR = '#ffffff'
const PEN_WIDTH = 4
const CANVAS_W = 600
const CANVAS_H = 480

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
  const [hasContent, setHasContent] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  // Stores drawing pixels without text overlay
  const savedDrawing = useRef<ImageData | null>(null)

  const canAnswer = !isParent || parentCanAnswer
  const answerCount = answeredSessionIds.length

  const fillBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = CANVAS_BG
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }

  const renderTextOverlay = useCallback((ctx: CanvasRenderingContext2D, currentText: string) => {
    if (!currentText) return
    const padding = 14
    const fontSize = 22
    const textAreaHeight = fontSize + padding * 2
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fillRect(0, CANVAS_H - textAreaHeight, CANVAS_W, textAreaHeight)
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(currentText, CANVAS_W / 2, CANVAS_H - textAreaHeight / 2, CANVAS_W - padding * 2)
  }, [])

  const redrawWithText = useCallback((currentText: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    if (savedDrawing.current) {
      ctx.putImageData(savedDrawing.current, 0, 0)
    } else {
      fillBackground(ctx)
    }
    renderTextOverlay(ctx, currentText)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTextOverlay])

  const saveDrawingState = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    // Save without text: restore base, save, then re-apply text
    if (savedDrawing.current) {
      ctx.putImageData(savedDrawing.current, 0, 0)
    }
    savedDrawing.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
    renderTextOverlay(ctx, text)
  }, [text, renderTextOverlay])

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    fillBackground(ctx)
    savedDrawing.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    initCanvas()
  }, [initCanvas])

  useEffect(() => {
    redrawWithText(text)
  }, [text, redrawWithText])

  const getPos = (canvas: HTMLCanvasElement, e: { clientX: number; clientY: number }) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    }
  }

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
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
    setHasContent(true)
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
    if (isDrawing) saveDrawingState()
    setIsDrawing(false)
    lastPoint.current = null
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(canvas, e.touches[0])
    setIsDrawing(true)
    setHasContent(true)
    lastPoint.current = pos
    drawLine(pos, pos)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing || !lastPoint.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getPos(canvas, e.touches[0])
    drawLine(lastPoint.current, pos)
    lastPoint.current = pos
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (isDrawing) saveDrawingState()
    setIsDrawing(false)
    lastPoint.current = null
  }

  const handleClear = () => {
    setHasContent(false)
    setText('')
    initCanvas()
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setText(val)
    if (val) setHasContent(true)
  }

  const handleSubmit = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasContent) return
    setSubmitting(true)
    try {
      // Ensure text is rendered before capturing
      const ctx = canvas.getContext('2d')
      if (ctx && savedDrawing.current) {
        ctx.putImageData(savedDrawing.current, 0, 0)
        renderTextOverlay(ctx, text)
      }
      const drawing = canvas.toDataURL('image/png')
      await onSubmitAnswer(JSON.stringify({ drawing, text }))
      setText('')
      setHasContent(false)
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
                  width={CANVAS_W}
                  height={CANVAS_H}
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
                {!hasContent && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-white/30 text-sm select-none">ここに手書きで回答してください</p>
                  </div>
                )}
              </div>

              {/* テキスト入力（キャンバス下部に画像として合成） */}
              <Input
                placeholder="テキストを入力するとキャンバスに表示されます"
                value={text}
                onChange={handleTextChange}
                className="border-violet-200 focus:border-violet-400 focus:ring-violet-200"
              />

              <Button
                onClick={handleSubmit}
                disabled={!hasContent || submitting}
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
