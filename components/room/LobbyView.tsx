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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">🎯 全員一致！</h1>
          <p className="text-sm text-slate-500 mt-1">待ち受け中...</p>
        </div>

        {/* 招待URL */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              参加URLを共有しよう
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 rounded px-3 py-2 truncate text-slate-700 dark:text-slate-300">
                {inviteUrl}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                コピー
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 参加者リスト */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
            <Separator />
            <Button
              onClick={handleStart}
              disabled={starting || players.length < 2}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {starting ? '開始中...' : 'ゲームを開始する'}
            </Button>
            {players.length < 2 && (
              <p className="text-xs text-center text-slate-400">
                2人以上で開始できます
              </p>
            )}
          </>
        )}

        {!isHost && (
          <p className="text-sm text-center text-slate-500 py-4">
            ホストがゲームを開始するまでお待ちください...
          </p>
        )}
      </div>
    </main>
  )
}
