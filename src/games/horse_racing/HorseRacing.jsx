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

// ---------- Assets helper ----------
function loadHorseImages() {
  try {
    const ctx = require.context(
      '../../img/horse_racing',
      false,
      /\.(png|jpe?g|gif|webp)$/
    )
    return ctx.keys().map((key) => ({
      label: key.replace('./', ''),
      src: ctx(key)
    }))
  } catch (e) {
    return []
  }
}

// ---------- Main Component ----------
const HorseRacing = () => {
  // Track & race settings
  const [lapLengthPx, setLapLengthPx] = useState(1600) // one lap distance in pixels (virtual)
  const [laps, setLaps] = useState(1)
  const [raceName, setRaceName] = useState('Birthday Grand Prix')
  const [countdown, setCountdown] = useState(3)

  const [horses, setHorses] = useState(() => {
    let ketiImg
    let reudoImg
    try {
      // optional: only if files exist
      ketiImg = require('../../img/horse_racing/keti.png')
    } catch (e) {}
    try {
      reudoImg = require('../../img/horse_racing/reudo.png')
    } catch (e) {}

    return [
      { ...mkHorse('Keti', '#ec4899'), imgSrc: ketiImg }, // pink-ish
      { ...mkHorse('Reudo', '#8b5e3c'), imgSrc: reudoImg } // brown-ish
    ]
  })

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
        <div className="horse-layout">
          <div className="horse-col-left">
            <div ref={arenaRef} className="horse-arena">
              <RaceArena
                horses={horses}
                totalDistance={totalDistance}
                status={status}
                countdown={countdown}
                lapLengthPx={lapLengthPx}
                laps={laps}
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
                          Base {Math.round(h.baseSpeed)} · Stamina {h.stamina}s
                          · Var {(h.variance * 100).toFixed(0)}%
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
          </div>

          <div className="horse-col-right">
            <div className="horse-header">
              <div className="horse-title">
                <h1>🏇 {raceName}</h1>
                <p>Run a party race, track lap times, and crown a winner.</p>
              </div>
              <div className="horse-actions">
                {(status === 'idle' || status === 'finished') && (
                  <button
                    onClick={startCountdown}
                    className="horse-btn primary"
                  >
                    Start Race
                  </button>
                )}
                {status === 'running' && (
                  <button onClick={stop} className="horse-btn">
                    Force Finish
                  </button>
                )}
                <button
                  className="horse-btn"
                  onClick={() =>
                    setHorses((hs) => [
                      ...hs,
                      mkHorse(`New Horse ${hs.length + 1}`, randomColor())
                    ])
                  }
                >
                  + Add Horse
                </button>
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
                    <div className="result-time">
                      {msToClock(h.finishedAtMs)}
                    </div>
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
      </div>
    </div>
  )
}

