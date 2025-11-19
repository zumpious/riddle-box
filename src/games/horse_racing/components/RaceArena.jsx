import React, { useEffect, useRef, useState } from 'react'
import HorseSprite from './HorseSprite'
import HorseIntroduction from './HorseIntroduction'
import DustCloud, { DustCloudDefs } from './DustCloud'
import Puddle, { PuddleDefs } from './Puddle'
import { loadGrassBackground } from '../utils/assetLoader'
import {
  ARENA_WIDTH,
  EDGE_MARGIN,
  MIN_LANE_GAP,
  LANE_GAP_MULTIPLIER
} from '../constants'
import './RaceArena.css'
import finishLineImg from '../../../img/horse_racing/background/finish_line.png'
import sweatDropImg from '../../../img/horse_racing/background/sweat.png'

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
 * @param {number} startTime - Race start timestamp for live time calculation
 * @param {number} introductionIndex - Current horse being introduced
 * @param {boolean} introductionComplete - Whether all introductions are complete
 * @param {string} introNavDirection - Direction of navigation ('right' or 'left')
 * @param {Array} puddles - Array of puddle obstacles
 * @param {number} syncedCurrentTime - Synchronized current time from main window (for presenter mode)
 * @param {boolean} showShuffleNotification - Whether to show dice roll notification
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
  spriteScaleDefault,
  startTime,
  introductionIndex,
  introductionComplete,
  introNavDirection,
  puddles,
  syncedCurrentTime,
  showShuffleNotification
}) {
  const arenaWrapRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

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

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      arenaWrapRef.current?.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // Listen for fullscreen changes (including ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Keyboard shortcut: F key to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if not typing in an input
      const isTyping =
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable

      if (!isTyping && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Update current time during race for live time display
  useEffect(() => {
    // Reset time when not running or finished
    if (status !== 'running' && status !== 'finished') {
      setCurrentTime(0)
      return
    }

    // If finished, keep the last time - don't update
    if (status === 'finished') {
      return
    }

    // Only update during 'running' status
    if (!startTime) return

    let animFrame = 0
    const updateTime = () => {
      // Use syncedCurrentTime if available (presenter mode), otherwise use performance.now()
      const currentTimeForCalc = syncedCurrentTime ?? performance.now()
      const elapsed = (currentTimeForCalc - startTime) / 1000 // Convert to seconds
      setCurrentTime(elapsed)
      animFrame = requestAnimationFrame(updateTime)
    }

    animFrame = requestAnimationFrame(updateTime)
    return () => cancelAnimationFrame(animFrame)
  }, [status, startTime, syncedCurrentTime])

  return (
    <div
      ref={arenaWrapRef}
      className={`arena-wrap ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Fullscreen toggle button */}
      <button
        className="fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen (F or ESC)' : 'Fullscreen (F)'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>

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

          {/* Dust cloud animation definitions */}
          <DustCloudDefs />

          {/* Puddle obstacle definitions */}
          <PuddleDefs />
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
        {/* finishPose is at trackCenterR; center image spans full track width */}
        <g
          transform={`translate(${finishPose.x}, ${finishPose.y}) rotate(${finishRotDeg})`}
        >
          <image
            href={finishLineImg}
            x={-(outerR - innerR) / 2}
            y={-15}
            width={outerR - innerR}
            height={30}
            preserveAspectRatio="none"
          />
        </g>

        {/* Live time display - shown always when horses exist */}
        {horses.length > 0 && (
          <g>
            {horses.map((h, idx) => {
              // Calculate positions across the top in inner area
              const numHorses = horses.length
              const spacing = Math.min(220, (W - 100) / numHorses)
              const startX = cx - ((numHorses - 1) * spacing) / 2
              const x = startX + idx * spacing

              // Position in the inner grass area (below the track)
              const yPosition = cy - innerR + 50

              // Get current time or finished time (or 0.00 before race starts)
              const displayTime = h.finishedAtMs
                ? (h.finishedAtMs / 1000).toFixed(2)
                : currentTime.toFixed(2)

              // Calculate dynamic pill width based on content
              const padding = 12 // padding on each side
              const nameText = `#${h.number} ${h.name}`
              const timeText = `${displayTime}s`

              // Estimate width for each line (using different font sizes)
              const nameCharWidth = 6.8 // font size 11, weight 700
              const timeCharWidth = 6.2 // font size 10, weight 600
              const nameWidth = nameText.length * nameCharWidth
              const timeWidth = timeText.length * timeCharWidth

              // Use the wider of the two texts
              const contentWidth = Math.max(nameWidth, timeWidth)
              const pillWidth = contentWidth + padding * 2
              const pillHeight = 32

              return (
                <g key={h.id}>
                  {/* Background pill - dynamic width */}
                  <rect
                    x={x - pillWidth / 2}
                    y={yPosition}
                    width={pillWidth}
                    height={pillHeight}
                    rx={16}
                    fill={h.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={0.95}
                  />
                  {/* Horse number and name */}
                  <text
                    x={x}
                    y={yPosition + 15}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight={700}
                    fill="#ffffff"
                  >
                    #{h.number} {h.name}
                  </text>
                  {/* Time */}
                  <text
                    x={x}
                    y={yPosition + 26}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={600}
                    fill="#ffffff"
                  >
                    {displayTime}s
                  </text>
                </g>
              )
            })}
          </g>
        )}

        {/* Center lap indicator */}
        {horses.length > 0 && !horses.some((h) => h.finishedAtMs) && (
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

        {/* Winner display - shown as soon as first horse finishes */}
        {horses.length > 0 &&
          (() => {
            // Find the winner (first horse to finish - lowest finishedAtMs)
            const winner = horses.reduce((best, h) => {
              if (!h.finishedAtMs) return best
              if (!best || h.finishedAtMs < best.finishedAtMs) return h
              return best
            }, null)

            if (!winner) return null

            // Format time: convert milliseconds to seconds with 2 decimal places
            const timeInSeconds = (winner.finishedAtMs / 1000).toFixed(2)

            // Calculate dynamic pill width based on content
            const padding = 20 // padding on each side
            const titleText = '🏆'
            const winnerText = `#${winner.number} ${winner.name}: ${timeInSeconds}s`

            // Estimate width for each line (using different font sizes)
            const titleCharWidth = 8.5 // font size 14, weight 600 (includes emoji)
            const winnerCharWidth = 13.5 // font size 22, weight 800
            const titleWidth = titleText.length * titleCharWidth
            const winnerWidth = winnerText.length * winnerCharWidth

            // Use the wider of the two texts
            const contentWidth = Math.max(titleWidth, winnerWidth)
            const pillWidth = contentWidth + padding * 2
            const pillHeight = 56

            return (
              <g>
                {/* Background pill for winner - dynamic width */}
                <rect
                  x={cx - pillWidth / 2}
                  y={cy - 28}
                  width={pillWidth}
                  height={pillHeight}
                  rx={28}
                  fill={winner.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  opacity={0.9}
                />
                {/* Winner text */}
                <text
                  x={cx}
                  y={cy - 2}
                  textAnchor="middle"
                  fontSize="24"
                  fontWeight={600}
                  fill="#ffffff"
                >
                  🏆
                </text>
                <text
                  x={cx}
                  y={cy + 18}
                  textAnchor="middle"
                  fontSize="22"
                  fontWeight={800}
                  fill="#ffffff"
                >
                  #{winner.number} {winner.name}: {timeInSeconds}s
                </text>
              </g>
            )
          })()}

        {/* Puddles - render on track before horses */}
        {puddles && puddles.length > 0 ? (
          <>
            {puddles.map((puddle) => {
              // Find the horse index that matches this puddle
              const horseIdx = horses.findIndex((h) => h.id === puddle.horseId)
              if (horseIdx === -1 || !puddle.spawned) {
                return null
              }

              const Rlane = laneMidR(horseIdx)
              const PL = laneMidPerimeter(horseIdx)

              // Apply start offset for this lane (same as horse)
              // puddle.position is in progress units (0 to totalDistance), same as h.progress
              // We map it exactly like horse progress
              const startOffset = getStartOffset(horseIdx)
              const adjustedPuddlePos = puddle.position + startOffset

              // Map puddle position on this lane's oval (same calculation as horses)
              const sLane = ((adjustedPuddlePos % PL) + PL) % PL
              const p = poseOnStadium(sLane, Rlane, straightLen)
              const rotDeg = (p.headingRad * 180) / Math.PI

              // Check if puddle should be disappearing
              // Use syncedCurrentTime if available (presenter mode), otherwise use performance.now()
              const now = syncedCurrentTime ?? performance.now()
              const isDisappearing =
                puddle.disappearAt && now >= puddle.disappearAt

              return (
                <g
                  key={`puddle-${puddle.horseId}`}
                  transform={`translate(${p.x}, ${p.y}) rotate(${rotDeg})`}
                >
                  <Puddle visible={true} disappearing={isDisappearing} />
                </g>
              )
            })}
          </>
        ) : null}

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

          // Calculate animation transforms
          let animationTransform = ''
          if (h.jumping) {
            // Jump animation - arc up and down
            // Use syncedCurrentTime if available (presenter mode), otherwise use performance.now()
            const currentTimeForAnimation =
              syncedCurrentTime ?? performance.now()
            const jumpProgress = h.jumpStartTime
              ? Math.min(1, (currentTimeForAnimation - h.jumpStartTime) / 600) // 600ms = JUMP_ANIMATION_DURATION in ms
              : 0
            // Parabolic arc: reaches peak at 0.5, lands at 1.0
            const jumpHeight = -30 * Math.sin(jumpProgress * Math.PI) // Max height 30px up
            animationTransform = `translate(0, ${jumpHeight})`
          } else if (h.falling) {
            // Fall animation - rotate 90 degrees (horse on its side)
            animationTransform = 'rotate(90)'
          }

          return (
            <g
              key={h.id}
              transform={`translate(${p.x}, ${p.y}) rotate(${rotDeg})`}
            >
              {/* Horse sprite with jump/fall animation */}
              <g transform={animationTransform}>
                <HorseSprite
                  color={h.color}
                  svgPath={h.svgPath}
                  imgSrc={h.imgSrc}
                  spriteScale={h.spriteScale ?? spriteScaleDefault}
                />
                {/* Dust clouds when running/accelerating (part of animated group) */}
                <DustCloud visible={h.showingDust && !h.falling} />
              </g>

              {/* Racing number badge - shown on track (not animated) */}
              <g transform={`translate(-40, 25)`} pointerEvents="none">
                {/* Circle background */}
                <circle
                  cx={0}
                  cy={0}
                  r={12}
                  fill={h.color}
                  opacity={0.95}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
                {/* Number text */}
                <text
                  x={0}
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="#ffffff"
                  fontWeight={900}
                >
                  #{h.number}
                </text>
              </g>

              {/* Sweat drops when recovering */}
              {h.recovering &&
                (() => {
                  // Add randomness to animation - use horse ID to deterministically vary the animation
                  const seed = h.id
                    .split('')
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
                  const animVariant = (seed % 3) + 1 // Random variant 1, 2, or 3
                  const delayOffset = (seed % 5) * 0.1 // Random delay 0-0.4s

                  return (
                    <g className="sweat-drops">
                      {/* Left sweat drop */}
                      <image
                        href={sweatDropImg}
                        className={`sweat-drop sweat-drop-left-${animVariant}`}
                        x={-25}
                        y={-50}
                        width={18}
                        height={18}
                        opacity={0.85}
                        style={{ animationDelay: `${delayOffset}s` }}
                      />
                      {/* Right sweat drop */}
                      <image
                        href={sweatDropImg}
                        className={`sweat-drop sweat-drop-right-${animVariant}`}
                        x={15}
                        y={-50}
                        width={18}
                        height={18}
                        opacity={0.85}
                        style={{ animationDelay: `${delayOffset + 0.6}s` }}
                      />
                    </g>
                  )
                })()}
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

        {/* Shuffle notification - slides in from top-left */}
        {showShuffleNotification && (
          <g className="shuffle-notification">
            {/* Notification pill positioned in top-left corner */}
            <rect
              x={30}
              y={40}
              width={180}
              height={70}
              rx={35}
              fill="#10b981"
              opacity={0.95}
              stroke="#ffffff"
              strokeWidth={3}
            />
            {/* Dice emoji */}
            <text
              x={75}
              y={75}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="40"
              fontWeight={800}
            >
              🎲
            </text>
            {/* Text */}
            <text
              x={140}
              y={75}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              fontWeight={700}
              fill="white"
            >
              Shuffled!
            </text>
          </g>
        )}
      </svg>

      {/* Horse Introduction Overlay - inside arena-wrap for fullscreen visibility */}
      {status === 'introduction' && horses.length > 0 && (
        <HorseIntroduction
          horses={horses}
          currentIndex={introductionIndex}
          allComplete={introductionComplete}
          navDirection={introNavDirection}
        />
      )}
    </div>
  )
}

export default RaceArena
