import React, { useEffect, useState } from 'react'
import './HorseIntroduction.css'
import introStatsBg from '../../../img/horse_racing/background/intro_stats.png'
import { INTRO_DURATION_PER_HORSE } from '../constants'

/**
 * HorseIntroduction Component
 * WWE/Boxing style pre-race introduction for each horse
 * Shows horse image, name, and stats with dramatic animations
 *
 * @param {Array} horses - Array of horses to introduce
 * @param {number} currentIndex - Index of current horse being introduced
 * @param {boolean} allComplete - Whether all introductions are complete
 * @param {Function} onComplete - Callback when all intros are done
 */
function HorseIntroduction({ horses, currentIndex, allComplete }) {
  const [animationPhase, setAnimationPhase] = useState('entering') // entering, center, exiting
  const [direction, setDirection] = useState('left') // left, right, top, bottom

  const horse = horses[currentIndex]

  // Set random direction when horse changes
  useEffect(() => {
    if (!horse) return
    const directions = ['left', 'right', 'top', 'bottom']
    const randomDir = directions[Math.floor(Math.random() * directions.length)]
    setDirection(randomDir)
    setAnimationPhase('entering')

    // Calculate phase timings based on INTRO_DURATION_PER_HORSE
    // Entry: 20% of total time
    // Center: 60% of total time (most important - showing stats)
    // Exit: 20% of total time
    const enterDuration = INTRO_DURATION_PER_HORSE * 0.2
    const exitStartTime = INTRO_DURATION_PER_HORSE * 0.8

    // Phase timing
    const enterTimer = setTimeout(() => {
      setAnimationPhase('center')
    }, enterDuration)

    const exitTimer = setTimeout(() => {
      setAnimationPhase('exiting')
    }, exitStartTime)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
    }
  }, [currentIndex, horse])

  // Calculate stats (with safety check)
  const winRate = horse
    ? horse.races > 0
      ? (((horse.wins || 0) / horse.races) * 100).toFixed(1)
      : '0.0'
    : '0.0'

  // If no valid horse or all complete, don't render anything (show arena/horses)
  if (!horse || allComplete) {
    return null
  }

  return (
    <div className="horse-intro-overlay">
      <div
        className={`horse-intro-card ${animationPhase} from-${direction}`}
        style={{
          '--horse-color': horse.color,
          backgroundImage: `url(${introStatsBg})`
        }}
      >
        {/* Horse Image */}
        <div className="intro-horse-image">
          {horse.imgSrc ? (
            <img
              src={horse.imgSrc}
              alt={horse.name}
              className="intro-horse-img"
            />
          ) : (
            <div
              className="intro-horse-placeholder"
              style={{ backgroundColor: horse.color }}
            />
          )}
        </div>

        {/* Horse Name Banner */}
        <div
          className="intro-horse-name"
          style={{ backgroundColor: horse.color }}
        >
          <div className="intro-name-stars">★★★</div>
          <div className="intro-name-text">{horse.name}</div>
          <div className="intro-name-stars">★★★</div>
        </div>

        {/* Stats Display */}
        <div className="intro-stats">
          <div className="intro-stat-item">
            <div className="intro-stat-icon">🏁</div>
            <div className="intro-stat-label">Races</div>
            <div className="intro-stat-value">{horse.races || 0}</div>
          </div>

          <div className="intro-stat-item">
            <div className="intro-stat-icon">🏆</div>
            <div className="intro-stat-label">Wins</div>
            <div className="intro-stat-value">{horse.wins || 0}</div>
          </div>

          <div className="intro-stat-item">
            <div className="intro-stat-icon">📊</div>
            <div className="intro-stat-label">Win Rate</div>
            <div className="intro-stat-value">{winRate}%</div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="intro-progress">
          {horses.map((h, idx) => (
            <div
              key={idx}
              className={`intro-progress-dot ${
                idx === currentIndex ? 'active' : ''
              } ${idx < currentIndex ? 'complete' : ''}`}
              style={{
                '--dot-color': h.color
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default HorseIntroduction
