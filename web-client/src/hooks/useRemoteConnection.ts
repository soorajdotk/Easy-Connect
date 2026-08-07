import { useState, useEffect, useCallback, useRef } from 'react';
import type { PairingInfo, WsMessage } from 'shared';

export function useRemoteConnection() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [pairingInfo, setPairingInfo] = useState<PairingInfo | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Reconnection variables
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef<number>(1000); // Start at 1s
  const intentionalDisconnectRef = useRef<boolean>(false);

  // Load pairing details on mount
  useEffect(() => {
    const stored = localStorage.getItem('pairing_info');
    if (stored) {
      try {
        const info: PairingInfo = JSON.parse(stored);
        setPairingInfo(info);
      } catch (e) {
        console.error('Failed to parse stored pairing info:', e);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  const connect = useCallback((info: PairingInfo) => {
    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Terminate existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    intentionalDisconnectRef.current = false;
    setConnectionStatus('connecting');
    setPairingInfo(info);
    localStorage.setItem('pairing_info', JSON.stringify(info));

    const url = `${info.wsUrl}/?deviceId=${encodeURIComponent(info.deviceId)}&pairToken=${encodeURIComponent(info.pairToken)}`;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current === ws) {
          setConnectionStatus('connected');
          reconnectDelayRef.current = 1000; // Reset backoff delay on successful connection
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          setConnectionStatus('disconnected');
          wsRef.current = null;

          // Attempt reconnection if it wasn't an intentional disconnect
          if (!intentionalDisconnectRef.current) {
            console.log(`Connection lost. Attempting reconnect in ${reconnectDelayRef.current}ms...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              connect(info);
            }, reconnectDelayRef.current);

            // Double the backoff delay for the next attempt, capping at 16s
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 16000);
          }
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        // let onclose handle the reconnect logic
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setConnectionStatus('disconnected');
    }
  }, []);

  const sendMessage = useCallback((msg: WsMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Auto-connect if pairing info exists on mount
  useEffect(() => {
    if (pairingInfo && connectionStatus === 'disconnected' && !wsRef.current && !intentionalDisconnectRef.current) {
      connect(pairingInfo);
    }
  }, [pairingInfo, connect, connectionStatus]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    pairingInfo,
    connect,
    disconnect,
    sendMessage
  };
}
export default useRemoteConnection;
