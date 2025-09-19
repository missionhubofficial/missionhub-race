import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Phaser from 'phaser'
import { Button } from '@/components/ui/button'
import { socketManager } from '@/lib/socket'
import { useToast } from '@/hooks/use-toast'
import { Pause, Play, RotateCcw, Settings } from 'lucide-react'

interface GameCanvasProps {
  gameMode: 'single' | 'multiplayer'
  onGameEnd?: (results: any) => void
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameMode, onGameEnd }) => {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [gameLoaded, setGameLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!gameRef.current) return

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth > 768 ? 1024 : window.innerWidth - 32,
      height: window.innerHeight > 768 ? 576 : window.innerHeight - 200,
      parent: gameRef.current,
      backgroundColor: '#0a0a0a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    }

    // Initialize Phaser game
    phaserGameRef.current = new Phaser.Game(config)

    // Connect to multiplayer if needed
    if (gameMode === 'multiplayer') {
      socketManager.connect()
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true)
        phaserGameRef.current = null
      }
    }
  }, [gameMode])

  // Game variables
  let player: Phaser.GameObjects.Rectangle
  let cursors: Phaser.Types.Input.Keyboard.CursorKeys
  let aiCars: Phaser.GameObjects.Rectangle[] = []
  let raceStarted = false
  let raceTime = 0
  let checkpoints: Phaser.GameObjects.Rectangle[] = []
  let currentCheckpoint = 0
  let lapCount = 0
  let maxLaps = 3

  function preload(this: Phaser.Scene) {
    // Create simple colored rectangles as placeholder sprites
    this.add.graphics()
      .fillStyle(0x0066ff)
      .fillRect(0, 0, 32, 16)
      .generateTexture('player-car', 32, 16)

    this.add.graphics()
      .fillStyle(0xff6600)
      .fillRect(0, 0, 32, 16)
      .generateTexture('ai-car', 32, 16)

    this.add.graphics()
      .fillStyle(0x00ff00)
      .fillRect(0, 0, 20, 20)
      .generateTexture('checkpoint', 20, 20)

    this.add.graphics()
      .fillStyle(0x666666)
      .fillRect(0, 0, 800, 20)
      .generateTexture('track-wall', 800, 20)
  }

  function create(this: Phaser.Scene) {
    const scene = this

    // Create track boundaries
    const walls = [
      scene.add.rectangle(400, 10, 800, 20, 0x666666), // Top wall
      scene.add.rectangle(400, 566, 800, 20, 0x666666), // Bottom wall
      scene.add.rectangle(10, 288, 20, 576, 0x666666), // Left wall
      scene.add.rectangle(790, 288, 20, 576, 0x666666), // Right wall
    ]

    walls.forEach(wall => {
      scene.physics.add.existing(wall, true)
    })

    // Create race track outline
    const graphics = scene.add.graphics()
    graphics.lineStyle(4, 0x444444)
    graphics.strokeRoundedRect(50, 50, 700, 476, 20)
    graphics.strokeRoundedRect(100, 100, 600, 376, 20)

    // Create finish line
    graphics.lineStyle(6, 0xffff00)
    graphics.lineBetween(100, 100, 100, 120)

    // Create checkpoints
    const checkpointPositions = [
      { x: 600, y: 100 },
      { x: 700, y: 288 },
      { x: 600, y: 476 },
      { x: 200, y: 476 },
      { x: 100, y: 288 },
    ]

    checkpointPositions.forEach((pos, index) => {
      const checkpoint = scene.add.rectangle(pos.x, pos.y, 20, 20, 0x00ff00)
      scene.physics.add.existing(checkpoint, true)
      checkpoints.push(checkpoint)
    })

    // Create player car
    player = scene.add.rectangle(120, 150, 32, 16, 0x0066ff)
    scene.physics.add.existing(player)
    
    // Set player physics properties
    const playerBody = player.body as Phaser.Physics.Arcade.Body
    playerBody.setCollideWorldBounds(true)
    playerBody.setDrag(100)
    playerBody.setMaxVelocity(300)

    // Create AI cars for single player mode
    if (gameMode === 'single') {
      for (let i = 0; i < 3; i++) {
        const aiCar = scene.add.rectangle(120, 180 + (i * 30), 32, 16, 0xff6600)
        scene.physics.add.existing(aiCar)
        const aiBody = aiCar.body as Phaser.Physics.Arcade.Body
        aiBody.setCollideWorldBounds(true)
        aiBody.setDrag(80)
        aiBody.setMaxVelocity(250)
        aiCars.push(aiCar)
      }
    }

    // Add collisions
    walls.forEach(wall => {
      scene.physics.add.collider(player, wall)
      aiCars.forEach(aiCar => {
        scene.physics.add.collider(aiCar, wall)
      })
    })

    // Add checkpoint detection
    checkpoints.forEach((checkpoint, index) => {
      scene.physics.add.overlap(player, checkpoint, () => {
        if (index === currentCheckpoint) {
          currentCheckpoint = (currentCheckpoint + 1) % checkpoints.length
          if (currentCheckpoint === 0) {
            lapCount++
            toast({
              title: `Lap ${lapCount} completed!`,
              description: `Time: ${(raceTime / 1000).toFixed(2)}s`,
            })
            
            if (lapCount >= maxLaps) {
              finishRace()
            }
          }
        }
      })
    })

    // Create controls
    cursors = scene.input.keyboard!.createCursorKeys()
    
    // Add WASD controls
    const wasd = scene.input.keyboard!.addKeys('W,S,A,D')

    // Mobile touch controls (handled in component)
    scene.input.addPointer(2)

    setGameLoaded(true)
    
    // Start race countdown
    setTimeout(() => {
      raceStarted = true
      toast({
        title: "Race Started!",
        description: "Go! Go! Go!",
      })
    }, 3000)
  }

  function update(this: Phaser.Scene, time: number, delta: number) {
    if (!raceStarted || isPaused) return

    raceTime += delta

    // Player controls
    const playerBody = player.body as Phaser.Physics.Arcade.Body
    
    if (cursors.left.isDown) {
      player.rotation -= 0.1
    }
    if (cursors.right.isDown) {
      player.rotation += 0.1
    }
    if (cursors.up.isDown) {
      const thrustX = Math.cos(player.rotation - Math.PI / 2) * 300
      const thrustY = Math.sin(player.rotation - Math.PI / 2) * 300
      playerBody.setVelocity(thrustX, thrustY)
    }
    if (cursors.down.isDown) {
      const brakeX = Math.cos(player.rotation - Math.PI / 2) * -150
      const brakeY = Math.sin(player.rotation - Math.PI / 2) * -150
      playerBody.setVelocity(brakeX, brakeY)
    }

    // Simple AI for single player mode
    if (gameMode === 'single') {
      aiCars.forEach((aiCar, index) => {
        const aiBody = aiCar.body as Phaser.Physics.Arcade.Body
        const targetCheckpoint = checkpoints[currentCheckpoint]
        
        // AI moves towards next checkpoint
        const angle = Phaser.Math.Angle.Between(aiCar.x, aiCar.y, targetCheckpoint.x, targetCheckpoint.y)
        aiCar.rotation = angle + Math.PI / 2
        
        const speed = 200 + (index * 20) // Different speeds for each AI
        const thrustX = Math.cos(angle) * speed
        const thrustY = Math.sin(angle) * speed
        aiBody.setVelocity(thrustX, thrustY)
      })
    }

    // Send position to multiplayer server
    if (gameMode === 'multiplayer' && socketManager.connected) {
      socketManager.sendPlayerPosition('current-race', {
        x: player.x,
        y: player.y,
        rotation: player.rotation,
        speed: Math.sqrt(playerBody.velocity.x ** 2 + playerBody.velocity.y ** 2)
      })
    }
  }

  function finishRace() {
    raceStarted = false
    const finalTime = raceTime / 1000

    toast({
      title: "Race Finished!",
      description: `Final time: ${finalTime.toFixed(2)} seconds`,
    })

    if (onGameEnd) {
      onGameEnd({
        time: finalTime,
        laps: lapCount,
        position: 1, // Would be calculated based on other players
      })
    }

    if (gameMode === 'multiplayer') {
      socketManager.finishRace('current-race', finalTime)
    }
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
    if (phaserGameRef.current) {
      if (isPaused) {
        phaserGameRef.current.scene.resume('default')
      } else {
        phaserGameRef.current.scene.pause('default')
      }
    }
  }

  const handleRestart = () => {
    if (phaserGameRef.current) {
      phaserGameRef.current.scene.getScene('default')?.scene.restart()
    }
    setIsPaused(false)
    raceStarted = false
    raceTime = 0
    currentCheckpoint = 0
    lapCount = 0
  }

  return (
    <div className="relative w-full">
      {/* Game Canvas */}
      <motion.div
        ref={gameRef}
        className="border-2 border-primary rounded-lg shadow-racing mx-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        id="phaser-game"
      />

      {/* Game Controls */}
      <motion.div
        className="absolute top-4 right-4 flex gap-2"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={handlePause}
          className="bg-card/80 backdrop-blur-sm"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRestart}
          className="bg-card/80 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Race HUD */}
      {gameLoaded && (
        <motion.div
          className="absolute top-4 left-4 game-panel"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-sm font-mono space-y-1">
            <div>Lap: {lapCount}/{maxLaps}</div>
            <div>Time: {(raceTime / 1000).toFixed(1)}s</div>
            <div>Mode: {gameMode}</div>
            {gameMode === 'multiplayer' && (
              <div className={`text-xs ${socketManager.connected ? 'text-success' : 'text-destructive'}`}>
                {socketManager.connected ? 'Connected' : 'Disconnected'}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Mobile Controls */}
      <div className="mobile-controls md:hidden">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="control-button"
              onTouchStart={() => {
                if (phaserGameRef.current?.scene.isActive('default')) {
                  const scene = phaserGameRef.current.scene.getScene('default')
                  // Simulate up key press
                }
              }}
            >
              ↑
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="control-button">←</Button>
              <Button variant="outline" className="control-button">↓</Button>
              <Button variant="outline" className="control-button">→</Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="control-button text-destructive">
              BRAKE
            </Button>
            <Button variant="outline" className="control-button text-success">
              BOOST
            </Button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {!gameLoaded && (
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <div className="animate-pulse-glow text-primary text-2xl mb-4">🏎️</div>
            <p className="text-lg font-racing">Loading Race Track...</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}