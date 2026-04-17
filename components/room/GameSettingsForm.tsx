'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { RoomSettings, ParentMode } from '@/types/game'

interface GameSettingsFormProps {
  settings: RoomSettings
  onSave: (settings: RoomSettings) => Promise<void>
}

const PARENT_MODE_OPTIONS: { value: ParentMode; label: string }[] = [
  { value: 'host', label: 'ホストが常に親' },
  { value: 'fixed', label: '特定のプレイヤーが常に親' },
  { value: 'rotation', label: '順番に親が変わる' },
  { value: 'random', label: '毎回ランダム' },
]

export function GameSettingsForm({ settings, onSave }: GameSettingsFormProps) {
  const [form, setForm] = useState<RoomSettings>({ ...settings })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">親の決め方</Label>
        <div className="grid grid-cols-2 gap-2">
          {PARENT_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setForm({ ...form, parentMode: option.value })}
              className={`p-2.5 text-xs rounded-lg border text-left transition-colors ${
                form.parentMode === option.value
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {form.parentMode === 'fixed' && (
        <div className="space-y-2">
          <Label htmlFor="fixedParent" className="text-sm font-medium">
            親にするプレイヤーのニックネーム
          </Label>
          <Input
            id="fixedParent"
            placeholder="ニックネームを入力"
            value={form.fixedParentNickname ?? ''}
            onChange={(e) =>
              setForm({ ...form, fixedParentNickname: e.target.value || null })
            }
          />
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <Label htmlFor="parentCanAnswer" className="text-sm font-medium cursor-pointer">
          親も回答できる
        </Label>
        <button
          id="parentCanAnswer"
          type="button"
          role="switch"
          aria-checked={form.parentCanAnswer}
          onClick={() => setForm({ ...form, parentCanAnswer: !form.parentCanAnswer })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.parentCanAnswer ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 transition-transform ${
              form.parentCanAnswer ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
        {saving ? '保存中...' : '設定を保存'}
      </Button>
    </div>
  )
}
