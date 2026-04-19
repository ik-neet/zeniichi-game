'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Player } from '@/types/game'

const CANVAS_BG = '#1e3a5f'
const PEN_COLOR = '#ffffff'
const PEN_WIDTH = 4
const CANVAS_W = 600
const CANVAS_H = 480

const FONT_SIZES = [
  { label: 'S', value: 32 },
  { label: 'M', value: 48 },
  { label: 'L', value: 72 },
  { label: 'XL', value: 100 },
]

type Mode = 'draw' | 'text'

interface TextAnchor {
  canvasX: number
  canvasY: number
  displayX: number
  displayY: number
}

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
  const [mode, setMode] = useState<Mode>('draw')
  const [fontSize, setFontSize] = useState(24)
  const [textInput, setTextInput] = useState('')
  const [textAnchor, setTextAnchor] = useState<TextAnchor | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const floatingInputRef = useRef<HTMLInputElement>(null)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const savedDrawing = useRef<ImageData | null>(null)

  const canAnswer = !isParent || parentCanAnswer
  const answerCount = answeredSessionIds.length

  const fillBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = CANVAS_BG
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    fillBackground(ctx)
    savedDrawing.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { initCanvas() }, [initCanvas])

  // Preview typed text on canvas in real-time
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !textAnchor) return
    if (savedDrawing.current) ctx.putImageData(savedDrawing.current, 0, 0)
    if (textInput) {
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillStyle = PEN_COLOR
      ctx.textBaseline = 'top'
      ctx.fillText(textInput, textAnchor.canvasX, textAnchor.canvasY)
    }
  }, [textInput, textAnchor, fontSize])

  const commitText = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !textAnchor) {
      setTextAnchor(null)
      setTextInput('')
      return
    }
    if (textInput.trim()) {
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillStyle = PEN_COLOR
      ctx.textBaseline = 'top'
      ctx.fillText(textInput.trim(), textAnchor.canvasX, textAnchor.canvasY)
      savedDrawing.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
      setHasContent(true)
    } else if (savedDrawing.current) {
      ctx.putImageData(savedDrawing.current, 0, 0)
    }
    setTextAnchor(null)
    setTextInput('')
  }, [textAnchor, textInput, fontSize])

  const getCanvasPos = (canvas: HTMLCanvasElement, e: { clientX: number; clientY: number }) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    }
  }

  const getDisplayPos = (container: HTMLDivElement, e: { clientX: number; clientY: number }) => {
    const rect = container.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext('2d')
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

  const saveDrawingState = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      savedDrawing.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
    }
  }

  // --- Draw mode handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    commitText()
    const pos = getCanvasPos(canvas, e.nativeEvent)
    setIsDrawing(true)
    setHasContent(true)
    lastPoint.current = pos
    drawLine(pos, pos)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw' || !isDrawing || !lastPoint.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getCanvasPos(canvas, e.nativeEvent)
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
    if (mode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    commitText()
    const pos = getCanvasPos(canvas, e.touches[0])
    setIsDrawing(true)
    setHasContent(true)
    lastPoint.current = pos
    drawLine(pos, pos)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (mode !== 'draw' || !isDrawing || !lastPoint.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getCanvasPos(canvas, e.touches[0])
    drawLine(lastPoint.current, pos)
    lastPoint.current = pos
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (isDrawing) saveDrawingState()
    setIsDrawing(false)
    lastPoint.current = null
  }

  // --- Text mode handler ---
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'text') return
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    commitText()
    const cp = getCanvasPos(canvas, e.nativeEvent)
    const dp = getDisplayPos(container, e.nativeEvent)
    setTextAnchor({ canvasX: cp.x, canvasY: cp.y, displayX: dp.x, displayY: dp.y })
    setTextInput('')
    setTimeout(() => floatingInputRef.current?.focus(), 0)
  }

  const handleClear = () => {
    setHasContent(false)
    setTextAnchor(null)
    setTextInput('')
    initCanvas()
  }

  const handleSubmit = async () => {
    if (!hasContent) return
    commitText()
    const canvas = canvasRef.current
    if (!canvas) return
    setSubmitting(true)
    try {
      const drawing = canvas.toDataURL('image/png')
      await onSubmitAnswer(JSON.stringify({ drawing, text: '' }))
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
            <p className="text-center text-lg font-bold text-slate-800">{question}</p>
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

              {/* ツールバー */}
              <div className="flex items-center gap-2">
                {/* モード切替 */}
                <div className="flex rounded-lg overflow-hidden border border-violet-200">
                  <button
                    type="button"
                    onClick={() => { commitText(); setMode('draw') }}
                    className={`px-3 py-1.5 text-sm font-semibold transition-colors ${mode === 'draw' ? 'bg-violet-500 text-white' : 'bg-white text-slate-600 hover:bg-violet-50'}`}
                  >
                    ✏️ 手書き
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('text')}
                    className={`px-3 py-1.5 text-sm font-semibold transition-colors ${mode === 'text' ? 'bg-violet-500 text-white' : 'bg-white text-slate-600 hover:bg-violet-50'}`}
                  >
                    Ａ テキスト
                  </button>
                </div>

                {/* フォントサイズ (テキストモード時のみ) */}
                {mode === 'text' && (
                  <div className="flex rounded-lg overflow-hidden border border-violet-200 ml-auto">
                    {FONT_SIZES.map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFontSize(value)}
                        className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${fontSize === value ? 'bg-cyan-500 text-white' : 'bg-white text-slate-600 hover:bg-cyan-50'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* クリアボタン */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  クリア
                </button>
              </div>

              {/* キャンバス */}
              <div
                ref={containerRef}
                className="relative rounded-lg overflow-hidden"
                style={{ background: CANVAS_BG }}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className={`w-full touch-none block ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-text'}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={handleCanvasClick}
                />

                {/* テキストモード: クリック位置にフローティング入力 */}
                {mode === 'text' && textAnchor && (
                  <input
                    ref={floatingInputRef}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitText() }}
                    onBlur={commitText}
                    className="absolute bg-transparent border-none outline-none text-white caret-white p-0 m-0"
                    style={{
                      left: textAnchor.displayX,
                      top: textAnchor.displayY,
                      fontSize: `${fontSize * (containerRef.current?.getBoundingClientRect().width ?? CANVAS_W) / CANVAS_W}px`,
                      fontWeight: 'bold',
                      fontFamily: 'sans-serif',
                      minWidth: 4,
                      width: '80%',
                      maxWidth: `calc(100% - ${textAnchor.displayX}px - 8px)`,
                    }}
                    autoComplete="off"
                  />
                )}

                {!hasContent && !textAnchor && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-white/30 text-sm select-none">
                      {mode === 'draw' ? 'ここに手書きで回答してください' : 'キャンバスをクリックしてテキストを入力'}
                    </p>
                  </div>
                )}
                {mode === 'text' && !textAnchor && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                    <span className="text-white/40 text-xs">クリックした位置にテキストを配置</span>
                  </div>
                )}
              </div>

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
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">あなたは今回の回答権がありません</p>
          </div>
        )}

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
