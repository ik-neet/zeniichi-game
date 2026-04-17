import { Badge } from '@/components/ui/badge'
import type { Player } from '@/types/game'

interface PlayerListProps {
  players: Player[]
  currentSessionId: string
  parentSessionId?: string
}

export function PlayerList({ players, currentSessionId, parentSessionId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {player.nickname}
              {player.session_id === currentSessionId && (
                <span className="text-slate-400 text-xs ml-1">（あなた）</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {player.is_host && (
              <Badge variant="secondary" className="text-xs">ホスト</Badge>
            )}
            {parentSessionId && player.session_id === parentSessionId && (
              <Badge className="text-xs bg-amber-500 hover:bg-amber-500">親</Badge>
            )}
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
              {player.score}pt
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
