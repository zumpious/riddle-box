import React, { useEffect, useState, useRef } from 'react'
import './HorseIntroduction.css'
import introStatsBg from '../../../img/horse_racing/background/intro_stats_horses.png'

/**
 * HorseIntroduction Component
 * WWE/Boxing style pre-race introduction for each horse
 * Shows horse image, name, and stats with dramatic animations
 * Manual navigation with arrow keys - cards stay until user navigates
 *
 * @param {Array} horses - Array of horses to introduce
 * @param {number} currentIndex - Index of current horse being introduced
 * @param {boolean} allComplete - Whether all introductions are complete
 * @param {string} navDirection - Direction of navigation ('right' or 'left')
 */
function HorseIntroduction({
  horses,
  currentIndex,
  allComplete,
  navDirection
}) {
  const [animationPhase, setAnimationPhase] = useState('entering-right') // entering-right, entering-left, center, exiting-left, exiting-right
  const [displayedIndex, setDisplayedIndex] = useState(currentIndex) // Which horse is currently shown on screen
  const prevIndexRef = useRef(currentIndex)

  const horse = horses[displayedIndex] // Use displayedIndex instead of currentIndex

  // Handle index changes - trigger exit animation before new card enters
  useEffect(() => {
    const prevIndex = prevIndexRef.current

    // If index changed (user navigated)
    if (prevIndex !== currentIndex) {
      // Keep showing the old horse during exit animation
      setDisplayedIndex(prevIndex)

      // Determine exit and enter directions based on navigation
      if (currentIndex > prevIndex) {
        // Moving forward (right arrow pressed) - exit to left, enter from right
        setAnimationPhase('exiting-left')
      } else {
        // Moving backward (left arrow pressed) - exit to right, enter from left
        setAnimationPhase('exiting-right')
      }

      // After exit animation, switch to new horse and enter
      const exitTimer = setTimeout(() => {
        // Now show the new horse
        setDisplayedIndex(currentIndex)

        // Enter from opposite direction
        if (currentIndex > prevIndex) {
          setAnimationPhase('entering-right') // Coming from right
        } else {
          setAnimationPhase('entering-left') // Coming from left
        }
        prevIndexRef.current = currentIndex

        // After enter animation, go to center (stay there)
        const enterTimer = setTimeout(() => {
          setAnimationPhase('center')
        }, 600) // Match enter animation duration

        return () => clearTimeout(enterTimer)
      }, 600) // Match exit animation duration

      return () => clearTimeout(exitTimer)
    } else if (displayedIndex !== currentIndex) {
      // Handle initial mount or reset
      setDisplayedIndex(currentIndex)
      setAnimationPhase('entering-right')
      const enterTimer = setTimeout(() => {
        setAnimationPhase('center')
      }, 600) // Match enter animation duration

      return () => clearTimeout(enterTimer)
    }
  }, [currentIndex, displayedIndex])

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
        className={`horse-intro-card ${animationPhase}`}
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

          {/* Racing number badge (like a bib) */}
          <div
            className="intro-horse-number"
            style={{ backgroundColor: horse.color }}
          >
            #{horse.number}
          </div>
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
