import React from 'react'
import { exportConfig, importConfig } from '../utils/configStorage'
import { loadHorseImages, loadAvatarImage } from '../utils/assetLoader'
import { mkHorse } from '../utils/raceHelpers'
import { DEFAULT_HORSES } from '../constants'
import './ConfigManager.css'

/**
 * ConfigManager Component
 * Handles configuration import, export, and reset functionality
 *
 * @param {Array} horses - Current array of horse objects
 * @param {Function} onHorsesChange - Callback to update horses
 */
function ConfigManager({ horses, onHorsesChange }) {
  const handleExport = () => {
    exportConfig(horses)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      importConfig(file, (config) => {
        const availableImages = loadHorseImages()
        const loadedHorses = config.map((cfg) => {
          let imgSrc = cfg.imgSrc
          if (cfg.imgFileName) {
            const match = availableImages.find(
              (img) => img.label === cfg.imgFileName
            )
            if (match) imgSrc = match.src
          }
          return {
            ...cfg,
            imgSrc,
            progress: 0,
            finishedAtMs: null
          }
        })
        onHorsesChange(loadedHorses)
      })
    }
    e.target.value = '' // Reset input
  }

  const handleReset = () => {
    if (
      window.confirm(
        'Reset to default horses (Keti & Reudo)? This will clear all stats.'
      )
    ) {
      const defaultHorses = DEFAULT_HORSES.map((cfg) => ({
        ...mkHorse(cfg.name, cfg.color),
        imgSrc: loadAvatarImage(cfg.fileName),
        imgFileName: cfg.fileName
      }))
      onHorsesChange(defaultHorses)
    }
  }

  return (
    <div className="config-manager">
      <button
        className="horse-btn"
        onClick={handleExport}
        title="Export configuration to JSON file"
      >
        💾 Export Config
      </button>
      <label className="horse-btn config-import-label">
        📁 Import Config
        <input
          type="file"
          accept=".json"
          className="config-file-input"
          onChange={handleImport}
        />
      </label>
      <button
        className="horse-btn"
        onClick={handleReset}
        title="Reset to default configuration"
      >
        🔄 Reset to Default
      </button>
    </div>
  )
}

export default ConfigManager
