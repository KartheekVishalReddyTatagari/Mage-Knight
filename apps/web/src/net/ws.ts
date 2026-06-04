/**
 * WebSocket client — real-time connection to the game server.
 *
 * CONCEPT:
 * A WebSocket is like a phone call between browser and server —
 * both sides can talk at any time, unlike HTTP where the client
 * always has to ask first.
 *
 * USAGE in a React component:
 *   const { connected, send } = useGameSocket(sessionId, enabled, onMessage)
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getToken, getUsername } from './api'

const WS_BASE = 'ws://localhost:8000/ws'
const PROTOCOL_VERSION = 1
const MAX_RECONNECT_DELAY = 8000

export function useGameSocket(
  sessionId: string | undefined,
  enabled = true,
  onMessage?: (frame: any) => void,
) {
  const wsRef          = useRef<WebSocket | null>(null)
  const shouldReconnect = useRef(true)
  const reconnectDelay  = useRef(1000)
  const onMessageRef    = useRef(onMessage)
  const [connected, setConnected] = useState(false)

  // Keep callback ref current without re-triggering connection useEffect
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  useEffect(() => {
    if (!sessionId || !enabled) return

    shouldReconnect.current = true
    reconnectDelay.current  = 1000

    function connect() {
      const token = getToken()
      if (!token || !shouldReconnect.current) return

      const username = getUsername() ?? 'Knight'
      const url = `${WS_BASE}/${sessionId}?token=${encodeURIComponent(token)}&username=${encodeURIComponent(username)}`
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        reconnectDelay.current = 1000
        console.log(`[WS] Connected to session ${sessionId}`)
      }

      ws.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data)
          onMessageRef.current?.(frame)
        } catch {
          console.warn('[WS] Could not parse message:', event.data)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        console.log('[WS] Disconnected')
        if (shouldReconnect.current) {
          const delay = reconnectDelay.current
          reconnectDelay.current = Math.min(delay * 2, MAX_RECONNECT_DELAY)
          console.log(`[WS] Reconnecting in ${delay}ms…`)
          setTimeout(connect, delay)
        }
      }

      ws.onerror = () => {
        console.error('[WS] Connection error')
      }
    }

    connect()

    return () => {
      shouldReconnect.current = false
      wsRef.current?.close()
    }
  }, [sessionId, enabled])

  const send = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected — cannot send', type)
      return
    }
    wsRef.current.send(JSON.stringify({ v: PROTOCOL_VERSION, type, ...payload }))
  }, []) // wsRef is stable, so send is stable too

  return { connected, send }
}
