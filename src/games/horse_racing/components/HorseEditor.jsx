import React, { useEffect, useMemo, useState } from 'react'
import { loadHorseImages } from '../utils/assetLoader'
import { msToClock } from '../utils/raceHelpers'
import { RANGES } from '../constants'
import './HorseEditor.css'

/**
 * HorseEditor Component
 * Allows editing of individual horse properties and displays statistics
 *
 * @param {Array} horses - Array of horse objects
 * @param {Function} onChange - Callback to update horses
 */
function HorseEditor({ horses, onChange }) {
  const [selectedId, setSelectedId] = useState(horses[0]?.id ?? '')
  const images = useMemo(() => loadHorseImages(), [])

  useEffect(() => {
    if (!horses.find((h) => h.id === selectedId) && horses[0])
      setSelectedId(horses[0].id)
  }, [horses, selectedId])

  const sel = horses.find((h) => h.id === selectedId)
  if (!sel) return <p className="hint">Add a horse to edit it.</p>

  const update = (partial) => {
    onChange(horses.map((h) => (h.id === sel.id ? { ...h, ...partial } : h)))
  }

  return (
    <div className="horse-editor">
      <h2>Edit Selected Horse</h2>
      <div className="editor-grid">
        <div className="editor-row">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {horses.map((h) => (
              <option key={h.id} value={h.id}>
                #{h.number} {h.name}
              </option>
            ))}
          </select>
          <input
            value={sel.name}
            onChange={(e) => update({ name: e.target.value })}
          />
          <input
            type="color"
            className="color-input"
            value={sel.color}
            onChange={(e) => update({ color: e.target.value })}
          />
        </div>
        <div className="editor-row">
          <label className="editor-label">Racing Number</label>
          <div className="racing-number-display">
            <span
              className="racing-number-badge"
              style={{ backgroundColor: sel.color }}
            >
              #{sel.number}
            </span>
            <span className="racing-number-text">
              This is the permanent racing number for this horse
            </span>
          </div>
        </div>
        <div className="editor-row">
          <label className="editor-label">Sprite Image</label>
          <select
            value={sel.imgFileName || ''}
            onChange={(e) => {
              const fileName = e.target.value
              if (!fileName) {
                update({ imgSrc: undefined, imgFileName: undefined })
              } else {
                const img = images.find((i) => i.label === fileName)
                update({ imgSrc: img?.src, imgFileName: fileName })
              }
            }}
          >
            <option value="">Default SVG</option>
            {images.map((img) => (
              <option key={img.label} value={img.label}>
                {img.label}
              </option>
            ))}
          </select>
          {sel.imgSrc ? (
            <img src={sel.imgSrc} alt="preview" className="img-preview" />
          ) : null}
        </div>
        <label className="slider">
          Base Speed
          <input
            type="range"
            min={RANGES.BASE_SPEED.min}
            max={RANGES.BASE_SPEED.max}
            value={sel.baseSpeed}
            onChange={(e) => update({ baseSpeed: Number(e.target.value) })}
          />
        </label>
        <label className="slider">
          Sprite Size
          <input
            type="range"
            min={RANGES.SPRITE_SIZE.min}
            max={RANGES.SPRITE_SIZE.max}
            step={RANGES.SPRITE_SIZE.step}
            value={sel.spriteScale ?? 4}
            onChange={(e) => update({ spriteScale: Number(e.target.value) })}
          />
        </label>
        <label className="slider">
          Stamina (s)
          <input
            type="range"
            min={RANGES.STAMINA.min}
            max={RANGES.STAMINA.max}
            value={sel.stamina}
            onChange={(e) => update({ stamina: Number(e.target.value) })}
          />
        </label>
        <label className="slider">
          Variance
          <input
            type="range"
            min={RANGES.VARIANCE.min}
            max={RANGES.VARIANCE.max}
            step={RANGES.VARIANCE.step}
            value={sel.variance}
            onChange={(e) => update({ variance: Number(e.target.value) })}
          />
        </label>
        <button
          className="horse-btn small align-right"
          onClick={() => update({ svgPath: undefined })}
        >
          Reset SVG
        </button>

        {/* Statistics Section
        <div className="editor-advanced">
          <label className="editor-label">Custom SVG Path (advanced)</label>
          <textarea
            className="editor-textarea"
            placeholder="Paste an SVG path 'd' attribute here to override the default horse shape"
            value={sel.svgPath || ''}
            onChange={(e) => update({ svgPath: e.target.value })}
          />
          <p className="hint">
            Tip: Use a simple silhouette path. Complex paths work, too. The
            sprite is auto-tinted.
          </p>
        </div>
        */}

        {/* Statistics Section */}
        {(sel.races || 0) > 0 && (
          <div className="editor-stats">
            <h3 className="editor-stats-title">📊 Race Statistics</h3>
            <div className="editor-stats-grid">
              <div>
                <strong>Races:</strong> {sel.races || 0}
              </div>
              <div>
                <strong>Wins:</strong> {sel.wins || 0}
              </div>
              <div>
                <strong>Win Rate:</strong>{' '}
                {(((sel.wins || 0) / (sel.races || 1)) * 100).toFixed(1)}%
              </div>
              <div>
                <strong>Avg Time:</strong>{' '}
                {sel.races > 0
                  ? msToClock((sel.totalTime || 0) / sel.races)
                  : 'N/A'}
              </div>
            </div>
            <button
              className="horse-btn small editor-stats-reset"
              onClick={() => {
                if (window.confirm(`Reset statistics for ${sel.name}?`)) {
                  update({ wins: 0, races: 0, totalTime: 0 })
                }
              }}
            >
              🗑️ Reset Stats
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default HorseEditor
