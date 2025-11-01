import React, { useCallback, useEffect, useRef, useState } from 'react'
import './HorseRacing.css'

// Components
import RaceArena from './components/RaceArena'
import RaceHeader from './components/RaceHeader'
import RaceSettings from './components/RaceSettings'
import HorseList from './components/HorseList'
import HorseEditor from './components/HorseEditor'
import RaceResults from './components/RaceResults'

// Utilities
import { saveConfig, loadConfig } from './utils/configStorage'
import { mkHorse, randomColor, lcg } from './utils/raceHelpers'
import { loadHorseImages, loadAvatarImage } from './utils/assetLoader'

// Sound effects
import raceStartSound from './sounds/race_start.mp3'
import backgroundMusic from './sounds/background.mp3'

// Constants
import {
  DEFAULT_LAP_LENGTH,
  DEFAULT_LAPS,
  DEFAULT_RACE_NAME,
  DEFAULT_COUNTDOWN,
  DEFAULT_ARENA_HEIGHT,
  DEFAULT_TRACK_THICKNESS,
  DEFAULT_SPRITE_SCALE,
  DEFAULT_HORSES,
  RACE_STATUS,
  VARIANCE_MULTIPLIER,
  FATIGUE_MULTIPLIER,
  MIN_SPEED,
  SPRINT_THRESHOLD,
  STUMBLE_THRESHOLD,
  SPRINT_BOOST,
  STUMBLE_PENALTY
} from './constants'

/**
 * HorseRacing Main Component
 * Orchestrates the horse racing game with race management, animation, and state
 */
