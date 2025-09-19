import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getLeaderboard, Player } from '@/lib/supabase'
import { Trophy, Medal, Award, Clock, Target, TrendingUp, Star } from 'lucide-react'

interface LeaderboardProps {
  currentUserId?: string
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
  const [topPlayers, setTopPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overall')

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedTab])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const { data, error } = await getLeaderboard(100)
      
      if (error) throw error
      
      // Sort based on selected tab
      let sortedData = data || []
      switch (selectedTab) {
        case 'overall':
          sortedData = sortedData.sort((a, b) => (a.best_time || Infinity) - (b.best_time || Infinity))
          break
        case 'wins':
          sortedData = sortedData.sort((a, b) => b.wins - a.wins)
          break
        case 'races':
          sortedData = sortedData.sort((a, b) => b.total_races - a.total_races)
          break
        case 'winrate':
          sortedData = sortedData.sort((a, b) => {
            const winRateA = a.total_races > 0 ? (a.wins / a.total_races) * 100 : 0
            const winRateB = b.total_races > 0 ? (b.wins / b.total_races) * 100 : 0
            return winRateB - winRateA
          })
          break
      }
      
      setTopPlayers(sortedData)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-accent" />
      case 2:
        return <Medal className="w-6 h-6 text-muted-foreground" />
      case 3:
        return <Award className="w-6 h-6 text-warning" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold">#{position}</span>
    }
  }

  const getRankBadge = (position: number) => {
    if (position <= 3) return 'default'
    if (position <= 10) return 'secondary'
    return 'outline'
  }

  const formatTime = (timeInSeconds: number) => {
    if (!timeInSeconds) return 'N/A'
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = (timeInSeconds % 60).toFixed(2)
    return `${minutes}:${seconds.padStart(5, '0')}`
  }

  const getWinRate = (wins: number, totalRaces: number) => {
    if (totalRaces === 0) return '0%'
    return `${((wins / totalRaces) * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-pulse-glow text-primary text-4xl mb-4">🏆</div>
          <p className="text-lg font-racing">Loading Leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-racing text-racing-gradient mb-4">Global Leaderboard</h2>
        <p className="text-muted-foreground">Top 100 racers from around the world</p>
      </motion.div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="wins">Most Wins</TabsTrigger>
          <TabsTrigger value="races">Most Races</TabsTrigger>
          <TabsTrigger value="winrate">Win Rate</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {/* Top 3 Podium */}
          {topPlayers.length >= 3 && (
            <motion.div
              className="grid grid-cols-3 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* 2nd Place */}
              <Card className="racing-card order-1">
                <CardContent className="text-center pt-6">
                  <div className="mb-4">
                    <Avatar className="w-16 h-16 mx-auto mb-2">
                      <AvatarImage src={topPlayers[1]?.avatar_url} />
                      <AvatarFallback>{topPlayers[1]?.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Medal className="w-8 h-8 text-muted-foreground mx-auto" />
                  </div>
                  <h3 className="font-racing text-lg">{topPlayers[1]?.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTab === 'overall' && formatTime(topPlayers[1]?.best_time)}
                    {selectedTab === 'wins' && `${topPlayers[1]?.wins} wins`}
                    {selectedTab === 'races' && `${topPlayers[1]?.total_races} races`}
                    {selectedTab === 'winrate' && getWinRate(topPlayers[1]?.wins, topPlayers[1]?.total_races)}
                  </p>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="racing-card order-2 border-accent shadow-glow">
                <CardContent className="text-center pt-6">
                  <div className="mb-4">
                    <Avatar className="w-20 h-20 mx-auto mb-2 border-2 border-accent">
                      <AvatarImage src={topPlayers[0]?.avatar_url} />
                      <AvatarFallback>{topPlayers[0]?.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Trophy className="w-10 h-10 text-accent mx-auto animate-pulse-glow" />
                  </div>
                  <h3 className="font-racing text-xl text-accent">{topPlayers[0]?.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTab === 'overall' && formatTime(topPlayers[0]?.best_time)}
                    {selectedTab === 'wins' && `${topPlayers[0]?.wins} wins`}
                    {selectedTab === 'races' && `${topPlayers[0]?.total_races} races`}
                    {selectedTab === 'winrate' && getWinRate(topPlayers[0]?.wins, topPlayers[0]?.total_races)}
                  </p>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="racing-card order-3">
                <CardContent className="text-center pt-6">
                  <div className="mb-4">
                    <Avatar className="w-16 h-16 mx-auto mb-2">
                      <AvatarImage src={topPlayers[2]?.avatar_url} />
                      <AvatarFallback>{topPlayers[2]?.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Award className="w-8 h-8 text-warning mx-auto" />
                  </div>
                  <h3 className="font-racing text-lg">{topPlayers[2]?.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTab === 'overall' && formatTime(topPlayers[2]?.best_time)}
                    {selectedTab === 'wins' && `${topPlayers[2]?.wins} wins`}
                    {selectedTab === 'races' && `${topPlayers[2]?.total_races} races`}
                    {selectedTab === 'winrate' && getWinRate(topPlayers[2]?.wins, topPlayers[2]?.total_races)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Full Leaderboard */}
          <Card className="racing-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Rankings
              </CardTitle>
              <CardDescription>
                {selectedTab === 'overall' && 'Ranked by best lap time'}
                {selectedTab === 'wins' && 'Ranked by total victories'}
                {selectedTab === 'races' && 'Ranked by races completed'}
                {selectedTab === 'winrate' && 'Ranked by win percentage'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPlayers.map((player, index) => {
                  const position = index + 1
                  const isCurrentUser = player.id === currentUserId
                  
                  return (
                    <motion.div
                      key={player.id}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {getRankIcon(position)}
                          <Badge variant={getRankBadge(position)}>#{position}</Badge>
                        </div>
                        
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={player.avatar_url} />
                          <AvatarFallback>{player.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{player.username}</p>
                            {isCurrentUser && <Star className="w-4 h-4 text-accent" />}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {player.total_races} races • {player.wins} wins
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-mono font-bold">
                          {selectedTab === 'overall' && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(player.best_time)}
                            </div>
                          )}
                          {selectedTab === 'wins' && (
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4" />
                              {player.wins}
                            </div>
                          )}
                          {selectedTab === 'races' && (
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {player.total_races}
                            </div>
                          )}
                          {selectedTab === 'winrate' && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {getWinRate(player.wins, player.total_races)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              
              {topPlayers.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
                  <p className="text-muted-foreground">Be the first to set a record!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}