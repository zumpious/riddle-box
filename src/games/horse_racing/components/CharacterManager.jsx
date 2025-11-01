import React, { useState } from 'react'
import { mkHorse, randomColor } from '../utils/raceHelpers'
import { loadHorseImages } from '../utils/assetLoader'
import './CharacterManager.css'

/**
 * CharacterManager Component
 * Manages the permanent character roster and race selection
 * 
 * @param {Array} characterRoster - All available characters
 * @param {Array} selectedIds - IDs of characters selected for current race
 * @param {Function} onRosterChange - Callback when roster is modified
 * @param {Function} onSelectionChange - Callback when selection changes
 */
function CharacterManager({
  characterRoster,
  selectedIds,
  onRosterChange,
  onSelectionChange
}) {
  const [isOpen, setIsOpen] = useState(false)
  const images = loadHorseImages()

  const handleToggleSelection = (characterId) => {
    if (selectedIds.includes(characterId)) {
      // Deselect
      onSelectionChange(selectedIds.filter((id) => id !== characterId))
    } else {
      // Select
      onSelectionChange([...selectedIds, characterId])
    }
  }

  const handleAddNewCharacter = () => {
    const newChar = mkHorse(`Horse ${characterRoster.length + 1}`, randomColor())
    onRosterChange([...characterRoster, { ...newChar, createdAt: Date.now() }])
  }

  const handleDeleteCharacter = (characterId) => {
    const character = characterRoster.find((c) => c.id === characterId)
    if (
      window.confirm(
        `Permanently delete "${character.name}"? This cannot be undone.`
      )
    ) {
      onRosterChange(characterRoster.filter((c) => c.id !== characterId))
      // Also remove from selection
      onSelectionChange(selectedIds.filter((id) => id !== characterId))
    }
  }

  const selectedCount = selectedIds.length
  const totalCount = characterRoster.length

  if (!isOpen) {
    return (
      <button
        className="character-manager-toggle"
        onClick={() => setIsOpen(true)}
        title="Manage character roster"
      >
        🐴 Character Roster ({selectedCount}/{totalCount} selected)
      </button>
    )
  }

  return (
    <div className="character-manager-overlay" onClick={() => setIsOpen(false)}>
      <div
        className="character-manager-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="character-manager-header">
          <h2>🐴 Character Roster</h2>
          <button
            className="character-manager-close"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="character-manager-info">
          <p>
            Manage your permanent horse characters. Select which horses will
            participate in the next race.
          </p>
          <div className="character-manager-stats">
            <span>
              <strong>{selectedCount}</strong> selected for race
            </span>
            <span>
              <strong>{totalCount}</strong> total characters
            </span>
          </div>
        </div>

        <div className="character-manager-list">
          {characterRoster.length === 0 ? (
            <div className="character-manager-empty">
              <p>No characters yet. Add your first horse!</p>
            </div>
          ) : (
            characterRoster.map((character) => {
              const isSelected = selectedIds.includes(character.id)
              return (
                <div
                  key={character.id}
                  className={`character-card ${isSelected ? 'selected' : ''}`}
                >
                  <div
                    className="character-card-select"
                    onClick={() => handleToggleSelection(character.id)}
                    title={
                      isSelected
                        ? 'Click to remove from race'
                        : 'Click to add to race'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="character-checkbox"
                    />
                  </div>

                  <div
                    className="character-card-color"
                    style={{ background: character.color }}
                  />

                  {character.imgSrc && (
                    <img
                      src={character.imgSrc}
                      alt={character.name}
                      className="character-card-image"
                    />
                  )}

                  <div className="character-card-info">
                    <div className="character-card-name">{character.name}</div>
                    <div className="character-card-stats">
                      <span>Speed: {Math.round(character.baseSpeed)}</span>
                      <span>Stamina: {character.stamina}s</span>
                    </div>
                    {character.races > 0 && (
                      <div className="character-card-record">
                        🏆 {character.wins}W / {character.races}R (
                        {((character.wins / character.races) * 100).toFixed(0)}
                        %)
                      </div>
                    )}
                  </div>

                  <button
                    className="character-card-delete"
                    onClick={() => handleDeleteCharacter(character.id)}
                    title="Delete character permanently"
                  >
                    🗑️
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="character-manager-actions">
          <button className="horse-btn" onClick={handleAddNewCharacter}>
            + Add New Character
          </button>
          <button className="horse-btn primary" onClick={() => setIsOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default CharacterManager