const HorseRacing = () => {
  // Track & race settings
  const [lapLengthPx, setLapLengthPx] = useState(DEFAULT_LAP_LENGTH)
  const [laps, setLaps] = useState(DEFAULT_LAPS)
  const [raceName] = useState(DEFAULT_RACE_NAME)
  const [countdown, setCountdown] = useState(DEFAULT_COUNTDOWN)

  // Display controls
  const [arenaHeight, setArenaHeight] = useState(DEFAULT_ARENA_HEIGHT)
  const [trackThicknessUi, setTrackThicknessUi] = useState(
    DEFAULT_TRACK_THICKNESS
  )
  const [spriteScaleDefault, setSpriteScaleDefault] =
    useState(DEFAULT_SPRITE_SCALE)

  // Initialize horses with saved config or defaults
  const [horses, setHorses] = useState(() => {
    const savedConfig = loadConfig()
    const availableImages = loadHorseImages()

    if (savedConfig && savedConfig.length > 0) {
      return savedConfig.map((cfg) => {
        let imgSrc = cfg.imgSrc
        if (cfg.imgFileName) {
          const match = availableImages.find(
            (img) => img.label === cfg.imgFileName
          )
          if (match) imgSrc = match.src
        }
        return {
          ...cfg,
          imgSrc,
          progress: 0,
          finishedAtMs: null
        }
      })
    }

    // Default horses
    return DEFAULT_HORSES.map((cfg) => ({
      ...mkHorse(cfg.name, cfg.color),
      imgSrc: loadAvatarImage(cfg.fileName),
      imgFileName: cfg.fileName
    }))
  })

  const [status, setStatus] = useState(RACE_STATUS.IDLE)
  const [startTime, setStartTime] = useState(null)
  const [audioEnabled, setAudioEnabled] = useState(false)

  // Audio refs
  const raceStartAudioRef = useRef(null)
  const backgroundMusicRef = useRef(null)
  const baseBackgroundVolume = 0.15 // 15% base volume for background music
  const racingBackgroundVolume = 0.25 // 25% volume during race (10% louder)

  // Initialize audio on mount
  useEffect(() => {
    console.log('🎵 Initializing audio...')

    // Race start sound
    raceStartAudioRef.current = new Audio(raceStartSound)
    raceStartAudioRef.current.volume = 0.5 // 50% volume for race start
    console.log('✅ Race start sound loaded')

    // Background music - loop and autoplay
    backgroundMusicRef.current = new Audio(backgroundMusic)
    backgroundMusicRef.current.volume = baseBackgroundVolume
    backgroundMusicRef.current.loop = true // Infinite loop
    console.log('✅ Background music loaded, attempting autoplay...')

    // Try to start background music
    const playPromise = backgroundMusicRef.current.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Background music playing automatically!')
          setAudioEnabled(true)
        })
        .catch((err) => {
          console.warn(
            '⚠️ Background music autoplay blocked by browser:',
            err.message
          )
          console.log('💡 Click anywhere on the page to enable audio')
          setAudioEnabled(false)
        })
    }

    // Cleanup on unmount
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
        backgroundMusicRef.current = null
      }
    }
  }, [])

  // Try to start audio on first user interaction
  useEffect(() => {
    const enableAudio = () => {
      if (!audioEnabled && backgroundMusicRef.current) {
        console.log(
          '🖱️ User interaction detected, starting background music...'
        )
        backgroundMusicRef.current
          .play()
          .then(() => {
            console.log('✅ Background music started!')
            setAudioEnabled(true)
          })
          .catch((err) => {
            console.error('❌ Failed to start background music:', err)
          })
      }
    }

    // Listen for any user interaction
    document.addEventListener('click', enableAudio, { once: true })
    document.addEventListener('keydown', enableAudio, { once: true })

    return () => {
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
    }
  }, [audioEnabled])

  // Derived values
  const totalDistance = lapLengthPx * laps
  const finishedCount = horses.filter((h) => h.finishedAtMs != null).length

  // Animation loop
  useEffect(() => {
    if (status !== RACE_STATUS.RUNNING) return

    let raf = 0
    let last = performance.now()

    const tick = () => {
      const now = performance.now()
      const dt = (now - last) / 1000 // seconds
      last = now

      setHorses((curr) =>
        curr.map((h) => {
          if (h.finishedAtMs != null) return h
          const rand = lcg(h.rngSeed + Math.floor(h.progress / 20))

          // Base + micro-variance noise
          const noise = (rand() - 0.5) * 2 * h.variance * VARIANCE_MULTIPLIER

          // Fatigue grows after stamina seconds
          const t = (now - (startTime || now)) / 1000
          const fatigue = Math.max(0, (t - h.stamina) * FATIGUE_MULTIPLIER)

          // Occasional sprint or stumble events (rare, deterministic)
          // Only apply random events if variance > 0
          const eventR = rand()
          let eventBoost = 0
          if (h.variance > 0) {
            if (eventR > SPRINT_THRESHOLD) eventBoost = SPRINT_BOOST
            else if (eventR < STUMBLE_THRESHOLD) eventBoost = STUMBLE_PENALTY
          }

          const speed = Math.max(
            MIN_SPEED,
            h.baseSpeed + noise + eventBoost - fatigue
          )
          const newProgress = h.progress + speed * dt

          if (newProgress >= totalDistance) {
            return {
              ...h,
              progress: totalDistance,
              finishedAtMs: now - (startTime || now)
            }
          }
          return { ...h, progress: newProgress }
        })
      )

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [status, startTime, totalDistance])

  const go = useCallback(() => {
    setStartTime(performance.now())
    setStatus(RACE_STATUS.RUNNING)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (status !== RACE_STATUS.COUNTDOWN) return
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id)
          go()
          return DEFAULT_COUNTDOWN
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [status, go])

  const startCountdown = useCallback(() => {
    if (status === RACE_STATUS.RUNNING) return

    // Play race start sound immediately
    if (raceStartAudioRef.current) {
      raceStartAudioRef.current.currentTime = 0 // Reset to start

      raceStartAudioRef.current.play().catch((err) => {
        // Handle autoplay restrictions gracefully
        console.log('Audio play prevented:', err)
      })

      // When race start sound ends, increase background music volume
      raceStartAudioRef.current.onended = () => {
        if (backgroundMusicRef.current) {
          // Smoothly transition to louder volume
          const fadeSteps = 20
          const volumeIncrement =
            (racingBackgroundVolume - baseBackgroundVolume) / fadeSteps
          let step = 0

          const fadeInterval = setInterval(() => {
            if (step >= fadeSteps || !backgroundMusicRef.current) {
              clearInterval(fadeInterval)
              return
            }
            backgroundMusicRef.current.volume = Math.min(
              racingBackgroundVolume,
              baseBackgroundVolume + volumeIncrement * step
            )
            step++
          }, 50) // 50ms intervals = 1 second total fade
        }
      }
    }

    // reset race
    setHorses((curr) =>
      curr.map((h) => ({
        ...h,
        progress: 0,
        finishedAtMs: undefined,
        rngSeed: Math.floor(Math.random() * 1e9)
      }))
    )

    // Start countdown with 300ms delay
    setTimeout(() => {
      setStatus(RACE_STATUS.COUNTDOWN)
    }, 300)
  }, [status, baseBackgroundVolume, racingBackgroundVolume])

  const stop = () => setStatus(RACE_STATUS.FINISHED)

  // Auto-finish race when all horses complete
  useEffect(() => {
    if (
      status === RACE_STATUS.RUNNING &&
      finishedCount === horses.length &&
      horses.length > 0
    ) {
      setStatus(RACE_STATUS.FINISHED)

      // Lower background music volume back to base when race finishes
      if (backgroundMusicRef.current) {
        const fadeSteps = 20
        const volumeDecrement =
          (racingBackgroundVolume - baseBackgroundVolume) / fadeSteps
        let step = 0

        const fadeInterval = setInterval(() => {
          if (step >= fadeSteps || !backgroundMusicRef.current) {
            clearInterval(fadeInterval)
            if (backgroundMusicRef.current) {
              backgroundMusicRef.current.volume = baseBackgroundVolume
            }
            return
          }
          backgroundMusicRef.current.volume = Math.max(
            baseBackgroundVolume,
            racingBackgroundVolume - volumeDecrement * step
          )
          step++
        }, 50) // 50ms intervals = 1 second total fade
      }

      // Update win statistics
      const winner = horses.reduce((best, h) => {
        if (!h.finishedAtMs) return best
        if (!best || h.finishedAtMs < best.finishedAtMs) return h
        return best
      }, null)

      if (winner) {
        setHorses((curr) =>
          curr.map((h) => ({
            ...h,
            races: (h.races || 0) + 1,
            wins: h.id === winner.id ? (h.wins || 0) + 1 : h.wins || 0,
            totalTime: (h.totalTime || 0) + (h.finishedAtMs || 0)
          }))
        )
      }
    }
  }, [
    finishedCount,
    status,
    horses.length,
    horses,
    baseBackgroundVolume,
    racingBackgroundVolume
  ])

  // Auto-save horses to localStorage whenever they change
  useEffect(() => {
    saveConfig(horses)
  }, [horses])

  // Keyboard shortcuts: Space -> start race, '+' -> add horse, '-' -> remove last
  useEffect(() => {
    const isTypingTarget = (el) => {
      if (!el) return false
      const tag = (el.tagName || '').toLowerCase()
      return (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        el.isContentEditable
      )
    }

    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return

      // Space to start (only when idle or finished)
      if (e.code === 'Space' || e.key === ' ') {
        if (status === RACE_STATUS.IDLE || status === RACE_STATUS.FINISHED) {
          e.preventDefault()
          startCountdown()
        }
        return
      }

      // '+' to add a horse (support numpad add)
      if (e.key === '+' || e.code === 'NumpadAdd') {
        e.preventDefault()
        setHorses((hs) => [
          ...hs,
          mkHorse(`New Horse ${hs.length + 1}`, randomColor())
        ])
        return
      }

      // '-' to remove last horse (support numpad subtract)
      if (e.key === '-' || e.code === 'NumpadSubtract') {
        e.preventDefault()
        setHorses((hs) => (hs.length > 0 ? hs.slice(0, -1) : hs))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [status, startCountdown])

  const handleAddHorse = (newHorse) => {
    setHorses((hs) => [...hs, newHorse])
  }

  const handleRemoveHorse = (horseId) => {
    setHorses((hs) => hs.filter((x) => x.id !== horseId))
  }

  return (
    <div className="horse-racing">
      <div className="horse-racing-inner">
        <div className="horse-layout">
          <div className="horse-col-left">
            <div className="horse-arena">
              <RaceArena
                horses={horses}
                totalDistance={totalDistance}
                status={status}
                countdown={countdown}
                lapLengthPx={lapLengthPx}
                laps={laps}
                arenaHeight={arenaHeight}
                trackThickness={trackThicknessUi}
                spriteScaleDefault={spriteScaleDefault}
              />
            </div>

            <div className="horse-panels">
              <HorseList horses={horses} onRemove={handleRemoveHorse} />
              <HorseEditor horses={horses} onChange={setHorses} />
            </div>
          </div>

          <div className="horse-col-right">
            <RaceHeader
              raceName={raceName}
              status={status}
              onStartRace={startCountdown}
              onStopRace={stop}
              onAddHorse={handleAddHorse}
              horses={horses}
              onHorsesChange={setHorses}
            />

            <RaceSettings
              laps={laps}
              onLapsChange={setLaps}
              lapLengthPx={lapLengthPx}
              onLapLengthChange={setLapLengthPx}
              status={status}
              arenaHeight={arenaHeight}
              onArenaHeightChange={setArenaHeight}
              trackThickness={trackThicknessUi}
              onTrackThicknessChange={setTrackThicknessUi}
              spriteScale={spriteScaleDefault}
              onSpriteScaleChange={setSpriteScaleDefault}
            />

            <RaceResults horses={horses} status={status} />

            <div className="horse-tip">
              💡 Tip: Press <strong>F</strong> for fullscreen · Press{' '}
              <strong>Space</strong> to start race · <strong>+</strong>/
              <strong>-</strong> to add/remove horses
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HorseRacing
