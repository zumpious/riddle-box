import { useEffect, useRef } from 'react'

/**
 * Custom hook to broadcast race state to presenter window via BroadcastChannel
 * This runs in the main control window and sends updates to any connected presenter windows
 *
 * @param {Object} state - The complete state object to broadcast
 */
export const useBroadcastState = (state) => {
  const channelRef = useRef(null)
  const latestStateRef = useRef(state)

  // Keep latest state in ref for message handler access
  useEffect(() => {
    latestStateRef.current = state
  })

  // Initialize BroadcastChannel on mount
  useEffect(() => {
    console.log('🔊 Main Window: Initializing BroadcastChannel...')

    try {
      const channel = new BroadcastChannel('horse_racing_sync')
      channelRef.current = channel

      // Listen for requests from presenter window
      channel.onmessage = (event) => {
        const { type } = event.data

        if (type === 'REQUEST_INITIAL_STATE') {
          console.log('📤 Sending initial state to presenter window')
          channel.postMessage({
            type: 'INITIAL_STATE',
            payload: latestStateRef.current
          })
        }
      }

      console.log('✅ BroadcastChannel initialized successfully')
    } catch (error) {
      console.warn(
        '⚠️ BroadcastChannel not supported or failed to initialize:',
        error
      )
    }

    return () => {
      if (channelRef.current) {
        console.log('🔇 Closing BroadcastChannel')
        channelRef.current.close()
        channelRef.current = null
      }
    }
  }, []) // Only initialize once

  // Broadcast state updates whenever state changes
  // Use JSON.stringify for deep comparison to avoid infinite loops from object reference changes
  const stateJSON = JSON.stringify(state)

  useEffect(() => {
    if (!channelRef.current) {
      return
    }

    // Broadcast the updated state
    try {
      channelRef.current.postMessage({
        type: 'STATE_UPDATE',
        payload: JSON.parse(stateJSON)
      })
    } catch (error) {
      console.warn('⚠️ Failed to broadcast state:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateJSON])

  return channelRef
}

/**
 * Opens the presenter window in a new browser window
 * @returns {Window} The opened window reference
 */
export const openPresenterWindow = () => {
  // Calculate dimensions - try to use full screen
  const width = window.screen.width
  const height = window.screen.height

  // Window features for popup
  const features = [
    `width=${width}`,
    `height=${height}`,
    'left=0',
    'top=0',
    'menubar=no',
    'toolbar=no',
    'location=no',
    'status=no',
    'resizable=yes',
    'scrollbars=no'
  ].join(',')

  // Open presenter window
  const presenterWindow = window.open(
    '/horse-racing/presenter',
    'HorseRacingPresenter',
    features
  )

  if (presenterWindow) {
    console.log('✅ Presenter window opened successfully')
    // Focus the new window
    presenterWindow.focus()
  } else {
    console.error('❌ Failed to open presenter window - popup blocked?')
    alert(
      '⚠️ Could not open presenter window.\n\nPlease allow popups for this site and try again.'
    )
  }

  return presenterWindow
}
