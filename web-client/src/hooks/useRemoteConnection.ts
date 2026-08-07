import { useState, useEffect, useCallback, useRef } from 'react';
import type { PairingInfo, WsMessage } from 'shared';

export function useRemoteConnection() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [pairingInfo, setPairingInfo] = useState<PairingInfo | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

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
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  const connect = useCallback((info: PairingInfo) => {
    // Disconnect existing if any
    if (wsRef.current) {
      wsRef.current.close();
    }

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
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          setConnectionStatus('disconnected');
          wsRef.current = null;
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        if (wsRef.current === ws) {
          setConnectionStatus('disconnected');
          wsRef.current = null;
        }
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
    if (pairingInfo && connectionStatus === 'disconnected' && !wsRef.current) {
      connect(pairingInfo);
    }
    return () => {
      // Don't close on every render, but clean up on unmount
    };
  }, [pairingInfo, connect, connectionStatus]);

  return {
    connectionStatus,
    pairingInfo,
    connect,
    disconnect,
    sendMessage
  };
}
export default useRemoteConnection;
