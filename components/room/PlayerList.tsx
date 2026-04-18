import { Badge } from '@/components/ui/badge'
import type { Player } from '@/types/game'

interface PlayerListProps {
  players: Player[]
  currentSessionId: string
  parentSessionId?: string
}

const rankColors = [
  'text-amber-500',   // 1位: ゴールド
  'text-slate-400',   // 2位: シルバー
  'text-orange-400',  // 3位: ブロンズ
]

export function PlayerList({ players, currentSessionId, parentSessionId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player, index) => {
        const isMe = player.session_id === currentSessionId
        const accentColors = [
          'border-l-violet-400',
          'border-l-cyan-400',
          'border-l-pink-400',
          'border-l-amber-400',
          'border-l-green-400',
          'border-l-blue-400',
        ]
        const borderColor = accentColors[index % accentColors.length]
        return (
          <div
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${borderColor} bg-white shadow-sm ${isMe ? 'ring-1 ring-violet-200' : ''}`}
          >
            <div className="flex items-center gap-2">
              {index < 3 && (
                <span className={`text-sm font-black ${rankColors[index]}`}>
                  {['🥇', '🥈', '🥉'][index]}
                </span>
              )}
              <span className="text-sm font-semibold text-slate-800">
                {player.nickname}
                {isMe && (
                  <span className="text-violet-400 text-xs ml-1 font-normal">（あなた）</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {player.is_host && (
                <Badge className="text-xs bg-violet-100 text-violet-600 border-violet-200 hover:bg-violet-100">ホスト</Badge>
              )}
              {parentSessionId && player.session_id === parentSessionId && (
                <Badge className="text-xs bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-100">親 👑</Badge>
              )}
              <span className="text-sm font-black text-slate-700 ml-1">
                {player.score}pt
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
