import React from 'react'
import './HorseList.css'

/**
 * HorseList Component
 * Displays list of horses with their stats and remove button
 *
 * @param {Array} horses - Array of horse objects
 * @param {Function} onRemove - Callback when remove button is clicked
 */
function HorseList({ horses, onRemove }) {
  return (
    <div className="horse-list">
      <h2>Horses</h2>
      <div className="horse-list-grid">
        {horses.map((h) => (
          <div key={h.id} className="horse-row">
            <div className="horse-color" style={{ background: h.color }} />
            <div className="horse-row-main">
              <div className="horse-name">{h.name}</div>
              <div className="horse-meta">
                Base {Math.round(h.baseSpeed)} · Stamina {h.stamina}s · Var{' '}
                {(h.variance * 100).toFixed(0)}%
              </div>
            </div>
            <button className="horse-btn small" onClick={() => onRemove(h.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HorseList
