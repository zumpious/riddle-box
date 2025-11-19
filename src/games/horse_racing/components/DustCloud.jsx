import React from 'react'

/**
 * DustCloudDefs Component
 * SVG definitions for the dust cloud animation (should be placed in <defs>)
 * Contains the animated dust emitter symbol with SMIL animations
 */
export const DustCloudDefs = () => (
  <>
    {/* Dust trail animation - animated SVG */}
    <filter id="dustBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.2" />
    </filter>

    {/* Dust emitter symbol - creates animated dust puffs */}
    <symbol id="dust-emitter" overflow="visible">
      <g className="dust-anim">
        {/* Puff 1 */}
        <circle
          className="dust-puff"
          r="2"
          fill="#c9b69a"
          filter="url(#dustBlur)"
        >
          <animateMotion
            dur="0.8s"
            repeatCount="indefinite"
            path="M0,0 C-12,-3 -34,-7 -66,-10"
          />
          <animate
            attributeName="r"
            values="2;10;13"
            keyTimes="0;0.6;1"
            dur="0.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.75;0.5;0"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Puff 2 */}
        <circle
          className="dust-puff"
          r="2"
          fill="#c9b69a"
          filter="url(#dustBlur)"
        >
          <animateMotion
            begin="0.12s"
            dur="0.9s"
            repeatCount="indefinite"
            path="M0,0 C-10,-1 -30,-4 -60,-7"
          />
          <animate
            attributeName="r"
            values="2;9;12"
            keyTimes="0;0.6;1"
            dur="0.9s"
            begin="0.12s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.7;0.45;0"
            dur="0.9s"
            begin="0.12s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Puff 3 */}
        <circle
          className="dust-puff"
          r="2"
          fill="#c9b69a"
          filter="url(#dustBlur)"
        >
          <animateMotion
            begin="0.24s"
            dur="0.85s"
            repeatCount="indefinite"
            path="M0,0 C-14,0 -32,-6 -62,-9"
          />
          <animate
            attributeName="r"
            values="2;8;11"
            keyTimes="0;0.6;1"
            dur="0.85s"
            begin="0.24s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.65;0.4;0"
            dur="0.85s"
            begin="0.24s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Puff 4 (smaller, falls slightly) */}
        <circle
          className="dust-puff"
          r="1.6"
          fill="#c9b69a"
          filter="url(#dustBlur)"
        >
          <animateMotion
            begin="0.36s"
            dur="0.95s"
            repeatCount="indefinite"
            path="M0,0 C-8,1 -28,0 -56,2"
          />
          <animate
            attributeName="r"
            values="1.6;6;8"
            keyTimes="0;0.55;1"
            dur="0.95s"
            begin="0.36s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0.35;0"
            dur="0.95s"
            begin="0.36s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Puff 5 (tiny grit) */}
        <circle
          className="dust-puff"
          r="1.2"
          fill="#c9b69a"
          filter="url(#dustBlur)"
        >
          <animateMotion
            begin="0.48s"
            dur="0.7s"
            repeatCount="indefinite"
            path="M0,0 C-18,-4 -36,-6 -54,-8"
          />
          <animate
            attributeName="r"
            values="1.2;3.5;4.5"
            keyTimes="0;0.6;1"
            dur="0.7s"
            begin="0.48s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.55;0.3;0"
            dur="0.7s"
            begin="0.48s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </symbol>
  </>
)

/**
 * DustCloud Component
 * Renders animated dust clouds behind a horse using SMIL animations
 * Creates a layered effect with three emitter instances at different scales
 *
 * @param {boolean} visible - Whether the dust cloud should be visible
 */
function DustCloud({ visible = true }) {
  if (!visible) return null

  return (
    <g className="dust-clouds">
      {/* Three layered emitters for richer trail effect */}
      {/* Positioned behind the horse (negative X) as horse runs forward */}
      <use
        href="#dust-emitter"
        transform="translate(-15, 25) scale(1.2, 1.2)"
      />
      <use
        href="#dust-emitter"
        transform="translate(-17, 28) scale(1.0, 1.0)"
      />
      <use
        href="#dust-emitter"
        transform="translate(-13, 23) scale(0.9, 0.9)"
      />
    </g>
  )
}

export default DustCloud
