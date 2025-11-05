/**
 * Asset Loading Utilities
 * Handles loading of images and other assets for the horse racing game
 */

/**
 * Load all horse images from the avatars directory
 * @returns {Array} - Array of image objects with label and src
 */
export function loadHorseImages() {
  try {
    const ctx = require.context(
      '../../../img/horse_racing/avatars',
      false,
      /\.(png|jpe?g|gif|webp)$/
    )
    return ctx.keys().map((key) => ({
      label: key.replace('./', ''),
      src: ctx(key)
    }))
  } catch (e) {
    return []
  }
}

/**
 * Try to load background image, returns undefined if not found
 * @returns {string|undefined} - Background image source or undefined
 */
export function loadGrassBackground() {
  try {
    return require('../../../img/horse_racing/background/tisch_sticker.jpeg')
    //return require('../../../img/horse_racing/background/tisch_mit_ecke_neu.png')
  } catch (e) {
    return undefined
  }
}

/**
 * Load specific avatar image by name
 * @param {string} fileName - Image file name (e.g., 'keti.png')
 * @returns {string|undefined} - Image source or undefined
 */
export function loadAvatarImage(fileName) {
  try {
    return require(`../../../img/horse_racing/avatars/${fileName}`)
  } catch (e) {
    return undefined
  }
}
