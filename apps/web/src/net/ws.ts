/**
 * WebSocket client — real-time connection to the game server.
 *
 * CONCEPT:
 * A WebSocket is like a phone call between browser and server —
 * both sides can talk at any time, unlike HTTP where the client
 * always has to ask first.
 *
 * USAGE in a React component:
 *   const { send, lastMessage } = useGameSocket(sessionId)
 *
 * TODO (TASK T-04-02): wire this into the Game page component.
 */
import { useEffect, useRef, useState } from 'react'
import { getToken } from './api'

const WS_BASE = 'ws://localhost:8000/ws'
const PROTOCOL_VERSION = 1

// ─────────────────────────────────────────────────────────────────────────────
// HOOK  (a React hook is just a function starting with "use")
// ─────────────────────────────────────────────────────────────────────────────

export function useGameSocket(sessionId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected,   setConnected]   = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    if (!sessionId) return

    const token = getToken()
    const url   = `${WS_BASE}/${sessionId}?token=${token}`
    const ws    = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log(`[WS] Connected to session ${sessionId}`)
    }

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data)
        setLastMessage(frame)
      } catch {
        console.warn('[WS] Could not parse message:', event.data)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('[WS] Disconnected')
      // TODO: attempt reconnect after delay (FR-MP-06)
    }

    ws.onerror = (err) => {
      console.error('[WS] Error:', err)
    }

    return () => ws.close()   // cleanup when component unmounts
  }, [sessionId])

  function send(type: string, payload: Record<string, unknown> = {}) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected — cannot send', type)
      return
    }
    const frame = { v: PROTOCOL_VERSION, type, ...payload }
    wsRef.current.send(JSON.stringify(frame))
  }

  return { connected, lastMessage, send }
}
