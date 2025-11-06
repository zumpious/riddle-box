import React, { useEffect, useState, useRef } from 'react'
import RaceArena from './components/RaceArena'
import './PresenterView.css'

/**
 * PresenterView - Fullscreen race view for second screen
 * Receives all state updates via BroadcastChannel from main control window
 * This view is read-only - all controls happen in the main window
 */
const PresenterView = () => {
  // State mirrored from main window
  const [horses, setHorses] = useState([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [status, setStatus] = useState('idle')
  const [countdown, setCountdown] = useState(3)
  const [lapLengthPx, setLapLengthPx] = useState(1600)
  const [laps, setLaps] = useState(3)
  const [arenaHeight, setArenaHeight] = useState(840)
  const [trackThickness, setTrackThickness] = useState(235)
  const [spriteScaleDefault, setSpriteScaleDefault] = useState(4.4)
  const [startTime, setStartTime] = useState(null)
  const [introductionIndex, setIntroductionIndex] = useState(0)
  const [introductionComplete, setIntroductionComplete] = useState(false)
  const [introNavDirection, setIntroNavDirection] = useState('right')
  const [puddles, setPuddles] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  const channelRef = useRef(null)

  // Initialize BroadcastChannel to listen for state updates
  useEffect(() => {
    console.log('🖥️ Presenter View: Initializing BroadcastChannel...')

    const channel = new BroadcastChannel('horse_racing_sync')
    channelRef.current = channel

    // Request initial state from main window
    console.log('📡 Requesting initial state from main window...')
    channel.postMessage({ type: 'REQUEST_INITIAL_STATE' })

    // Listen for state updates from main window
    channel.onmessage = (event) => {
      const { type, payload } = event.data

      switch (type) {
        case 'STATE_UPDATE':
          // Full state sync
          console.log('📥 Received state update:', payload)
          setHorses(payload.horses || [])
          setTotalDistance(payload.totalDistance || 0)
          setStatus(payload.status || 'idle')
          setCountdown(payload.countdown || 3)
          setLapLengthPx(payload.lapLengthPx || 1600)
          setLaps(payload.laps || 3)
          setArenaHeight(payload.arenaHeight || 840)
          setTrackThickness(payload.trackThickness || 235)
          setSpriteScaleDefault(payload.spriteScaleDefault || 4.4)
          setStartTime(payload.startTime || null)
          setIntroductionIndex(payload.introductionIndex || 0)
          setIntroductionComplete(payload.introductionComplete || false)
          setIntroNavDirection(payload.introNavDirection || 'right')
          setPuddles(payload.puddles || [])
          setIsConnected(true)
          break

        case 'INITIAL_STATE':
          // Same as STATE_UPDATE but marks as initial connection
          console.log('🎯 Received initial state:', payload)
          setHorses(payload.horses || [])
          setTotalDistance(payload.totalDistance || 0)
          setStatus(payload.status || 'idle')
          setCountdown(payload.countdown || 3)
          setLapLengthPx(payload.lapLengthPx || 1600)
          setLaps(payload.laps || 3)
          setArenaHeight(payload.arenaHeight || 840)
          setTrackThickness(payload.trackThickness || 235)
          setSpriteScaleDefault(payload.spriteScaleDefault || 4.4)
          setStartTime(payload.startTime || null)
          setIntroductionIndex(payload.introductionIndex || 0)
          setIntroductionComplete(payload.introductionComplete || false)
          setIntroNavDirection(payload.introNavDirection || 'right')
          setPuddles(payload.puddles || [])
          setIsConnected(true)
          break

        default:
          console.log('⚠️ Unknown message type:', type)
      }
    }

    // Cleanup
    return () => {
      console.log('🔌 Closing BroadcastChannel')
      channel.close()
    }
  }, [])

  // Auto-enter fullscreen on load
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen()
        console.log('✅ Entered fullscreen mode')
      } catch (err) {
        console.log('⚠️ Could not enter fullscreen:', err)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(enterFullscreen, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="presenter-view">
      {/* Connection indicator - only shown briefly */}
      {!isConnected && (
        <div className="presenter-connection-status">
          <div className="presenter-connection-badge">
            <div className="spinner"></div>
            <span>Waiting for connection from control window...</span>
          </div>
        </div>
      )}

      {/* Main arena - always visible */}
      <div className="presenter-arena-container">
        <RaceArena
          horses={horses}
          totalDistance={totalDistance}
          status={status}
          countdown={countdown}
          lapLengthPx={lapLengthPx}
          laps={laps}
          arenaHeight={arenaHeight}
          trackThickness={trackThickness}
          spriteScaleDefault={spriteScaleDefault}
          startTime={startTime}
          introductionIndex={introductionIndex}
          introductionComplete={introductionComplete}
          introNavDirection={introNavDirection}
          puddles={puddles}
        />
      </div>

      {/* Presenter mode indicator (subtle) */}
      <div className="presenter-indicator">📺 Presenter Mode</div>
    </div>
  )
}

export default PresenterView