// ---------- Arena (track + horses) ----------
function RaceArena({
  horses,
  totalDistance,
  status,
  countdown,
  lapLengthPx,
  laps
}) {
  // Landscape SVG viewport
  const W = 1500
  const H = 700
  const cx = W / 2
  const cy = H / 2

  // Track sizing (tweak to taste)
  const trackThickness = 160 // total track width (outer - inner)
  const lanes = Math.max(1, horses.length)
  const laneGap = trackThickness / (lanes + 1)

  // Midline geometry for lanes: each lane i has its own arc radius
  // We define an oval (aka "stadium") by: straightLen + corner radius R
  // Choose midline base radius and straightLen so it fits nicely in the SVG.
  const baseMidR = 230 // midline corner radius baseline (bigger -> fills more vertically)
  const straightLenBase = 800 // midline straight length baseline (bigger -> fills more horizontally)

  // Inner/outer envelopes to draw the filled track
  const innerR = baseMidR - trackThickness / 2
  const outerR = baseMidR + trackThickness / 2
  const straightLen = straightLenBase

  // Perimeter of an oval with radius R and straight length L
  const perimeter = (R, L) => 2 * L + 2 * Math.PI * R

  // Midline perimeter (used for distance mapping per lap)
  const midPerimeter = perimeter(baseMidR, straightLen)

  // Finish line is placed where the *race* ends, i.e., at sFinish along the midline
  const sFinish = ((totalDistance % midPerimeter) + midPerimeter) % midPerimeter

  // === Helpers: stadium path + position/heading along the stadium =================

  // Build an SVG path string for a "stadium" (rounded-rectangle) using arcs
  // R: corner radius, L: straight length
  function stadiumPath(R, L) {
    // We start at the top-left tangent point, go clockwise
    const xL = cx - L / 2
    const xR = cx + L / 2
    const yTop = cy - R
    const yBot = cy + R

    // Move to top-left
    // Top straight: TL -> TR
    // Right semicircle: TR -> BR
    // Bottom straight: BR -> BL
    // Left semicircle: BL -> TL
    return [
      `M ${xL} ${yTop}`,
      `L ${xR} ${yTop}`,
      `A ${R} ${R} 0 0 1 ${xR} ${yBot}`,
      `L ${xL} ${yBot}`,
      `A ${R} ${R} 0 0 1 ${xL} ${yTop}`,
      'Z'
    ].join(' ')
  }

  // Given distance s along the oval (clockwise) with midline radius R and straight length L,
  // return { x, y, headingRad } at that param (heading is tangent direction)
  function poseOnStadium(s, R, L) {
    const P = perimeter(R, L)
    let d = ((s % P) + P) % P

    // Segment breakdown (clockwise, starting at middle of top straight going right):
    // 0) Top straight: length L
    // 1) Right semicircle (top -> bottom): length πR
    // 2) Bottom straight (right -> left): length L
    // 3) Left semicircle (bottom -> top): length πR
    const seg0 = L
    const seg1 = L + Math.PI * R
    const seg2 = L + Math.PI * R + L
    const seg3 = P

    const xL = cx - L / 2
    const xR = cx + L / 2
    const yTop = cy - R
    const yBot = cy + R

    if (d <= seg0) {
      // Top straight: left -> right
      const u = d // [0..L]
      const x = xL + u
      const y = yTop
      const headingRad = 0
      return { x, y, headingRad }
    }

    if (d <= seg1) {
      // Right semicircle, angle φ from -π/2 -> +π/2
      const u = d - seg0 // [0..πR]
      const phi = -Math.PI / 2 + u / R
      const x = xR + R * Math.cos(phi)
      const y = cy + R * Math.sin(phi)
      const headingRad = phi + Math.PI / 2
      return { x, y, headingRad }
    }

    if (d <= seg2) {
      // Bottom straight: right -> left
      const u = d - seg1 // [0..L]
      const x = xR - u
      const y = yBot
      const headingRad = Math.PI
      return { x, y, headingRad }
    }

    // Left semicircle, angle φ from +π/2 -> +3π/2
    const u = d - seg2 // [0..πR]
    const phi = Math.PI / 2 + u / R
    const x = xL + R * Math.cos(phi)
    const y = cy + R * Math.sin(phi)
    const headingRad = phi + Math.PI / 2
    return { x, y, headingRad }
  }

  // Convenience to draw dashed lane guide lines at each lane midline
  const laneMidR = (i) => innerR + laneGap * (i + 1)
  const laneMidPerimeter = (i) => perimeter(laneMidR(i), straightLen)

  // Lap indicator: leader’s lap vs total laps in this race
  const leaderProgress = Math.max(0, ...horses.map((h) => h.progress))
  const totalLaps = Math.max(1, Math.ceil(totalDistance / midPerimeter))
  const currLap = Math.min(
    totalLaps,
    Math.floor(leaderProgress / midPerimeter) + 1
  )

  // Finish line transform: perpendicular to heading at sFinish on midline
  const finishPose = poseOnStadium(sFinish, baseMidR, straightLen)
  const finishRotDeg = (finishPose.headingRad * 180) / Math.PI + 90 // perpendicular to tangent

  return (
    <div className="arena-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="arena-svg">
        <defs>
          <radialGradient id="grass" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#e2fbe2" />
            <stop offset="100%" stopColor="#c0f0c0" />
          </radialGradient>
          <linearGradient id="track" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={W} height={H} fill="url(#grass)" />

        {/* Track fill (outer minus inner) */}
        <path d={stadiumPath(outerR, straightLen)} fill="url(#track)" />
        <path d={stadiumPath(innerR, straightLen)} fill="url(#grass)" />

        {/* Lane guides */}
        {Array.from({ length: lanes }).map((_, i) => (
          <path
            key={i}
            d={stadiumPath(laneMidR(i), straightLen)}
            fill="none"
            stroke="#94a3b8"
            strokeDasharray="6 8"
          />
        ))}

        {/* Start/Finish line, placed where the configured race would end */}
        <g
          transform={`translate(${finishPose.x}, ${finishPose.y}) rotate(${finishRotDeg})`}
        >
          <rect
            x={-trackThickness / 2}
            y={-3}
            width={trackThickness}
            height={6}
            fill="#0f172a"
          />
        </g>

        {/* Center lap indicator */}
        {horses.length > 0 && (
          <g>
            <rect
              x={cx - 22}
              y={cy - 12}
              width={44}
              height={20}
              rx={10}
              fill="white"
              opacity={0.85}
            />
            <text
              x={cx}
              y={cy + 2}
              textAnchor="middle"
              fontSize="12"
              fontWeight={700}
              fill="#0f172a"
            >
              {currLap}/{totalLaps}
            </text>
          </g>
        )}

        {/* Horses */}
        {horses.map((h, idx) => {
          const Rlane = laneMidR(idx)
          const PL = perimeter(Rlane, straightLen)
          const laneScale = PL / midPerimeter
          const sFinishLane = (sFinish / midPerimeter) * PL
          const sStartLane =
            (((sFinishLane - laneScale * sFinish) % PL) + PL) % PL
          // Progress along midline (common virtual distance base)
          const sMid =
            ((h.progress % midPerimeter) + midPerimeter) % midPerimeter
          // Map to lane and add start offset so all finish at the same line
          const sLane = (sStartLane + laneScale * sMid) % PL
          const p = poseOnStadium(sLane, Rlane, straightLen)
          const rotDeg = (p.headingRad * 180) / Math.PI

          return (
            <g
              key={h.id}
              transform={`translate(${p.x}, ${p.y}) rotate(${rotDeg})`}
            >
              <HorseSprite
                color={h.color}
                svgPath={h.svgPath}
                imgSrc={h.imgSrc}
                spriteScale={h.spriteScale}
              />
              {/* Name tag behind the horse, rotated with the sprite */}
              <g transform={`translate(-70, -10)`} pointerEvents="none">
                <text
                  x={20}
                  y={3}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#0f172a"
                  fontWeight={600}
                >
                  {h.name}
                </text>
              </g>
            </g>
          )
        })}

        {/* Big countdown overlay */}
        {status === 'countdown' && (
          <g>
            <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.2)" />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="200"
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

function HorseSprite({ color, svgPath, imgSrc, spriteScale = 5 }) {
  return (
    <g>
      <g transform="translate(-16, -12)">
        {imgSrc ? (
          (() => {
            const baseW = 32
            const baseH = 24
            const w = baseW * spriteScale
            const h = baseH * spriteScale
            const x = -16 - (w - baseW) / 2
            const y = -12 - (h - baseH) / 2
            return (
              <image
                href={imgSrc}
                x={x}
                y={y}
                width={w}
                height={h}
                preserveAspectRatio="xMidYMid meet"
              />
            )
          })()
        ) : svgPath ? (
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
      <div className="editor-row">
        <label className="editor-label">Sprite Image</label>
        <select
          value={sel.imgSrc || ''}
          onChange={(e) => update({ imgSrc: e.target.value || undefined })}
        >
          <option value="">Default SVG</option>
          {images.map((img) => (
            <option key={img.src} value={img.src}>
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
          min={60}
          max={160}
          value={sel.baseSpeed}
          onChange={(e) => update({ baseSpeed: Number(e.target.value) })}
        />
      </label>
      <label className="slider">
        Sprite Size
        <input
          type="range"
          min={0.6}
          max={2}
          step={0.1}
          value={sel.spriteScale ?? 1}
          onChange={(e) => update({ spriteScale: Number(e.target.value) })}
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
    imgSrc: undefined,
    spriteScale: 1,
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
