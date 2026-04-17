export type ParentMode = 'host' | 'fixed' | 'rotation' | 'random'

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export type RoundStatus =
  | 'questioning'
  | 'answering'
  | 'reviewing'
  | 'judging'
  | 'completed'

export type RoundResult = 'match' | 'no_match' | null

export interface RoomSettings {
  parentMode: ParentMode
  fixedParentNickname: string | null
  parentCanAnswer: boolean
}

export interface Room {
  id: string
  host_session_id: string
  settings: RoomSettings
  status: RoomStatus
  created_at: string
  expires_at: string
}

export interface Player {
  id: string
  room_id: string
  session_id: string
  nickname: string
  score: number
  is_host: boolean
  joined_at: string
}

export interface Round {
  id: string
  room_id: string
  round_number: number
  parent_session_id: string
  question: string | null
  status: RoundStatus
  result: RoundResult
  created_at: string
}

export interface Answer {
  id: string
  round_id: string
  player_session_id: string
  player_nickname: string
  content: string
  submitted_at: string
}

export interface PresetQuestion {
  id: string
  text: string
  category: string
  created_at: string
}
