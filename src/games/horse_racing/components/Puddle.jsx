import React from 'react'

/**
 * PuddleDefs Component
 * SVG definitions for the water puddle obstacle (should be placed in <defs>)
 */
export const PuddleDefs = () => (
  <>
    <style>
      {`
        .puddle-group { filter: url(#puddleShadow); }
        .puddle-ripple {
          fill: none; 
          stroke: #1b6fb8; 
          stroke-width: 2; 
          opacity: .45;
          transform-origin: center;
          animation: puddleRipple 4s linear infinite;
        }
        .puddle-ripple.r2 { animation-delay: 2s; opacity: .35; }
        @keyframes puddleRipple {
          0%   { transform: scale(0.9); opacity: .45; }
          70%  { opacity: .12; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .puddle-spawn { 
          animation: puddlePop .35s ease-out both; 
          transform-origin: center;
        }
        @keyframes puddlePop {
          0%   { transform: scale(.8);  opacity: 0; }
          60%  { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        .puddle-drop { 
          fill: #7fd7ff; 
          opacity: 0; 
        }
        .puddle-drop.d1 { animation: puddleDrop .5s ease-out .05s both; }
        .puddle-drop.d2 { animation: puddleDrop .5s ease-out .12s both; }
        .puddle-drop.d3 { animation: puddleDrop .5s ease-out .18s both; }
        @keyframes puddleDrop {
          0%   { transform: translate(0,0);   opacity: 0; }
          20%  { transform: translate(0,-12px); opacity: 1; }
          100% { transform: translate(0,0);   opacity: 0; }
        }
        .puddle-fade-out {
          animation: puddleFadeOut 1s ease-out forwards;
        }
        @keyframes puddleFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}
    </style>

    {/* Soft shadow for puddle */}
    <filter id="puddleShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b" />
      <feOffset in="b" dy="2" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0   0 0 0 0 0.18   0 0 0 0 0.33   0 0 0 .35 0"
      />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Water gradient */}
    <radialGradient id="puddleWater" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stopColor="#7fd7ff" />
      <stop offset="100%" stopColor="#2aa1ff" />
    </radialGradient>
  </>
)

/**
 * Puddle Component
 * Renders a static water puddle obstacle on the track (for debugging)
 *
 * @param {boolean} visible - Whether the puddle should be visible
 * @param {boolean} disappearing - Whether the puddle is fading out
 */
function Puddle({ visible = true, disappearing = false }) {
  if (!visible) return null

  // Puddle SVG viewBox is "0 0 200 110"
  // The puddle blob center is approximately at (100, 68) based on the path coordinates
  // SVG transforms are applied right-to-left, so we need to:
  // 1. Translate down by offsetY (applied last)
  // 2. Scale down (applied second)
  // 3. Translate to center at (0,0) (applied first)
  const scale = 0.4
  const centerX = 100 // Center of puddle in viewBox coordinates (middle of width)
  const centerY = 68 // Visual center of puddle blob (estimated from path)
  const offsetY = 28 // Move down a few pixels to align properly on track

  return (
    <g
      className={`puddle-container ${disappearing ? 'puddle-fade-out' : ''}`}
      transform={`translate(0, ${offsetY}) scale(${scale}) translate(${-centerX}, ${-centerY})`}
    >
      {/* Main puddle shape */}
      <g>
        <path
          fill="url(#puddleWater)"
          stroke="#1b6fb8"
          strokeWidth="2"
          d="M27,68c0,-18 20,-26 38,-28c11,-1 20,-7 32,-8c19,-2 39,7 49,16c8,7 12,20 2,28
             c-10,8 -24,11 -48,12c-22,1 -38,1 -53,-2c-14,-3 -20,-9 -20,-18z"
        />
        {/* Subtle inner highlight */}
        <path
          fill="white"
          opacity="0.18"
          d="M47,63c1,-8 10,-12 19,-14c7,-1 13,-3 21,-3c12,0 23,4 29,8c4,3 5,7 1,10
             c-6,5 -17,7 -33,8c-15,1 -27,1 -37,-1c-6,-2 -8,-5 0,-8z"
        />
      </g>
    </g>
  )
}

export default Puddle
