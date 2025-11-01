import React, { useMemo } from 'react'
import { msToClock } from '../utils/raceHelpers'
import './RaceResults.css'

/**
 * RaceResults Component
 * Displays the sorted race results with times
 *
 * @param {Array} horses - Array of horse objects
 * @param {string} status - Current race status
 */
function RaceResults({ horses, status }) {
  const sortedResults = useMemo(() => {
    return [...horses]
      .filter((h) => h.finishedAtMs != null)
      .sort((a, b) => a.finishedAtMs - b.finishedAtMs)
  }, [horses])

  return (
    <div className="horse-results">
      <h2>Results</h2>
      {status !== 'finished' && (
        <p className="hint">
          Results appear when all horses finish (or you force finish).
        </p>
      )}
      <ol className="results-list">
        {sortedResults.map((h, idx) => (
          <li key={h.id} className="result-row">
            <div className="result-left">
              <span className="place">#{idx + 1}</span>
              <span className="dot" style={{ background: h.color }} />
              <span className="result-name">{h.name}</span>
            </div>
            <div className="result-time">{msToClock(h.finishedAtMs)}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default RaceResults
