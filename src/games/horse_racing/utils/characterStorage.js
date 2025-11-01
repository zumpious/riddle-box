/**
 * Character Roster Storage
 * Manages permanent horse characters that can be selected for races
 */

const ROSTER_STORAGE_KEY = 'horse-racing-character-roster'
const SELECTION_STORAGE_KEY = 'horse-racing-selected-characters'

/**
 * Save the complete character roster
 * @param {Array} characters - Array of character objects
 */
export function saveCharacterRoster(characters) {
  const roster = characters.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    imgSrc: c.imgSrc,
    imgFileName: c.imgFileName,
    spriteScale: c.spriteScale,
    baseSpeed: c.baseSpeed,
    stamina: c.stamina,
    variance: c.variance,
    // Stats
    wins: c.wins || 0,
    races: c.races || 0,
    totalTime: c.totalTime || 0,
    // Creation date
    createdAt: c.createdAt || Date.now()
  }))
  localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster))
}

/**
 * Load the complete character roster
 * @returns {Array|null} - Array of character objects or null
 */
export function loadCharacterRoster() {
  try {
    const data = localStorage.getItem(ROSTER_STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data)
  } catch (e) {
    console.error('Failed to load character roster:', e)
    return null
  }
}

/**
 * Save which character IDs are selected for the current race
 * @param {Array} characterIds - Array of character IDs
 */
export function saveSelectedCharacters(characterIds) {
  localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(characterIds))
}

/**
 * Load which character IDs are selected for the current race
 * @returns {Array|null} - Array of character IDs or null
 */
export function loadSelectedCharacters() {
  try {
    const data = localStorage.getItem(SELECTION_STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data)
  } catch (e) {
    console.error('Failed to load selected characters:', e)
    return null
  }
}

/**
 * Add a new character to the roster
 * @param {Object} character - Character object
 * @returns {Array} - Updated roster
 */
export function addCharacterToRoster(character) {
  const roster = loadCharacterRoster() || []
  const newCharacter = {
    ...character,
    createdAt: Date.now()
  }
  roster.push(newCharacter)
  saveCharacterRoster(roster)
  return roster
}

/**
 * Remove a character from the roster permanently
 * @param {string} characterId - Character ID to remove
 * @returns {Array} - Updated roster
 */
export function removeCharacterFromRoster(characterId) {
  const roster = loadCharacterRoster() || []
  const updated = roster.filter((c) => c.id !== characterId)
  saveCharacterRoster(updated)

  // Also remove from selection if selected
  const selected = loadSelectedCharacters() || []
  const updatedSelection = selected.filter((id) => id !== characterId)
  saveSelectedCharacters(updatedSelection)

  return updated
}

/**
 * Update a character in the roster
 * @param {string} characterId - Character ID to update
 * @param {Object} updates - Fields to update
 * @returns {Array} - Updated roster
 */
export function updateCharacterInRoster(characterId, updates) {
  const roster = loadCharacterRoster() || []
  const updated = roster.map((c) =>
    c.id === characterId ? { ...c, ...updates } : c
  )
  saveCharacterRoster(updated)
  return updated
}

/**
 * Export character roster to JSON file
 * @param {Array} characters - Array of character objects
 */
export function exportCharacterRoster(characters) {
  const blob = new Blob([JSON.stringify(characters, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `horse-racing-roster-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Import character roster from JSON file
 * @param {File} file - File object to import
 * @param {Function} callback - Callback with parsed roster
 */
export function importCharacterRoster(file, callback) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const roster = JSON.parse(e.target.result)
      callback(roster)
    } catch (err) {
      console.error('Failed to parse roster:', err)
      alert('Invalid roster file')
    }
  }
  reader.readAsText(file)
}
