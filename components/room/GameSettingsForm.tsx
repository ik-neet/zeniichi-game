'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { RoomSettings, ParentSelectionMode } from '@/types/game'

const PARENT_SELECTION_OPTIONS: { value: ParentSelectionMode; label: string }[] = [
  { value: 'random', label: 'ランダム' },
  { value: 'rotation', label: '順番' },
]

export function GameSettingsForm({ settings, onSave }: { settings: RoomSettings; onSave: (settings: RoomSettings) => Promise<void> }) {
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
      {/* ホストが常に親 */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
        <Label htmlFor="hostAlwaysParent" className="text-sm font-semibold text-slate-700 cursor-pointer">
          ホストが常に親
        </Label>
        <button
          id="hostAlwaysParent"
          type="button"
          role="switch"
          aria-checked={form.hostAlwaysParent}
          onClick={() => setForm({ ...form, hostAlwaysParent: !form.hostAlwaysParent })}
          className={`btn-animated relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.hostAlwaysParent
              ? 'bg-gradient-to-r from-violet-500 to-cyan-500'
              : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              form.hostAlwaysParent ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 親の決め方（ホスト固定OFFの場合のみ） */}
      {!form.hostAlwaysParent && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">親の決め方</Label>
          <div className="grid grid-cols-2 gap-2">
            {PARENT_SELECTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm({ ...form, parentSelectionMode: option.value })}
                className={`btn-animated p-2.5 text-xs rounded-lg border text-center font-semibold transition-all ${
                  form.parentSelectionMode === option.value
                    ? 'border-violet-400 bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-md shadow-violet-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 親も回答できる */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
        <Label htmlFor="parentCanAnswer" className="text-sm font-semibold text-slate-700 cursor-pointer">
          親も回答できる
        </Label>
        <button
          id="parentCanAnswer"
          type="button"
          role="switch"
          aria-checked={form.parentCanAnswer}
          onClick={() => setForm({ ...form, parentCanAnswer: !form.parentCanAnswer })}
          className={`btn-animated relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.parentCanAnswer
              ? 'bg-gradient-to-r from-violet-500 to-cyan-500'
              : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              form.parentCanAnswer ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="btn-animated w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-violet-200 text-white font-bold border-0"
        size="sm"
      >
        {saving ? '保存中...' : '💾 設定を保存'}
      </Button>
    </div>
  )
}
