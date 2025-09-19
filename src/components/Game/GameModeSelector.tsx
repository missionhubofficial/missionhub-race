import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Users, Trophy, Bot, Wifi, WifiOff } from 'lucide-react'

interface GameModeSelectorProps {
  onModeSelect: (mode: 'single' | 'multiplayer' | 'tournament') => void
  isConnected: boolean
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onModeSelect, isConnected }) => {
  const gameModes = [
    {
      id: 'single',
      title: 'Single Player',
      description: 'Race against AI opponents in various difficulty levels',
      icon: User,
      features: ['AI Opponents', 'Multiple Tracks', 'Practice Mode', 'Offline Play'],
      color: 'primary',
      available: true
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer Race',
      description: 'Challenge real players in real-time racing battles',
      icon: Users,
      features: ['Real-time Racing', 'Global Players', 'Voice Chat', 'Live Leaderboard'],
      color: 'secondary',
      available: isConnected
    },
    {
      id: 'tournament',
      title: 'Tournament',
      description: 'Compete in structured tournaments with prizes',
      icon: Trophy,
      features: ['Bracket System', 'Prize Pools', 'Ranking System', 'Scheduled Events'],
      color: 'accent',
      available: isConnected
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-racing text-racing-gradient mb-4">Choose Your Racing Mode</h2>
        <p className="text-muted-foreground">Select how you want to experience the thrill of racing</p>
        
        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-success" />
              <span className="text-sm text-success">Online - All modes available</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-warning" />
              <span className="text-sm text-warning">Offline - Limited modes available</span>
            </>
          )}
        </div>
      </motion.div>

      {/* Game Mode Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {gameModes.map((mode, index) => {
          const Icon = mode.icon
          
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`racing-card h-full ${!mode.available ? 'opacity-50' : ''}`}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-racing flex items-center justify-center gap-2">
                    {mode.title}
                    {!mode.available && <Badge variant="outline">Offline</Badge>}
                  </CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {mode.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className={!mode.available ? 'text-muted-foreground' : ''}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    className="w-full racing-button"
                    onClick={() => onModeSelect(mode.id as 'single' | 'multiplayer' | 'tournament')}
                    disabled={!mode.available}
                  >
                    {mode.available ? `Start ${mode.title}` : 'Coming Soon'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Additional Info */}
      <motion.div
        className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="game-panel">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Opponents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Our advanced AI provides challenging opponents with different racing styles and difficulty levels.
            </p>
          </CardContent>
        </Card>
        
        <Card className="game-panel">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Competitive Racing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Join tournaments, climb leaderboards, and prove you're the ultimate racing champion.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips */}
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Pro Tips 🏁</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Master cornering techniques to gain speed advantages</p>
            <p>• Use slipstream drafting in multiplayer races</p>
            <p>• Practice on different tracks to improve your lap times</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}