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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🎯 全員一致！</CardTitle>
          <CardDescription>ニックネームを入力して参加しましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">ニックネーム</Label>
              <Input
                id="nickname"
                placeholder="例: たろう"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!nickname.trim() || loading}
            >
              {loading ? '参加中...' : '参加する'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
