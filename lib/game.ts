import type { Player, RoomSettings } from '@/types/game'

/**
 * 現在のラウンドの親プレイヤーのsession_idを決定する
 */
export function determineParentSessionId(
  players: Player[],
  settings: RoomSettings,
  roundNumber: number,
  previousParentSessionId: string | null
): string {
  if (players.length === 0) return ''

  const host = players.find((p) => p.is_host)
  const hostSessionId = host?.session_id ?? players[0].session_id

  if (settings.hostAlwaysParent) {
    return hostSessionId
  }

  switch (settings.parentSelectionMode) {
    case 'rotation': {
      const sortedPlayers = [...players].sort(
        (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
      )
      const index = (roundNumber - 1) % sortedPlayers.length
      return sortedPlayers[index].session_id
    }

    case 'random':
    default: {
      const random = players[Math.floor(Math.random() * players.length)]
      return random.session_id
    }
  }
}

/**
 * 全員の回答が揃っているか確認（親の回答権設定も考慮）
 */
export function allAnswersSubmitted(
  players: Player[],
  answeredSessionIds: string[],
  parentSessionId: string,
  parentCanAnswer: boolean
): boolean {
  const eligiblePlayers = parentCanAnswer
    ? players
    : players.filter((p) => p.session_id !== parentSessionId)

  return eligiblePlayers.every((p) =>
    answeredSessionIds.includes(p.session_id)
  )
}
