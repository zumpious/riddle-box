import React from 'react'
import ConfigManager from './ConfigManager'
import { mkHorse, randomColor } from '../utils/raceHelpers'
import './RaceHeader.css'

/**
 * RaceHeader Component
 * Displays race title and action buttons (start, add horse, config management)
 *
 * @param {string} raceName - Name of the race
 * @param {string} status - Current race status
 * @param {Function} onStartRace - Callback to start the race
 * @param {Function} onStartIntroduction - Callback to start pre-race introduction
 * @param {Function} onStopRace - Callback to force stop the race
 * @param {Function} onAddHorse - Callback to add a new horse
 * @param {Array} horses - Current array of horse objects
 * @param {Function} onHorsesChange - Callback to update horses
 */
function RaceHeader({
  raceName,
  status,
  onStartRace,
  onStartIntroduction,
  onStopRace,
  onAddHorse,
  horses,
  onHorsesChange
}) {
  const handleAddHorse = () => {
    onAddHorse(mkHorse(`New Horse ${horses.length + 1}`, randomColor()))
  }

  return (
    <div className="horse-header">
      <div className="horse-title">
        <h1>🏇 {raceName}</h1>
        <p>Run a party race, track lap times, and crown a winner.</p>
      </div>
      <div className="horse-actions">
        {(status === 'idle' ||
          status === 'finished' ||
          status === 'introduction') && (
          <>
            <button onClick={onStartIntroduction} className="horse-btn intro">
              🎬{' '}
              {status === 'introduction' ? 'Restart Intro' : 'Pre-Race Intro'}
            </button>
            <button onClick={onStartRace} className="horse-btn primary">
              Start Race
            </button>
          </>
        )}
        {status === 'running' && (
          <button onClick={onStopRace} className="horse-btn">
            Force Finish
          </button>
        )}
        <button className="horse-btn" onClick={handleAddHorse}>
          + Add Horse
        </button>
      </div>

      <ConfigManager horses={horses} onHorsesChange={onHorsesChange} />
    </div>
  )
}

export default RaceHeader
