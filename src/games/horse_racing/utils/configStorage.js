/**
 * Configuration Storage Utilities
 * Handles saving, loading, importing, and exporting horse racing configurations
 */

const STORAGE_KEY = 'horse-racing-config'

/**
 * Save configuration to localStorage
 * @param {Array} horses - Array of horse objects
 */
export function saveConfig(horses) {
  const config = horses.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    imgSrc: h.imgSrc,
    imgFileName: h.imgFileName, // Store the filename for matching
    spriteScale: h.spriteScale,
    baseSpeed: h.baseSpeed,
    stamina: h.stamina,
    variance: h.variance,
    rngSeed: h.rngSeed,
    // Stats
    wins: h.wins || 0,
    races: h.races || 0,
    totalTime: h.totalTime || 0
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/**
 * Load configuration from localStorage
 * @returns {Array|null} - Array of horse configurations or null if none exists
 */
export function loadConfig() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data)
  } catch (e) {
    console.error('Failed to load config:', e)
    return null
  }
}

/**
 * Export configuration to JSON file
 * @param {Array} horses - Array of horse objects
 */
export function exportConfig(horses) {
  const config = horses.map((h) => ({
    id: h.id,
    name: h.name,
    color: h.color,
    imgFileName: h.imgFileName,
    spriteScale: h.spriteScale,
    baseSpeed: h.baseSpeed,
    stamina: h.stamina,
    variance: h.variance,
    rngSeed: h.rngSeed,
    wins: h.wins || 0,
    races: h.races || 0,
    totalTime: h.totalTime || 0
  }))
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `horse-racing-config-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Import configuration from JSON file
 * @param {File} file - File object to import
 * @param {Function} callback - Callback function with parsed config
 */
export function importConfig(file, callback) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result)
      callback(config)
    } catch (err) {
      console.error('Failed to parse config:', err)
      alert('Invalid configuration file')
    }
  }
  reader.readAsText(file)
}
