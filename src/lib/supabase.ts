import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Database types
export interface Player {
  id: string
  email: string
  username: string
  avatar_url?: string
  total_races: number
  wins: number
  best_time: number
  created_at: string
  updated_at: string
}

export interface Tournament {
  id: string
  name: string
  description: string
  max_participants: number
  entry_fee: number
  prize_pool: number
  status: 'upcoming' | 'active' | 'completed'
  start_time: string
  end_time: string
  created_by: string
  participants: string[]
  bracket: any
  created_at: string
}

export interface Race {
  id: string
  tournament_id?: string
  players: string[]
  race_data: any
  winner_id?: string
  race_time: number
  status: 'waiting' | 'active' | 'completed'
  created_at: string
}

// Database functions
export const getLeaderboard = async (limit = 100) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('best_time', { ascending: true })
    .limit(limit)
  
  return { data, error }
}

export const createTournament = async (tournament: Partial<Tournament>) => {
  const { data, error } = await supabase
    .from('tournaments')
    .insert([tournament])
    .select()
  
  return { data, error }
}

export const joinTournament = async (tournamentId: string, playerId: string) => {
  const { data, error } = await supabase
    .rpc('join_tournament', {
      tournament_id: tournamentId,
      player_id: playerId
    })
  
  return { data, error }
}

export const updatePlayerStats = async (playerId: string, stats: Partial<Player>) => {
  const { data, error } = await supabase
    .from('players')
    .update(stats)
    .eq('id', playerId)
    .select()
  
  return { data, error }
}