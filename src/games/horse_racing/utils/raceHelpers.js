/**
 * Race Helper Utilities
 * Contains utility functions for race calculations and random number generation
 */

/**
 * Linear Congruential Generator (LCG) for deterministic random numbers
 * @param {number} seed - Initial seed value
 * @returns {Function} - Function that returns random number between 0 and 1
 */
export function lcg(seed) {
  let state = seed >>> 0 || 123456789
  return () => (state = (1664525 * state + 1013904223) >>> 0) / 2 ** 32
}

/**
 * Convert milliseconds to clock format (MM:SS.CS)
 * @param {number} ms - Milliseconds
 * @returns {string} - Formatted time string
 */
export function msToClock(ms) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(
    cs
  ).padStart(2, '0')}`
}

/**
 * Generate a unique ID
 * @returns {string} - Unique identifier
 */
export function mkId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Create a new horse object with default values
 * @param {string} name - Horse name
 * @param {string} color - Horse color (hex)
 * @param {number} number - Horse racing number (optional)
 * @returns {Object} - Horse object
 */
export function mkHorse(name, color, number) {
  const id = mkId()
  return {
    id,
    name,
    color,
    number: number || 1, // Racing number (like real horse racing)
    imgSrc: undefined,
    imgFileName: undefined,
    spriteScale: 4,
    baseSpeed: 100 + Math.random() * 40,
    stamina: 12 + Math.random() * 12,
    variance: 0.18 + Math.random() * 0.12,
    agility: 0.3 + Math.random() * 0.5, // 0.3 to 0.8 - jumping/obstacle navigation ability
    progress: 0,
    rngSeed: Math.floor(Math.random() * 1e9),
    // Stats
    wins: 0,
    races: 0,
    totalTime: 0
  }
}

/**
 * Generate a random color from predefined palette
 * @returns {string} - Hex color code
 */
export function randomColor() {
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

/**
 * Get the next available horse number from existing roster
 * @param {Array} characterRoster - Array of existing characters
 * @returns {number} - Next available number (1-based)
 */
export function getNextHorseNumber(characterRoster) {
  if (!characterRoster || characterRoster.length === 0) {
    return 1
  }

  // Find the highest existing number
  const maxNumber = characterRoster.reduce((max, char) => {
    const num = char.number || 0
    return num > max ? num : max
  }, 0)

  return maxNumber + 1
}
