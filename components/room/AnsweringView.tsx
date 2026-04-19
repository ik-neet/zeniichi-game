'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Player } from '@/types/game'

const CANVAS_BG = '#1e3a5f'
const PEN_COLOR = '#ffffff'
const CANVAS_W = 600
const CANVAS_H = 320

const PEN_WIDTHS = [
  { label: '細', value: 3 },
  { label: '中', value: 7 },
  { label: '太', value: 14 },
]

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
  const [penWidth, setPenWidth] = useState(7)
  const [fontSize, setFontSize] = useState(48)
  const [textInput, setTextInput] = useState('')
  const [textAnchor, setTextAnchor] = useState<TextAnchor | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

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

  // モーダルを開いた直後にキャンバスを初期化
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => initCanvas(), 0)
    }
  }, [modalOpen, initCanvas])

  // モーダル表示中はbodyのスクロールを止める
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

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
    ctx.lineWidth = penWidth
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
    if (mode === 'text') {
      // e.preventDefault()によりonClickが発火しないため、touchendでテキスト配置を処理する
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      const touch = e.changedTouches[0]
      commitText()
      const cp = getCanvasPos(canvas, touch)
      const dp = getDisplayPos(container, touch)
      setTextAnchor({ canvasX: cp.x, canvasY: cp.y, displayX: dp.x, displayY: dp.y })
      setTextInput('')
      setTimeout(() => floatingInputRef.current?.focus(), 0)
      return
    }
    if (isDrawing) saveDrawingState()
    setIsDrawing(false)
    lastPoint.current = null
  }

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
      setModalOpen(false)
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

  // キャンバス＋ツールバーのJSX（モーダル内で使う）
  const canvasArea = (
    <div className="flex flex-col">
      {/* ツールバー */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-100 flex-shrink-0">
        <div className="flex rounded-lg overflow-hidden border border-violet-200">
          <button
            type="button"
            onClick={() => { commitText(); setMode('draw') }}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${mode === 'draw' ? 'bg-violet-500 text-white' : 'bg-white text-slate-600'}`}
          >
            ✏️ 手書き
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${mode === 'text' ? 'bg-violet-500 text-white' : 'bg-white text-slate-600'}`}
          >
            Ａ テキスト
          </button>
        </div>

        {mode === 'draw' && (
          <div className="flex rounded-lg overflow-hidden border border-violet-200">
            {PEN_WIDTHS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPenWidth(value)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${penWidth === value ? 'bg-cyan-500 text-white' : 'bg-white text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {mode === 'text' && (
          <div className="flex rounded-lg overflow-hidden border border-violet-200">
            {FONT_SIZES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFontSize(value)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${fontSize === value ? 'bg-cyan-500 text-white' : 'bg-white text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

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
        className="relative overflow-hidden"
        style={{ background: CANVAS_BG }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={`w-full touch-none block ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-text'}`}
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCanvasClick}
        />

        {/* PC用: 透明フローティング入力（タッチ端末では使われない） */}
        {mode === 'text' && textAnchor && (
          <input
            ref={floatingInputRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitText() }}
            className="absolute bg-transparent border-none outline-none caret-white p-0 m-0 pointer-events-none opacity-0"
            style={{
              color: 'transparent',
              left: textAnchor.displayX,
              top: textAnchor.displayY,
              fontSize: `${fontSize * (containerRef.current?.getBoundingClientRect().width ?? CANVAS_W) / CANVAS_W}px`,
              fontWeight: 'bold',
              fontFamily: 'sans-serif',
              minWidth: 4,
              width: '80%',
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

      {/* テキストモード入力バー（タッチ端末でも確実に入力できる可視バー） */}
      {mode === 'text' && textAnchor && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-slate-800 border-t border-slate-600">
          <input
            ref={floatingInputRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitText() }}
            placeholder="テキストを入力..."
            className="flex-1 bg-slate-700 text-white placeholder:text-slate-400 rounded-lg px-3 py-2 text-base border-none outline-none"
            autoComplete="off"
            autoFocus
          />
          <button
            type="button"
            onClick={commitText}
            className="bg-violet-500 text-white rounded-lg px-4 py-2 font-bold text-sm flex-shrink-0"
          >
            確定
          </button>
        </div>
      )}

      {/* 送信ボタン */}
      <div className="flex-shrink-0 p-3 bg-white border-t border-slate-100">
        <Button
          onClick={handleSubmit}
          disabled={!hasContent || submitting}
          className="btn-animated w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white font-bold border-0"
        >
          {submitting ? '送信中...' : '✏️ 回答する'}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* フルスクリーンモーダル */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0 font-bold text-xs">
                ラウンド {roundNumber}
              </Badge>
              <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{question}</p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none ml-2"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          {/* キャンバスエリア */}
          <div className="flex-1 overflow-y-auto">
            {canvasArea}
          </div>
        </div>
      )}

      {/* メイン画面（コンパクト） */}
      <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
        <div className="max-w-md mx-auto space-y-3 pt-6">
          <div className="text-center space-y-1">
            <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0 font-bold px-3 py-1">
              ラウンド {roundNumber}
            </Badge>
            <h2 className="text-xl font-black text-slate-800 mt-1">💬 回答タイム</h2>
          </div>

          {/* 質問 */}
          <Card className="border-2 border-cyan-300 shadow-md shadow-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardContent className="py-3 px-4">
              <p className="text-center text-lg font-bold text-slate-800">{question}</p>
            </CardContent>
          </Card>

          {/* 回答状況 */}
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-cyan-600 font-semibold">回答済み: {answerCount}人</span>
            <span className="text-slate-400">合計: {parentCanAnswer ? players.length : players.length - 1}人</span>
          </div>

          {/* 回答ボタン or 済みメッセージ */}
          {canAnswer && !hasAnswered && (
            <Button
              onClick={() => setModalOpen(true)}
              className="btn-animated w-full h-12 text-base bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white font-bold border-0"
            >
              ✏️ 回答を入力する
            </Button>
          )}

          {canAnswer && hasAnswered && (
            <div className="text-center py-4 space-y-2">
              <div className="text-5xl animate-bounce">✅</div>
              <p className="text-slate-700 font-bold">回答済み！</p>
              <p className="text-sm text-slate-400">他のプレイヤーの回答を待っています...</p>
            </div>
          )}

          {isParent && !parentCanAnswer && (
            <div className="text-center py-2">
              <p className="text-sm text-slate-500">あなたは今回の回答権がありません</p>
            </div>
          )}

          {isParent && (
            <Button
              onClick={handleEndAnswering}
              disabled={ending || answerCount === 0}
              variant="outline"
              className="btn-animated w-full border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-500 hover:shadow-md hover:shadow-amber-100 font-semibold bg-white"
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
    </>
  )
}
