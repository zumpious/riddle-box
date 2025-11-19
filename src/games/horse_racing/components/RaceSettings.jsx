import React from 'react'
import { RANGES } from '../constants'
import './RaceSettings.css'

/**
 * RaceSettings Component
 * Controls for race configuration (laps, distance) and display settings
 *
 * @param {number} laps - Number of laps
 * @param {Function} onLapsChange - Callback to update laps
 * @param {number} lapLengthPx - Length of one lap in pixels
 * @param {Function} onLapLengthChange - Callback to update lap length
 * @param {string} status - Current race status
 * @param {number} arenaHeight - Arena height in pixels
 * @param {Function} onArenaHeightChange - Callback to update arena height
 * @param {number} trackThickness - Track thickness value
 * @param {Function} onTrackThicknessChange - Callback to update track thickness
 * @param {number} spriteScale - Default sprite scale
 * @param {Function} onSpriteScaleChange - Callback to update sprite scale
 */
function RaceSettings({
  laps,
  onLapsChange,
  lapLengthPx,
  onLapLengthChange,
  status,
  arenaHeight,
  onArenaHeightChange,
  trackThickness,
  onTrackThicknessChange,
  spriteScale,
  onSpriteScaleChange
}) {
  return (
    <div className="horse-settings">
      <div className="settings-card">
        <h2>Race Settings</h2>
        <div className="settings-grid">
          <label>
            <span>Laps</span>
            <input
              type="number"
              min={RANGES.LAPS.min}
              max={RANGES.LAPS.max}
              value={laps}
              onChange={(e) =>
                onLapsChange(Math.max(RANGES.LAPS.min, Number(e.target.value)))
              }
            />
          </label>
          <label>
            <span>Lap length (virtual units)</span>
            <input
              type="number"
              min={RANGES.LAP_LENGTH.min}
              step={RANGES.LAP_LENGTH.step}
              value={lapLengthPx}
              onChange={(e) =>
                onLapLengthChange(
                  Math.max(RANGES.LAP_LENGTH.min, Number(e.target.value))
                )
              }
            />
          </label>
          <div className="settings-stats">
            <div>Total distance: {lapLengthPx * laps}</div>
            <div>Status: {status}</div>
          </div>
        </div>
      </div>
      <div className="settings-card">
        <h2>Display</h2>
        <div className="settings-grid">
          <label>
            <span>Arena height</span>
            <input
              type="range"
              min={RANGES.ARENA_HEIGHT.min}
              max={RANGES.ARENA_HEIGHT.max}
              step={RANGES.ARENA_HEIGHT.step}
              value={arenaHeight}
              onChange={(e) => onArenaHeightChange(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Track thickness</span>
            <input
              type="range"
              min={RANGES.TRACK_THICKNESS.min}
              max={RANGES.TRACK_THICKNESS.max}
              step={RANGES.TRACK_THICKNESS.step}
              value={trackThickness}
              onChange={(e) => onTrackThicknessChange(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Horse size</span>
            <input
              type="range"
              min={RANGES.SPRITE_SCALE.min}
              max={RANGES.SPRITE_SCALE.max}
              step={RANGES.SPRITE_SCALE.step}
              value={spriteScale}
              onChange={(e) => onSpriteScaleChange(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

export default RaceSettings
