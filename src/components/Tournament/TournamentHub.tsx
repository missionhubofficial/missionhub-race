import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase, Tournament, createTournament, joinTournament } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Trophy, Users, Clock, DollarSign, Plus, Calendar, MapPin, Award } from 'lucide-react'

interface TournamentHubProps {
  userId: string
  onJoinTournament: (tournament: Tournament) => void
}

export const TournamentHub: React.FC<TournamentHubProps> = ({ userId, onJoinTournament }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    maxParticipants: 16,
    entryFee: 0,
    prizePool: 0,
    startTime: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchTournaments()
    
    // Subscribe to real-time tournament updates
    const subscription = supabase
      .channel('tournaments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tournaments' },
        () => fetchTournaments()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTournaments(data || [])
    } catch (error) {
      console.error('Error fetching tournaments:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tournaments"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const tournament = {
        ...newTournament,
        created_by: userId,
        status: 'upcoming' as const,
        participants: [],
        bracket: {},
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from start
      }

      const { data, error } = await createTournament(tournament)

      if (error) throw error

      toast({
        title: "Tournament Created!",
        description: `${tournament.name} has been created successfully`
      })

      setNewTournament({
        name: '',
        description: '',
        maxParticipants: 16,
        entryFee: 0,
        prizePool: 0,
        startTime: '',
      })

      fetchTournaments()
    } catch (error) {
      console.error('Error creating tournament:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create tournament"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleJoinTournament = async (tournament: Tournament) => {
    try {
      if (tournament.participants.includes(userId)) {
        toast({
          title: "Already Joined",
          description: "You're already registered for this tournament"
        })
        return
      }

      if (tournament.participants.length >= tournament.max_participants) {
        toast({
          variant: "destructive",
          title: "Tournament Full",
          description: "This tournament has reached maximum capacity"
        })
        return
      }

      const { error } = await joinTournament(tournament.id, userId)

      if (error) throw error

      toast({
        title: "Joined Tournament!",
        description: `You've successfully joined ${tournament.name}`
      })

      onJoinTournament(tournament)
      fetchTournaments()
    } catch (error) {
      console.error('Error joining tournament:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join tournament"
      })
    }
  }

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'secondary'
      case 'active': return 'default'
      case 'completed': return 'outline'
      default: return 'outline'
    }
  }

  const getTimeUntilStart = (startTime: string) => {
    const now = new Date()
    const start = new Date(startTime)
    const diff = start.getTime() - now.getTime()
    
    if (diff <= 0) return 'Started'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-pulse-glow text-primary text-4xl mb-4">🏆</div>
          <p className="text-lg font-racing">Loading Tournaments...</p>
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
        <h2 className="text-3xl font-racing text-racing-gradient mb-4">Tournament Hub</h2>
        <p className="text-muted-foreground">Compete in structured tournaments and climb the rankings</p>
      </motion.div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Tournaments</TabsTrigger>
          <TabsTrigger value="create">Create Tournament</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Active Tournaments */}
          <div className="space-y-4">
            <h3 className="text-xl font-racing flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Available Tournaments
            </h3>
            
            {tournaments.length === 0 ? (
              <Card className="game-panel text-center py-12">
                <CardContent>
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tournaments Available</h3>
                  <p className="text-muted-foreground mb-4">Be the first to create a tournament!</p>
                  <Button onClick={() => (document.querySelector('[value="create"]') as HTMLElement)?.click()}>
                    Create Tournament
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tournaments.map((tournament, index) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="racing-card">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-racing">{tournament.name}</CardTitle>
                            <CardDescription>{tournament.description}</CardDescription>
                          </div>
                          <Badge variant={getTournamentStatusColor(tournament.status)}>
                            {tournament.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <span>{tournament.participants.length}/{tournament.max_participants}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{getTimeUntilStart(tournament.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span>${tournament.entry_fee}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-accent" />
                            <span>${tournament.prize_pool}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            className="racing-button flex-1"
                            onClick={() => handleJoinTournament(tournament)}
                            disabled={
                              tournament.status !== 'upcoming' ||
                              tournament.participants.includes(userId) ||
                              tournament.participants.length >= tournament.max_participants
                            }
                          >
                            {tournament.participants.includes(userId) 
                              ? 'Joined' 
                              : tournament.participants.length >= tournament.max_participants
                              ? 'Full'
                              : 'Join Tournament'
                            }
                          </Button>
                          <Button variant="outline">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="racing-card">
              <CardHeader>
                <CardTitle className="text-xl font-racing flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Tournament
                </CardTitle>
                <CardDescription>Set up your own racing tournament</CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleCreateTournament} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tournament Name</Label>
                      <Input
                        id="name"
                        value={newTournament.name}
                        onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                        placeholder="Epic Racing Championship"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxParticipants">Max Participants</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        min="4"
                        max="64"
                        step="4"
                        value={newTournament.maxParticipants}
                        onChange={(e) => setNewTournament({...newTournament, maxParticipants: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newTournament.description}
                      onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                      placeholder="A thrilling racing tournament for all skill levels"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entryFee">Entry Fee ($)</Label>
                      <Input
                        id="entryFee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newTournament.entryFee}
                        onChange={(e) => setNewTournament({...newTournament, entryFee: parseFloat(e.target.value)})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prizePool">Prize Pool ($)</Label>
                      <Input
                        id="prizePool"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newTournament.prizePool}
                        onChange={(e) => setNewTournament({...newTournament, prizePool: parseFloat(e.target.value)})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={newTournament.startTime}
                        onChange={(e) => setNewTournament({...newTournament, startTime: e.target.value})}
                        min={new Date().toISOString().slice(0, 16)}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full racing-button"
                    disabled={creating}
                  >
                    {creating ? 'Creating Tournament...' : 'Create Tournament'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}