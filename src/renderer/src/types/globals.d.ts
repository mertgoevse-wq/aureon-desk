/**
 * Global type declarations for the renderer process.
 * Extends the Window interface with our preload API.
 */

import type { IpcApi } from '../../preload/index'

export {}

declare global {
  interface Window {
    api: IpcApi
  }
}
