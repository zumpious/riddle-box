import React, { useEffect, useState } from 'react'
import './HorseIntroduction.css'

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

    // Phase timing
    const enterTimer = setTimeout(() => {
      setAnimationPhase('center')
    }, 600) // Entry animation duration

    const exitTimer = setTimeout(() => {
      setAnimationPhase('exiting')
    }, 2400) // Hold in center for ~1.8s (3s - 0.6s - 0.6s)

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
          '--horse-color': horse.color
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
