import React from 'react'

/**
 * Default minimal SVG horse (replaceable). Must be a single <g> group for tinting.
 */
const DefaultHorseSVG = ({ color = '#7c3aed' }) => (
  <g fill={color} stroke="black" strokeWidth="1" strokeOpacity={0.2}>
    <circle cx="10" cy="10" r="10" />
    <rect x="17" y="6" width="12" height="8" rx="2" />
    <polygon points="5,0 12,4 8,8" />
  </g>
)

/**
 * HorseSprite Component
 * Renders a horse sprite using either an image, custom SVG path, or default SVG
 *
 * @param {string} color - Hex color for SVG tinting
 * @param {string} svgPath - Optional custom SVG path
 * @param {string} imgSrc - Optional image source URL
 * @param {number} spriteScale - Scale factor for the sprite
 */
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

export default HorseSprite
