import React, { useCallback, useEffect, useState } from 'react'
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
    // reset race
    setHorses((curr) =>
      curr.map((h) => ({
        ...h,
        progress: 0,
        finishedAtMs: undefined,
        rngSeed: Math.floor(Math.random() * 1e9)
      }))
    )
    setStatus(RACE_STATUS.COUNTDOWN)
  }, [status])

  const stop = () => setStatus(RACE_STATUS.FINISHED)

  // Auto-finish race when all horses complete
  useEffect(() => {
    if (
      status === RACE_STATUS.RUNNING &&
      finishedCount === horses.length &&
      horses.length > 0
    ) {
      setStatus(RACE_STATUS.FINISHED)

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
  }, [finishedCount, status, horses.length, horses])

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
