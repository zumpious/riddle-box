import React, { useCallback, useEffect, useRef, useState } from 'react'
import './HorseRacing.css'

// Components
import RaceArena from './components/RaceArena'
import RaceHeader from './components/RaceHeader'
import RaceSettings from './components/RaceSettings'
import HorseList from './components/HorseList'
import HorseEditor from './components/HorseEditor'
import RaceResults from './components/RaceResults'
import CharacterManager from './components/CharacterManager'

// Utilities
import {
  saveCharacterRoster,
  loadCharacterRoster,
  saveSelectedCharacters,
  loadSelectedCharacters
} from './utils/characterStorage'
import {
  mkHorse,
  randomColor,
  lcg,
  getNextHorseNumber
} from './utils/raceHelpers'
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
  MIN_SPEED,
  SPRINT_THRESHOLD,
  STUMBLE_THRESHOLD,
  SPRINT_BOOST,
  STUMBLE_PENALTY,
  MAX_ENDURANCE,
  ENDURANCE_RECOVERY_RATE,
  RECOVERY_SPEED_MULTIPLIER
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

  // Character Roster System - permanent storage of all characters
  const [characterRoster, setCharacterRoster] = useState(() => {
    const savedRoster = loadCharacterRoster()
    const availableImages = loadHorseImages()

    if (savedRoster && savedRoster.length > 0) {
      // Migrate existing horses: assign numbers if they don't have them
      let nextNumber = 1
      return savedRoster.map((cfg) => {
        let imgSrc = cfg.imgSrc
        if (cfg.imgFileName) {
          const match = availableImages.find(
            (img) => img.label === cfg.imgFileName
          )
          if (match) imgSrc = match.src
        }

        // Assign number if missing (migration for existing horses)
        const number = cfg.number || nextNumber++

        return { ...cfg, imgSrc, number }
      })
    }

    // Initialize with default horses (with numbers 1, 2, ...)
    return DEFAULT_HORSES.map((cfg, index) => ({
      ...mkHorse(cfg.name, cfg.color, index + 1),
      imgSrc: loadAvatarImage(cfg.fileName),
      imgFileName: cfg.fileName,
      createdAt: Date.now()
    }))
  })

  // Selected characters for current race
  const [selectedCharacterIds, setSelectedCharacterIds] = useState(() => {
    const savedSelection = loadSelectedCharacters()
    if (savedSelection && savedSelection.length > 0) {
      return savedSelection
    }
    // By default, select all characters
    return characterRoster.map((c) => c.id)
  })

  // Horses in the current race (independent from roster during race)
  const [horses, setHorses] = useState(() => {
    // Initialize once on mount
    return characterRoster
      .filter((c) => selectedCharacterIds.includes(c.id))
      .map((c) => ({
        ...c,
        progress: 0,
        finishedAtMs: null,
        endurance: MAX_ENDURANCE,
        recovering: false,
        showingDust: false,
        dustTimer: 0
      }))
  })

  const [status, setStatus] = useState(RACE_STATUS.IDLE)
  const [startTime, setStartTime] = useState(null)
  const [audioEnabled, setAudioEnabled] = useState(false)

  // Introduction state
  const [introductionIndex, setIntroductionIndex] = useState(0)
  const [introductionComplete, setIntroductionComplete] = useState(false)
  const [introNavDirection, setIntroNavDirection] = useState('right') // 'right' or 'left'

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

          // Initialize endurance if not set
          let currentEndurance = h.endurance ?? MAX_ENDURANCE
          let isRecovering = h.recovering ?? false

          // Update endurance
          if (isRecovering) {
            // Recovering: regenerate endurance
            currentEndurance = Math.min(
              MAX_ENDURANCE,
              currentEndurance + ENDURANCE_RECOVERY_RATE * dt
            )
            // Exit recovery when fully restored
            if (currentEndurance >= MAX_ENDURANCE) {
              isRecovering = false
              currentEndurance = MAX_ENDURANCE
            }
          } else {
            // Running normally: deplete endurance based on stamina
            // Higher stamina = slower depletion (endurance lasts approximately h.stamina seconds)
            const depletionRate = MAX_ENDURANCE / h.stamina
            currentEndurance = Math.max(
              0,
              currentEndurance - depletionRate * dt
            )
            // Enter recovery when depleted
            if (currentEndurance <= 0) {
              isRecovering = true
              currentEndurance = 0
            }
          }

          // Base + micro-variance noise
          const noise = (rand() - 0.5) * 2 * h.variance * VARIANCE_MULTIPLIER

          // Occasional sprint or stumble events (rare, deterministic)
          // Only apply random events if variance > 0
          const eventR = rand()
          let eventBoost = 0
          if (h.variance > 0) {
            if (eventR > SPRINT_THRESHOLD) eventBoost = SPRINT_BOOST
            else if (eventR < STUMBLE_THRESHOLD) eventBoost = STUMBLE_PENALTY
          }

          // Dust animation logic (after eventBoost is calculated)
          // Initialize dust state
          let showingDust = h.showingDust ?? false
          let dustTimer = h.dustTimer ?? 0

          // Dust appears during acceleration/sprint events or randomly
          // Also trigger at race start (first few frames)
          const isRaceStart = h.progress < 50 // First 50 pixels
          const dustRoll = rand() // Use same RNG as events

          if (showingDust) {
            // Count down the dust display timer
            dustTimer -= dt
            if (dustTimer <= 0) {
              showingDust = false
              dustTimer = 0
            }
          } else {
            // Trigger dust on sprint, high speed changes, or randomly
            const shouldShowDust =
              isRaceStart || // Always show at start
              eventBoost > 0 || // Show on sprint boost
              dustRoll > 0.98 // Random 2% chance per frame to kick up dust

            if (shouldShowDust) {
              showingDust = true
              dustTimer = 1.2 // Show dust for 1.2 seconds (doubled)
            }
          }

          // Calculate base speed
          let speed = Math.max(MIN_SPEED, h.baseSpeed + noise + eventBoost)

          // Apply recovery penalty if recovering
          if (isRecovering) {
            speed = speed * RECOVERY_SPEED_MULTIPLIER
          }

          const newProgress = h.progress + speed * dt

          if (newProgress >= totalDistance) {
            return {
              ...h,
              progress: totalDistance,
              finishedAtMs: now - (startTime || now),
              endurance: currentEndurance,
              recovering: isRecovering,
              showingDust: false, // Stop dust when finished
              dustTimer: 0
            }
          }
          return {
            ...h,
            progress: newProgress,
            endurance: currentEndurance,
            recovering: isRecovering,
            showingDust: showingDust,
            dustTimer: dustTimer
          }
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

  // Introduction sequence - manual navigation with arrow keys (no auto-advance)
  useEffect(() => {
    if (status !== RACE_STATUS.INTRODUCTION) return
    if (horses.length === 0) return

    // If all horses have been introduced, mark as complete
    if (introductionIndex >= horses.length) {
      setIntroductionComplete(true)
      return
    }

    // No automatic timer - user controls with arrow keys
  }, [status, introductionIndex, horses.length])

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

  const startIntroduction = useCallback(() => {
    // Don't allow re-trigger during active race
    if (status === RACE_STATUS.RUNNING || status === RACE_STATUS.COUNTDOWN)
      return

    // Load fresh horses from roster based on current selection
    const selectedHorses = characterRoster
      .filter((c) => selectedCharacterIds.includes(c.id))
      .map((c) => ({
        ...c,
        progress: 0,
        finishedAtMs: undefined,
        rngSeed: Math.floor(Math.random() * 1e9),
        endurance: MAX_ENDURANCE,
        recovering: false,
        showingDust: false,
        dustTimer: 0
      }))
    setHorses(selectedHorses)

    // Reset introduction state
    setIntroductionIndex(0)
    setIntroductionComplete(false)

    // Start introduction phase
    setStatus(RACE_STATUS.INTRODUCTION)
  }, [status, characterRoster, selectedCharacterIds])

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

    // Load fresh horses from roster based on current selection (if not coming from intro)
    if (status !== RACE_STATUS.INTRODUCTION) {
      const selectedHorses = characterRoster
        .filter((c) => selectedCharacterIds.includes(c.id))
        .map((c) => ({
          ...c,
          progress: 0,
          finishedAtMs: undefined,
          rngSeed: Math.floor(Math.random() * 1e9),
          endurance: MAX_ENDURANCE,
          recovering: false,
          showingDust: false,
          dustTimer: 0
        }))
      setHorses(selectedHorses)
    }

    // Start countdown with 300ms delay
    setTimeout(() => {
      setStatus(RACE_STATUS.COUNTDOWN)
    }, 300)
  }, [
    status,
    baseBackgroundVolume,
    racingBackgroundVolume,
    characterRoster,
    selectedCharacterIds
  ])

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

  // Auto-save character roster whenever it changes
  useEffect(() => {
    saveCharacterRoster(characterRoster)
  }, [characterRoster])

  // Auto-save selection whenever it changes
  useEffect(() => {
    saveSelectedCharacters(selectedCharacterIds)
  }, [selectedCharacterIds])

  // Track previous selection to detect real changes
  const prevSelectionRef = useRef(selectedCharacterIds)

  // Sync horses with selection when selection changes (not racing)
  useEffect(() => {
    const prevSelection = prevSelectionRef.current
    const currentSelection = selectedCharacterIds

    // Check if selection actually changed (not just a re-render)
    const selectionChanged =
      prevSelection.length !== currentSelection.length ||
      prevSelection.some((id) => !currentSelection.includes(id)) ||
      currentSelection.some((id) => !prevSelection.includes(id))

    if (selectionChanged) {
      // Update the ref to track current selection
      prevSelectionRef.current = currentSelection

      // Only update horses when race is not actively running
      if (status === RACE_STATUS.IDLE || status === RACE_STATUS.FINISHED) {
        const updatedHorses = characterRoster
          .filter((c) => currentSelection.includes(c.id))
          .map((c) => ({
            ...c,
            progress: 0,
            finishedAtMs: null,
            endurance: MAX_ENDURANCE,
            recovering: false,
            showingDust: false,
            dustTimer: 0
          }))
        setHorses(updatedHorses)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacterIds, status])

  // Update character stats in roster after race finishes
  const rosterUpdateRef = useRef(false)

  useEffect(() => {
    if (
      status === RACE_STATUS.FINISHED &&
      horses.length > 0 &&
      !rosterUpdateRef.current
    ) {
      // Mark that we're updating to prevent multiple updates
      rosterUpdateRef.current = true

      setCharacterRoster((currentRoster) => {
        return currentRoster.map((char) => {
          const raceHorse = horses.find((h) => h.id === char.id)
          if (raceHorse) {
            return {
              ...char,
              wins: raceHorse.wins,
              races: raceHorse.races,
              totalTime: raceHorse.totalTime
            }
          }
          return char
        })
      })
    }

    // Reset the flag when status changes away from FINISHED
    if (status !== RACE_STATUS.FINISHED) {
      rosterUpdateRef.current = false
    }
  }, [status, horses])

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

      // 'i' or 'I' to start/restart introduction sequence
      if (e.key === 'i' || e.key === 'I') {
        if (
          status === RACE_STATUS.IDLE ||
          status === RACE_STATUS.FINISHED ||
          status === RACE_STATUS.INTRODUCTION
        ) {
          e.preventDefault()
          startIntroduction()
        }
        return
      }

      // Arrow keys to navigate through introduction
      if (status === RACE_STATUS.INTRODUCTION) {
        // Right arrow - go to next horse
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          setIntroNavDirection('right')
          setIntroductionIndex((prev) => {
            const nextIndex = prev + 1
            // Allow going to horses.length to mark introduction as complete
            return Math.min(nextIndex, horses.length)
          })
          return
        }

        // Left arrow - go to previous horse
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setIntroNavDirection('left')
          setIntroductionIndex((prev) => {
            const prevIndex = prev - 1
            // Don't go below 0
            return Math.max(prevIndex, 0)
          })
          // If going back, unmark introduction as complete
          if (introductionComplete) {
            setIntroductionComplete(false)
          }
          return
        }
      }

      // Space to start countdown
      if (e.code === 'Space' || e.key === ' ') {
        // After introduction is complete, start countdown
        if (status === RACE_STATUS.INTRODUCTION && introductionComplete) {
          e.preventDefault()
          startCountdown()
        }
        // From idle or finished, start countdown directly (skip intro)
        else if (
          status === RACE_STATUS.IDLE ||
          status === RACE_STATUS.FINISHED
        ) {
          e.preventDefault()
          startCountdown()
        }
        return
      }

      // '+' to add a character to roster and select it
      if (e.key === '+' || e.code === 'NumpadAdd') {
        e.preventDefault()
        const nextNumber = getNextHorseNumber(characterRoster)
        const newChar = mkHorse(
          `Horse ${characterRoster.length + 1}`,
          randomColor(),
          nextNumber
        )
        newChar.createdAt = Date.now()
        setCharacterRoster((roster) => [...roster, newChar])
        setSelectedCharacterIds((ids) => [...ids, newChar.id])
        return
      }

      // '-' to deselect last selected horse
      if (e.key === '-' || e.code === 'NumpadSubtract') {
        e.preventDefault()
        setSelectedCharacterIds((ids) =>
          ids.length > 0 ? ids.slice(0, -1) : ids
        )
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    status,
    startCountdown,
    startIntroduction,
    characterRoster,
    introductionComplete,
    horses.length
  ])

  const handleAddHorse = (newHorse) => {
    // Assign a number if not already set
    if (!newHorse.number) {
      newHorse.number = getNextHorseNumber(characterRoster)
    }
    newHorse.createdAt = Date.now()
    setCharacterRoster((roster) => [...roster, newHorse])
    setSelectedCharacterIds((ids) => [...ids, newHorse.id])
  }

  const handleRemoveHorse = (horseId) => {
    // Remove from selection (but keep in roster)
    setSelectedCharacterIds((ids) => ids.filter((id) => id !== horseId))
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
                startTime={startTime}
                introductionIndex={introductionIndex}
                introductionComplete={introductionComplete}
                introNavDirection={introNavDirection}
              />
            </div>

            <div className="horse-panels">
              <HorseList horses={horses} onRemove={handleRemoveHorse} />
              <HorseEditor
                horses={horses}
                onChange={(updatedHorses) => {
                  // Update current race horses (for immediate UI feedback)
                  setHorses(updatedHorses)

                  // Update horses in the character roster (for persistence)
                  const updatedRoster = characterRoster.map((char) => {
                    const updated = updatedHorses.find((h) => h.id === char.id)
                    return updated ? { ...char, ...updated } : char
                  })
                  setCharacterRoster(updatedRoster)
                }}
              />
            </div>
          </div>

          <div className="horse-col-right">
            {/* Character Manager Button */}
            <div
              style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <CharacterManager
                characterRoster={characterRoster}
                selectedIds={selectedCharacterIds}
                onRosterChange={setCharacterRoster}
                onSelectionChange={setSelectedCharacterIds}
              />
            </div>

            <RaceHeader
              raceName={raceName}
              status={status}
              onStartRace={startCountdown}
              onStartIntroduction={startIntroduction}
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
              <strong>I</strong> to start intro (use <strong>←/→</strong> arrows
              to navigate, then <strong>Space</strong> to race) · Press{' '}
              <strong>Space</strong> to start race directly · <strong>+</strong>
              /<strong>-</strong> to add/remove horses
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HorseRacing
