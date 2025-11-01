/**
 * Constants for Horse Racing Game
 * Centralized configuration values and default settings
 */

// Default race settings
export const DEFAULT_LAP_LENGTH = 1600 // pixels (virtual units)
export const DEFAULT_LAPS = 1
export const DEFAULT_RACE_NAME = 'Birthday Grand Prix'
export const DEFAULT_COUNTDOWN = 3 // seconds

// Display settings
export const DEFAULT_ARENA_HEIGHT = 800
export const DEFAULT_TRACK_THICKNESS = 240
export const DEFAULT_SPRITE_SCALE = 5

// Arena dimensions
export const ARENA_WIDTH = 1500
export const EDGE_MARGIN = 24

// Track settings
export const MIN_LANE_GAP = 30
export const LANE_GAP_MULTIPLIER = 10

// Race mechanics
export const VARIANCE_MULTIPLIER = 20 // px/s
export const FATIGUE_MULTIPLIER = 12 // px/s penalty
export const MIN_SPEED = 10 // px/s
export const SPRINT_THRESHOLD = 0.995 // probability threshold for sprint
export const STUMBLE_THRESHOLD = 0.005 // probability threshold for stumble
export const SPRINT_BOOST = 90 // px/s
export const STUMBLE_PENALTY = -60 // px/s

// Default horse configurations
export const DEFAULT_HORSES = [
  {
    name: 'Keti',
    color: '#ec4899',
    fileName: 'keti.png'
  },
  {
    name: 'Reudo',
    color: '#8b5e3c',
    fileName: 'reudo.png'
  }
]

// Race status values
export const RACE_STATUS = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  RUNNING: 'running',
  FINISHED: 'finished'
}

// Input ranges
export const RANGES = {
  LAPS: { min: 1, max: 50 },
  LAP_LENGTH: { min: 100, step: 50 },
  ARENA_HEIGHT: { min: 600, max: 1000, step: 20 },
  TRACK_THICKNESS: { min: 180, max: 300, step: 5 },
  SPRITE_SCALE: { min: 3, max: 7, step: 0.1 },
  BASE_SPEED: { min: 60, max: 160 },
  SPRITE_SIZE: { min: 2, max: 6, step: 0.1 },
  STAMINA: { min: 5, max: 40 },
  VARIANCE: { min: 0, max: 0.6, step: 0.02 }
}
