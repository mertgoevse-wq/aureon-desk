/**
 * Hook that provides typed access to the Electron IPC API.
 * Uses the window.api object exposed by the preload script.
 */

export function useIpc() {
  if (!window.api) {
    throw new Error(
      'IPC API is not available. This hook must be used within an Electron renderer.'
    )
  }
  return window.api
}

/**
 * Import window.api type declaration
 */
export type IpcApi = typeof window.api
