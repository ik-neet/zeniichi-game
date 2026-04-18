'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface NicknameFormProps {
  onJoin: (nickname: string) => Promise<void>
}

export function NicknameForm({ onJoin }: NicknameFormProps) {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nickname.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onJoin(trimmed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-sm border-violet-200 shadow-xl shadow-violet-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
            🎯 全員一致！
          </CardTitle>
          <CardDescription className="text-slate-500">ニックネームを入力して参加しましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-violet-700 font-medium">ニックネーム</Label>
              <Input
                id="nickname"
                placeholder="例: たろう"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
                className="border-violet-200 focus:border-violet-400 focus:ring-violet-200"
              />
            </div>
            <Button
              type="submit"
              className="btn-animated w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white font-bold border-0"
              disabled={!nickname.trim() || loading}
            >
              {loading ? '参加中...' : '🎮 参加する'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
