import { io, Socket } from 'socket.io-client'

class SocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(userId?: string) {
    if (this.socket?.connected) return

    // Use demo socket server or your actual server
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001'
    
    this.socket = io(serverUrl, {
      auth: {
        userId
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Connected to game server')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game server')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.reconnectAttempts++
    })

    this.socket.on('reconnect', () => {
      console.log('Reconnected to game server')
    })
  }

  // Room management
  joinRoom(roomId: string) {
    this.socket?.emit('join-room', roomId)
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave-room', roomId)
  }

  // Multiplayer race events
  createRace(raceConfig: any) {
    this.socket?.emit('create-race', raceConfig)
  }

  joinRace(raceId: string) {
    this.socket?.emit('join-race', raceId)
  }

  startRace(raceId: string) {
    this.socket?.emit('start-race', raceId)
  }

  sendPlayerPosition(raceId: string, position: { x: number; y: number; rotation: number; speed: number }) {
    this.socket?.emit('player-position', { raceId, position })
  }

  finishRace(raceId: string, time: number) {
    this.socket?.emit('race-finish', { raceId, time })
  }

  // Tournament events
  createTournament(tournamentData: any) {
    this.socket?.emit('create-tournament', tournamentData)
  }

  joinTournament(tournamentId: string) {
    this.socket?.emit('join-tournament', tournamentId)
  }

  // Event listeners
  onRaceCreated(callback: (race: any) => void) {
    this.socket?.on('race-created', callback)
  }

  onRaceJoined(callback: (data: any) => void) {
    this.socket?.on('race-joined', callback)
  }

  onRaceStarted(callback: (data: any) => void) {
    this.socket?.on('race-started', callback)
  }

  onPlayerPositionUpdate(callback: (data: any) => void) {
    this.socket?.on('player-position-update', callback)
  }

  onRaceFinished(callback: (data: any) => void) {
    this.socket?.on('race-finished', callback)
  }

  onTournamentUpdate(callback: (tournament: any) => void) {
    this.socket?.on('tournament-update', callback)
  }

  // Cleanup
  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  removeAllListeners() {
    this.socket?.removeAllListeners()
  }

  get connected() {
    return this.socket?.connected || false
  }

  get id() {
    return this.socket?.id
  }
}

export const socketManager = new SocketManager()