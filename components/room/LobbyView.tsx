'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PlayerList } from './PlayerList'
import { GameSettingsForm } from './GameSettingsForm'
import type { Player, RoomSettings } from '@/types/game'

interface LobbyViewProps {
  roomId: string
  players: Player[]
  currentSessionId: string
  isHost: boolean
  settings: RoomSettings
  onStart: () => Promise<void>
  onSaveSettings: (settings: RoomSettings) => Promise<void>
}

export function LobbyView({
  roomId,
  players,
  currentSessionId,
  isHost,
  settings,
  onStart,
  onSaveSettings,
}: LobbyViewProps) {
  const [starting, setStarting] = useState(false)
  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}` : ''

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inviteUrl)
  }

  const handleStart = async () => {
    if (players.length < 2) {
      alert('2人以上で開始できます')
      return
    }
    setStarting(true)
    try {
      await onStart()
    } finally {
      setStarting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        <div className="text-center">
          <h1 className="text-3xl font-black bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
            🎯 全員一致！
          </h1>
          <p className="text-sm text-violet-400 mt-1 animate-pulse">待ち受け中...</p>
        </div>

        {/* 招待URL */}
        <Card className="border-violet-200 shadow-sm shadow-violet-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-500">
              参加URLを共有しよう
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-violet-50 rounded px-3 py-2 truncate text-slate-600">
                {inviteUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="btn-animated border-violet-300 text-violet-600 hover:bg-violet-50 hover:border-violet-400 hover:shadow-md hover:shadow-violet-100"
              >
                コピー
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 参加者リスト */}
        <Card className="border-cyan-200 shadow-sm shadow-cyan-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-600">
              参加者 ({players.length}人)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">参加者待ち...</p>
            ) : (
              <PlayerList players={players} currentSessionId={currentSessionId} />
            )}
          </CardContent>
        </Card>

        {/* ゲーム設定 (ホストのみ) */}
        {isHost && (
          <Card className="border-amber-200 shadow-sm shadow-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">
                ゲーム設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GameSettingsForm settings={settings} onSave={onSaveSettings} />
            </CardContent>
          </Card>
        )}

        {/* 開始ボタン (ホストのみ) */}
        {isHost && (
          <>
            <Separator className="bg-violet-100" />
            <Button
              onClick={handleStart}
              disabled={starting || players.length < 2}
              className="btn-animated w-full h-12 text-base font-bold bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white border-0"
              size="lg"
            >
              {starting ? '開始中...' : '🚀 ゲームを開始する'}
            </Button>
            {players.length < 2 && (
              <p className="text-xs text-center text-slate-400">
                2人以上で開始できます
              </p>
            )}
          </>
        )}

        {!isHost && (
          <p className="text-sm text-center text-slate-400 py-4">
            ホストがゲームを開始するまでお待ちください...
          </p>
        )}
      </div>
    </main>
  )
}
