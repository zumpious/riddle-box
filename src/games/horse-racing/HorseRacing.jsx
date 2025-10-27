import React, { useEffect, useMemo, useRef, useState } from 'react'
import './HorseRacing.css'

// ---------- Utilities ----------
function lcg(seed) {
  // simple deterministic RNG (0..1)
  let state = seed >>> 0 || 123456789
  return () => (state = (1664525 * state + 1013904223) >>> 0) / 2 ** 32
}

function msToClock(ms) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(
    cs
  ).padStart(2, '0')}`
}

// Default minimal SVG horse (replaceable). Must be a single <g> group for tinting.
const DefaultHorseSVG = ({ color = '#7c3aed' }) => (
  <g fill={color} stroke="black" strokeWidth="1" strokeOpacity={0.2}>
    <circle cx="10" cy="10" r="10" />
    <rect x="17" y="6" width="12" height="8" rx="2" />
    <polygon points="5,0 12,4 8,8" />
  </g>
)

// ---------- Main Component ----------
const HorseRacing = () => {
  // Track & race settings
  const [lapLengthPx, setLapLengthPx] = useState(1600) // one lap distance in pixels (virtual)
  const [laps, setLaps] = useState(1)
  const [raceName, setRaceName] = useState('Birthday Grand Prix')
  const [countdown, setCountdown] = useState(3)

  const [horses, setHorses] = useState(() => [
    mkHorse('Comet', '#ef4444'),
    mkHorse('Nimbus', '#3b82f6'),
    mkHorse('Peach', '#f97316'),
    mkHorse('Moss', '#10b981')
  ])

  const [status, setStatus] = useState('idle') // 'idle' | 'countdown' | 'running' | 'finished'
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const arenaRef = useRef(null)

  // Derived values
  const totalDistance = lapLengthPx * laps
  const finishedCount = horses.filter((h) => h.finishedAtMs != null).length

  // Animation loop
  useEffect(() => {
    if (status !== 'running') return

    let raf = 0
    let last = performance.now()

    const tick = () => {
      const now = performance.now()
      const dt = (now - last) / 1000 // seconds
      last = now

      setElapsed(now - (startTime || now))

      setHorses((curr) =>
        curr.map((h) => {
          if (h.finishedAtMs != null) return h
          const rand = lcg(h.rngSeed + Math.floor(h.progress / 20))

          // Base + micro-variance noise
          const noise = (rand() - 0.5) * 2 * h.variance * 20 // up to ~20 px/s variation

          // Fatigue grows after stamina seconds
          const t = (now - (startTime || now)) / 1000
          const fatigue = Math.max(0, (t - h.stamina) * 12) // px/s penalty

          // Occasional sprint or stumble events (rare, deterministic)
          const eventR = rand()
          let eventBoost = 0
          if (eventR > 0.995) eventBoost = 90 // short sprint
          else if (eventR < 0.005) eventBoost = -60 // brief stumble

          const speed = Math.max(10, h.baseSpeed + noise + eventBoost - fatigue) // px/s
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

  // Countdown timer
  useEffect(() => {
    if (status !== 'countdown') return
    setElapsed(0)
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id)
          go()
          return 3
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [status])

  const startCountdown = () => {
    if (status === 'running') return
    // reset race
    setHorses((curr) =>
      curr.map((h) => ({
        ...h,
        progress: 0,
        finishedAtMs: undefined,
        rngSeed: Math.floor(Math.random() * 1e9)
      }))
    )
    setStatus('countdown')
  }

  const go = () => {
    setStartTime(performance.now())
    setStatus('running')
  }

  const stop = () => setStatus('finished')

  useEffect(() => {
    if (
      status === 'running' &&
      finishedCount === horses.length &&
      horses.length > 0
    ) {
      setStatus('finished')
    }
  }, [finishedCount, status, horses.length])

  const sortedResults = useMemo(() => {
    return [...horses]
      .filter((h) => h.finishedAtMs != null)
      .sort((a, b) => a.finishedAtMs - b.finishedAtMs)
  }, [horses])

  return (
    <div className="horse-racing">
      <div className="horse-racing-inner">
        <div className="horse-header">
          <div className="horse-title">
            <h1>🏇 {raceName}</h1>
            <p>Run a party race, track lap times, and crown a winner.</p>
          </div>
          <div className="horse-actions">
            {(status === 'idle' || status === 'finished') && (
              <button onClick={startCountdown} className="horse-btn primary">
                Start Race
              </button>
            )}
            {status === 'running' && (
              <button onClick={stop} className="horse-btn">
                Force Finish
              </button>
            )}
            <button
              onClick={() =>
                setHorses((hs) => [
                  ...hs,
                  mkHorse(`New Horse ${hs.length + 1}`, randomColor())
                ])
              }
              className="horse-btn"
            >
              + Add Horse
            </button>
          </div>
        </div>

        <div className="horse-settings">
          <div className="settings-card">
            <h2>Race Settings</h2>
            <div className="settings-grid">
              <label>
                <span>Name</span>
                <input
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                />
              </label>
              <label>
                <span>Laps</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={laps}
                  onChange={(e) => setLaps(Math.max(1, Number(e.target.value)))}
                />
              </label>
              <label>
                <span>Lap length (virtual px)</span>
                <input
                  type="number"
                  min={200}
                  step={100}
                  value={lapLengthPx}
                  onChange={(e) =>
                    setLapLengthPx(Math.max(200, Number(e.target.value)))
                  }
                />
              </label>
              <div className="settings-stats">
                <div>Elapsed: {msToClock(elapsed)}</div>
                <div>Status: {status}</div>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2>Countdown</h2>
            <div className="countdown">
              <button
                onClick={() => setCountdown((c) => Math.max(1, c - 1))}
                className="horse-btn"
              >
                -
              </button>
              <div className="countdown-value">{countdown}s</div>
              <button
                onClick={() => setCountdown((c) => c + 1)}
                className="horse-btn"
              >
                +
              </button>
            </div>
            <p className="hint">
              Starts automatically when you press "Start Race".
            </p>
          </div>
        </div>

        <div ref={arenaRef} className="horse-arena">
          <RaceArena
            horses={horses}
            totalDistance={totalDistance}
            status={status}
            countdown={countdown}
          />
        </div>

        <div className="horse-panels">
          <div className="horse-list">
            <h2>Horses</h2>
            <div className="horse-list-grid">
              {horses.map((h) => (
                <div key={h.id} className="horse-row">
                  <div
                    className="horse-color"
                    style={{ background: h.color }}
                  />
                  <div className="horse-row-main">
                    <div className="horse-name">{h.name}</div>
                    <div className="horse-meta">
                      Base {Math.round(h.baseSpeed)} · Stamina {h.stamina}s ·
                      Var {(h.variance * 100).toFixed(0)}%
                    </div>
                  </div>
                  <button
                    className="horse-btn small"
                    onClick={() =>
                      setHorses((hs) => hs.filter((x) => x.id !== h.id))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="horse-editor">
            <h2>Edit Selected Horse</h2>
            <HorseEditor horses={horses} onChange={setHorses} />
          </div>
        </div>

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

        <div className="horse-tip">
          Tip: replace the default horse shape with your own SVG path in the
          editor.
        </div>
      </div>
    </div>
  )
}

// ---------- Arena (track + horses) ----------
function RaceArena({ horses, totalDistance, status, countdown }) {
  const size = 600 // svg viewport
  const cx = size / 2
  const cy = size / 2
  const outerR = 250
  const innerR = 170
  const lanes = horses.length

  // Map progress (0..totalDistance) to angle around the track (0..2π * laps)
  const maxAngle =
    Math.PI * 2 * (totalDistance / (2 * Math.PI * ((outerR + innerR) / 2))) // approximate mapping

  return (
    <div className="arena-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="arena-svg">
        <defs>
          <radialGradient id="grass" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2fbe2" />
            <stop offset="100%" stopColor="#c0f0c0" />
          </radialGradient>
          <linearGradient id="track" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={size} height={size} fill="url(#grass)" />
        <g>
          <circle cx={cx} cy={cy} r={outerR} fill="url(#track)" />
          <circle cx={cx} cy={cy} r={innerR} fill="url(#grass)" />
          {Array.from({ length: lanes }).map((_, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={innerR + ((outerR - innerR) / (lanes + 1)) * (i + 1)}
              fill="none"
              stroke="#94a3b8"
              strokeDasharray="6 8"
            />
          ))}
        </g>

        {/* Start/finish line */}
        <g transform={`translate(${cx}, ${cy})`}>
          <g transform={`rotate(-90)`}>
            <rect
              x={-outerR}
              y={-2}
              width={outerR - innerR}
              height={4}
              fill="#0f172a"
            />
          </g>
        </g>

        {/* Horses */}
        {horses.map((h, idx) => {
          const laneR = innerR + ((outerR - innerR) / (lanes + 1)) * (idx + 1)
          const angle = (h.progress / totalDistance) * maxAngle - Math.PI / 2 // start at top
          const x = cx + laneR * Math.cos(angle)
          const y = cy + laneR * Math.sin(angle)
          const rotDeg = (angle * 180) / Math.PI + 90 // face forward

          return (
            <g key={h.id} transform={`translate(${x}, ${y}) rotate(${rotDeg})`}>
              <HorseSprite color={h.color} svgPath={h.svgPath} />
              {/* Name + time tag */}
              <g transform="translate(0, -26)">
                <rect
                  x={-40}
                  y={-18}
                  width={80}
                  height={20}
                  rx={10}
                  fill="white"
                  opacity={0.9}
                />
                <text
                  x={0}
                  y={-5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#0f172a"
                  fontWeight={600}
                >
                  {h.name}
                </text>
                <text
                  x={0}
                  y={8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#334155"
                >
                  {h.finishedAtMs != null ? msToClock(h.finishedAtMs) : ''}
                </text>
              </g>
            </g>
          )
        })}

        {/* Big countdown overlay */}
        {status === 'countdown' && (
          <g>
            <rect
              x={0}
              y={0}
              width={size}
              height={size}
              fill="rgba(0,0,0,0.2)"
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="120"
              fontWeight={800}
              fill="white"
            >
              {countdown}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

function HorseSprite({ color, svgPath }) {
  return (
    <g>
      <g transform="translate(-16, -12)">
        {svgPath ? (
          <path d={svgPath} fill={color} stroke="black" strokeWidth={0.5} />
        ) : (
          <DefaultHorseSVG color={color} />
        )}
      </g>
    </g>
  )
}

// ---------- Horse Editor ----------
function HorseEditor({ horses, onChange }) {
  const [selectedId, setSelectedId] = useState(horses[0]?.id ?? '')

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
    <div className="editor-grid">
      <div className="editor-row">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {horses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
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
      <label className="slider">
        Base Speed
        <input
          type="range"
          min={60}
          max={160}
          value={sel.baseSpeed}
          onChange={(e) => update({ baseSpeed: Number(e.target.value) })}
        />
      </label>
      <label className="slider">
        Stamina (s)
        <input
          type="range"
          min={5}
          max={40}
          value={sel.stamina}
          onChange={(e) => update({ stamina: Number(e.target.value) })}
        />
      </label>
      <label className="slider">
        Variance
        <input
          type="range"
          min={0}
          max={0.6}
          step={0.02}
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

      <div className="editor-advanced">
        <label className="editor-label">Custom SVG Path (advanced)</label>
        <textarea
          className="editor-textarea"
          placeholder="Paste an SVG path 'd' attribute here to override the default horse shape"
          value={sel.svgPath || ''}
          onChange={(e) => update({ svgPath: e.target.value })}
        />
        <p className="hint">
          Tip: Use a simple silhouette path. Complex paths work, too. The sprite
          is auto-tinted.
        </p>
      </div>
    </div>
  )
}

// ---------- Helpers ----------
function mkId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function mkHorse(name, color) {
  const id = mkId()
  return {
    id,
    name,
    color,
    baseSpeed: 100 + Math.random() * 40,
    stamina: 12 + Math.random() * 12,
    variance: 0.18 + Math.random() * 0.12,
    progress: 0,
    rngSeed: Math.floor(Math.random() * 1e9)
  }
}

function randomColor() {
  const palette = [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#84cc16',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e'
  ]
  return palette[Math.floor(Math.random() * palette.length)]
}

export default HorseRacing
