import React from 'react'
import HorseSprite from './HorseSprite'
import { loadGrassBackground } from '../utils/assetLoader'
import {
  ARENA_WIDTH,
  EDGE_MARGIN,
  MIN_LANE_GAP,
  LANE_GAP_MULTIPLIER
} from '../constants'
import './RaceArena.css'

// Try to load background image, fallback to undefined
const grassBg = loadGrassBackground()

/**
 * RaceArena Component
 * Renders the racing track with horses, lap indicators, and countdown
 *
 * @param {Array} horses - Array of horse objects with progress
 * @param {number} totalDistance - Total race distance in pixels
 * @param {string} status - Current race status
 * @param {number} countdown - Countdown value
 * @param {number} lapLengthPx - Length of one lap
 * @param {number} laps - Number of laps
 * @param {number} arenaHeight - Arena height in pixels
 * @param {number} trackThickness - Track thickness value (unused, kept for API compatibility)
 * @param {number} spriteScaleDefault - Default sprite scale
 */
function RaceArena({
  horses,
  totalDistance,
  status,
  countdown,
  lapLengthPx,
  laps,
  arenaHeight,
  trackThickness,
  spriteScaleDefault
}) {
  // Landscape SVG viewport
  const W = ARENA_WIDTH
  const H = arenaHeight || 700
  const cx = W / 2
  const cy = H / 2

  // ============================================================================
  // TRACK SIZING - Inward Expansion Strategy
  // ============================================================================
  // When adding horses/lanes:
  // - Outer track edge stays FIXED at maximum viewport size
  // - New lanes expand INWARD (filling the center empty space)
  // - Lane spacing (laneGap) stays consistent
  // - Each lane has different perimeter (inner = shorter, outer = longer)
  // - Start offsets ensure all horses travel same distance & finish together
  // ============================================================================

  const lanes = Math.max(1, horses.length)
  const edgeMargin = EDGE_MARGIN

  // Fix the outer radius at maximum (fills viewport)
  const outerR = Math.max(60, H / 2 - edgeMargin)

  // Compute straight length to fill width
  const straightLen = Math.max(120, W - 2 * edgeMargin - 2 * outerR)

  // Calculate lane gap based on sprite size
  const laneGap = Math.max(
    MIN_LANE_GAP,
    LANE_GAP_MULTIPLIER * (spriteScaleDefault || 3)
  )

  // Total track thickness expands inward as we add lanes
  const trackThicknessVal = laneGap * (lanes + 1)

  // Inner radius shrinks as we add more lanes (expanding inward)
  const innerR = Math.max(30, outerR - trackThicknessVal)

  // Base midline radius for reference (used for finish line and lap calculations)
  const baseMidR = (outerR + innerR) / 2

  // Perimeter of an oval with radius R and straight length L
  const perimeter = (R, L) => 2 * L + 2 * Math.PI * R

  // Midline perimeter (used for distance mapping per lap)
  const midPerimeter = perimeter(baseMidR, straightLen)

  // Finish line is placed at track center, positioned where Lane 0 finishes
  // Calculate sFinish based on Lane 0's perimeter (reference for all horses)
  const lane0R = outerR - laneGap
  const lane0Perimeter = perimeter(lane0R, straightLen)
  const sFinishLane0 =
    ((totalDistance % lane0Perimeter) + lane0Perimeter) % lane0Perimeter

  // Convert this to the equivalent position at trackCenterR for drawing
  const trackCenterR = (innerR + outerR) / 2
  const trackCenterPerimeter = perimeter(trackCenterR, straightLen)
  const sFinish = (sFinishLane0 / lane0Perimeter) * trackCenterPerimeter

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

  // NEW: Each lane expands inward from the outer edge
  // Lane 0 (outermost) is closest to outerR
  // Lane i has midline at: outerR - (i + 1) * laneGap
  const laneMidR = (i) => outerR - (i + 1) * laneGap

  // Calculate perimeter for each lane (inner lanes are shorter)
  const laneMidPerimeter = (i) => perimeter(laneMidR(i), straightLen)

  // For fair racing: calculate start offset so all horses finish at black line together
  // Strategy:
  // - The finish line is at angular position: sFinishLane0 / lane0Perimeter (fraction of Lane 0)
  // - All horses must be at this same angular fraction when progress = totalDistance
  // - For lane i: (totalDistance + offset) % lanePerim should equal sFinish_scaled
  //   where sFinish_scaled = (sFinishLane0 / lane0Perimeter) * lanePerim
  const getStartOffset = (laneIndex) => {
    const lanePerim = laneMidPerimeter(laneIndex)
    const lane0Perim = laneMidPerimeter(0)

    // Angular position of finish line (as fraction of lap)
    const finishAngleFraction = sFinishLane0 / lane0Perim

    // Where this angular position falls on this lane
    const sFinishOnThisLane = finishAngleFraction * lanePerim

    // We want: (totalDistance + offset) % lanePerim = sFinishOnThisLane
    // So: offset = sFinishOnThisLane - (totalDistance % lanePerim)
    const rawOffset = sFinishOnThisLane - (totalDistance % lanePerim)

    // Normalize offset to be positive
    return ((rawOffset % lanePerim) + lanePerim) % lanePerim
  }

  // Lap indicator: leader's lap vs total laps in this race
  const leaderProgress = Math.max(0, ...horses.map((h) => h.progress))
  const totalLaps = Math.max(1, Math.ceil(totalDistance / midPerimeter))
  const currLap = Math.min(
    totalLaps,
    Math.floor(leaderProgress / midPerimeter) + 1
  )

  // Finish line transform: perpendicular to heading at sFinish at track center
  const finishPose = poseOnStadium(sFinish, trackCenterR, straightLen)
  const finishRotDeg = (finishPose.headingRad * 180) / Math.PI + 90 // perpendicular to tangent

  return (
    <div className="arena-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="arena-svg">
        <defs>
          {/* Grass background gradient (fallback) */}
          <radialGradient id="grassGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#e2fbe2" />
            <stop offset="100%" stopColor="#c0f0c0" />
          </radialGradient>
          {/* Track gradient */}
          <linearGradient id="track" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a8846e" />
            <stop offset="100%" stopColor="#9B7653" />
          </linearGradient>
        </defs>

        {/* Background - use image if available, otherwise gradient */}
        {grassBg ? (
          <>
            <image
              href={grassBg}
              x="0"
              y="0"
              width={W}
              height={H}
              preserveAspectRatio="xMidYMid slice"
            />
            {/* Semi-transparent overlay for softer look */}
            <rect
              x="0"
              y="0"
              width={W}
              height={H}
              fill="white"
              opacity="0.15"
            />
          </>
        ) : (
          <rect x="0" y="0" width={W} height={H} fill="url(#grassGradient)" />
        )}

        {/* Track fill (outer minus inner) */}
        <path d={stadiumPath(outerR, straightLen)} fill="url(#track)" />
        {grassBg ? (
          <>
            <image
              href={grassBg}
              x="0"
              y="0"
              width={W}
              height={H}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#innerClip)"
            />
            {/* Semi-transparent overlay for inner area */}
            <path
              d={stadiumPath(innerR, straightLen)}
              fill="brown"
              opacity="0.15"
            />
          </>
        ) : (
          <path
            d={stadiumPath(innerR, straightLen)}
            fill="url(#grassGradient)"
          />
        )}

        {/* Clip path for inner grass area */}
        <defs>
          <clipPath id="innerClip">
            <path d={stadiumPath(innerR, straightLen)} />
          </clipPath>
        </defs>

        {/* Lane guides */}
        {Array.from({ length: lanes }).map((_, i) => (
          <path
            key={i}
            d={stadiumPath(laneMidR(i), straightLen)}
            fill="none"
            stroke="#f5f5f5"
            strokeDasharray="6 8"
          />
        ))}

        {/* Start/Finish line, placed where the configured race would end */}
        {/* Line spans from innerR to outerR, perpendicular to track at finish position */}
        {/* finishPose is at trackCenterR; center rectangle spans full track width */}
        <g
          transform={`translate(${finishPose.x}, ${finishPose.y}) rotate(${finishRotDeg})`}
        >
          <rect
            x={-(outerR - innerR) / 2}
            y={-3}
            width={outerR - innerR}
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
          const PL = laneMidPerimeter(idx)

          // Apply start offset for this lane so all horses finish together
          const startOffset = getStartOffset(idx)
          const adjustedProgress = h.progress + startOffset

          // Map progress to position on this lane's oval
          const sLane = ((adjustedProgress % PL) + PL) % PL
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
                spriteScale={h.spriteScale ?? spriteScaleDefault}
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

export default RaceArena
