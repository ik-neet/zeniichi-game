'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { determineParentSessionId } from '@/lib/game'
import { NicknameForm } from '@/components/room/NicknameForm'
import { LobbyView } from '@/components/room/LobbyView'
import { QuestioningView } from '@/components/room/QuestioningView'
import { AnsweringView } from '@/components/room/AnsweringView'
import { ReviewingView } from '@/components/room/ReviewingView'
import { JudgingView } from '@/components/room/JudgingView'
import type { Room, Player, Round, Answer, PresetQuestion, RoomSettings } from '@/types/game'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.id as string

  const [sessionId, setSessionId] = useState<string>('')
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [presetQuestions, setPresetQuestions] = useState<PresetQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expired, setExpired] = useState(false)

  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null>(null)

  // 初期データ取得
  const fetchInitialData = useCallback(async (sid: string) => {
    const supabase = getSupabaseClient()

    const [roomRes, playersRes, roundsRes, presetsRes] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
      supabase.from('players').select('*').eq('room_id', roomId).order('joined_at'),
      supabase.from('rounds').select('*').eq('room_id', roomId).order('round_number', { ascending: false }).limit(1),
      supabase.from('preset_questions').select('*').order('created_at'),
    ])

    if (roomRes.error || !roomRes.data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    if (new Date(roomRes.data.expires_at) < new Date()) {
      setExpired(true)
      setLoading(false)
      return
    }

    setRoom(roomRes.data)
    setPlayers(playersRes.data ?? [])
    setPresetQuestions(presetsRes.data ?? [])

    const latestRound = roundsRes.data?.[0] ?? null
    setCurrentRound(latestRound)

    if (latestRound) {
      const answersRes = await supabase
        .from('answers')
        .select('*')
        .eq('round_id', latestRound.id)
      setAnswers(answersRes.data ?? [])
    }

    setLoading(false)
  }, [roomId])

  // Realtime サブスクリプション設定
  const setupRealtime = useCallback((sid: string) => {
    const supabase = getSupabaseClient()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as Room)
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase.from('players').select('*').eq('room_id', roomId).order('joined_at')
          setPlayers(data ?? [])
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const round = payload.new as Round
            setCurrentRound(round)
            // 新しいラウンドなら回答をリセット
            if (payload.eventType === 'INSERT') {
              setAnswers([])
            } else {
              const { data } = await supabase.from('answers').select('*').eq('round_id', round.id)
              setAnswers(data ?? [])
            }
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' },
        async () => {
          if (!currentRound) return
          const { data } = await supabase.from('answers').select('*').eq('round_id', currentRound.id)
          setAnswers(data ?? [])
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [roomId, currentRound])

  useEffect(() => {
    const sid = getOrCreateSessionId()
    setSessionId(sid)
    fetchInitialData(sid)
  }, [fetchInitialData])

  useEffect(() => {
    if (!loading && sessionId) {
      setupRealtime(sessionId)
    }
    return () => {
      const supabase = getSupabaseClient()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sessionId])

  // answers が変わったら再サブスク不要なため currentRound を ref で参照
  useEffect(() => {
    if (!currentRound || !sessionId) return
    const supabase = getSupabaseClient()
    const sub = supabase
      .channel(`answers:${currentRound.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `round_id=eq.${currentRound.id}` },
        async () => {
          const { data } = await supabase.from('answers').select('*').eq('round_id', currentRound.id)
          setAnswers(data ?? [])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [currentRound?.id, sessionId])

  // ---- アクション ----

  const handleJoin = async (nickname: string) => {
    const supabase = getSupabaseClient()
    const isFirst = players.length === 0
    await supabase.from('players').upsert({
      room_id: roomId,
      session_id: sessionId,
      nickname,
      score: 0,
      is_host: isFirst,
    }, { onConflict: 'room_id,session_id' })
    await fetchInitialData(sessionId)
  }

  const handleSaveSettings = async (settings: RoomSettings) => {
    const supabase = getSupabaseClient()
    await supabase.from('rooms').update({ settings }).eq('id', roomId)
    setRoom((prev) => prev ? { ...prev, settings } : prev)
  }

  const handleStartGame = async () => {
    const supabase = getSupabaseClient()
    const parentSessionId = determineParentSessionId(players, room!.settings, 1, null)

    await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId)

    await supabase.from('rounds').insert({
      room_id: roomId,
      round_number: 1,
      parent_session_id: parentSessionId,
      status: 'questioning',
    })
  }

  const handleSubmitQuestion = async (question: string) => {
    const supabase = getSupabaseClient()
    await supabase.from('rounds').update({ question, status: 'answering' }).eq('id', currentRound!.id)
  }

  const handleSubmitAnswer = async (content: string) => {
    const supabase = getSupabaseClient()
    const me = players.find((p) => p.session_id === sessionId)
    await supabase.from('answers').upsert({
      round_id: currentRound!.id,
      player_session_id: sessionId,
      player_nickname: me?.nickname ?? 'Unknown',
      content,
    }, { onConflict: 'round_id,player_session_id' })
  }

  const handleEndAnswering = async () => {
    const supabase = getSupabaseClient()
    await supabase.from('rounds').update({ status: 'reviewing' }).eq('id', currentRound!.id)
  }

  const handleJudge = async (result: 'match' | 'no_match') => {
    const supabase = getSupabaseClient()
    await supabase.from('rounds').update({ status: 'judging', result }).eq('id', currentRound!.id)

    if (result === 'match') {
      // 回答したプレイヤー全員に +1pt
      const scoringSessionIds = answers.map((a) => a.player_session_id)
      await Promise.all(
        players
          .filter((p) => scoringSessionIds.includes(p.session_id))
          .map((p) =>
            supabase.from('players').update({ score: p.score + 1 }).eq('id', p.id)
          )
      )
    }
  }

  const handleNextRound = async () => {
    const supabase = getSupabaseClient()
    await supabase.from('rounds').update({ status: 'completed' }).eq('id', currentRound!.id)

    const nextRoundNumber = (currentRound?.round_number ?? 0) + 1
    const parentSessionId = determineParentSessionId(
      players,
      room!.settings,
      nextRoundNumber,
      currentRound!.parent_session_id
    )

    await supabase.from('rounds').insert({
      room_id: roomId,
      round_number: nextRoundNumber,
      parent_session_id: parentSessionId,
      status: 'questioning',
    })
  }

  // ---- 派生状態 ----

  const currentPlayer = players.find((p) => p.session_id === sessionId)
  const isHost = currentPlayer?.is_host ?? false
  const hasJoined = !!currentPlayer

  const parentSessionId = currentRound?.parent_session_id ?? ''
  const isParent = parentSessionId === sessionId
  const parentPlayer = players.find((p) => p.session_id === parentSessionId)
  const parentNickname = parentPlayer?.nickname ?? '親'

  const answeredSessionIds = answers.map((a) => a.player_session_id)
  const hasAnswered = answeredSessionIds.includes(sessionId)

  // ---- レンダリング ----

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-400">読み込み中...</p>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">部屋が見つかりません</p>
          <p className="text-slate-400">URLを確認してください</p>
        </div>
      </main>
    )
  }

  if (expired) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">この部屋は期限切れです</p>
          <p className="text-slate-400">部屋は作成から24時間で自動的に削除されます</p>
          <a href="/" className="inline-block mt-4 text-sm text-blue-500 hover:underline">トップへ戻る</a>
        </div>
      </main>
    )
  }

  if (!hasJoined) {
    return <NicknameForm onJoin={handleJoin} />
  }

  if (room?.status === 'waiting') {
    return (
      <LobbyView
        roomId={roomId}
        players={players}
        currentSessionId={sessionId}
        isHost={isHost}
        settings={room.settings}
        onStart={handleStartGame}
        onSaveSettings={handleSaveSettings}
      />
    )
  }

  if (!currentRound) return null

  if (currentRound.status === 'questioning') {
    return (
      <QuestioningView
        isParent={isParent}
        parentNickname={parentNickname}
        roundNumber={currentRound.round_number}
        presetQuestions={presetQuestions}
        onSubmitQuestion={handleSubmitQuestion}
      />
    )
  }

  if (currentRound.status === 'answering') {
    return (
      <AnsweringView
        question={currentRound.question ?? ''}
        roundNumber={currentRound.round_number}
        isParent={isParent}
        parentCanAnswer={room?.settings.parentCanAnswer ?? true}
        parentNickname={parentNickname}
        players={players}
        answeredSessionIds={answeredSessionIds}
        currentSessionId={sessionId}
        hasAnswered={hasAnswered}
        onSubmitAnswer={handleSubmitAnswer}
        onEndAnswering={handleEndAnswering}
      />
    )
  }

  if (currentRound.status === 'reviewing') {
    return (
      <ReviewingView
        question={currentRound.question ?? ''}
        roundNumber={currentRound.round_number}
        answers={answers}
        isParent={isParent}
        onJudge={handleJudge}
      />
    )
  }

  if (currentRound.status === 'judging') {
    return (
      <JudgingView
        roundNumber={currentRound.round_number}
        result={currentRound.result}
        players={players}
        currentSessionId={sessionId}
        parentSessionId={parentSessionId}
        isParent={isParent}
        isHost={isHost}
        onNextRound={handleNextRound}
      />
    )
  }

  return null
}
