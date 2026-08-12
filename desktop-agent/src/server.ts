import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import * as url from 'url';
import * as crypto from 'crypto';
import * as os from 'os';
import { WsMessage } from 'shared/src/types';
import {
  moveMouseRelative,
  leftClick,
  rightClick,
  doubleClick,
  scroll,
  pressKey,
  pressSpecialKey,
  releaseAllModifiers
} from './input';
import { executeVoiceCommand } from './voiceCommands';

export interface ServerConfig {
  port: number;
  onStatusChange: (status: 'Disconnected' | 'Connected' | 'Waiting') => void;
  onPairingInfoReady: (pairingPayload: string) => void;
}

export class RemoteServer {
  private wss: WebSocketServer | null = null;
  private activeSocket: WebSocket | null = null;
  private port: number;
  
  // Pairing details
  private deviceId: string;
  private pairToken: string;

  private onStatusChange: (status: 'Disconnected' | 'Connected' | 'Waiting') => void;
  private onPairingInfoReady: (pairingPayload: string) => void;

  constructor(config: ServerConfig) {
    this.port = config.port;
    this.onStatusChange = config.onStatusChange;
    this.onPairingInfoReady = config.onPairingInfoReady;

    // Generate pairing credentials
    this.deviceId = crypto.randomUUID();
    this.pairToken = crypto.randomBytes(16).toString('hex');
  }

  public start(): void {
    const localIp = this.getLocalIp();
    const wsUrl = `ws://${localIp}:${this.port}`;
    
    // Construct pairing JSON payload
    const pairingPayload = JSON.stringify({
      wsUrl,
      deviceId: this.deviceId,
      pairToken: this.pairToken
    });

    this.onPairingInfoReady(pairingPayload);
    this.onStatusChange('Waiting');

    // Create HTTP server to handoff to WebSocket
    const server = http.createServer((req, res) => {
      res.writeHead(404);
      res.end();
    });

    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const parsedUrl = url.parse(request.url || '', true);
      const query = parsedUrl.query;

      const clientDeviceId = query.deviceId;
      const clientPairToken = query.pairToken;

      // Authenticate during handshake
      if (clientDeviceId !== this.deviceId || clientPairToken !== this.pairToken) {
        console.warn(`Unauthorized connection attempt from ${request.socket.remoteAddress}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      this.wss?.handleUpgrade(request, socket, head, (ws) => {
        this.wss?.emit('connection', ws, request);
      });
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected successfully');

      // If there is an existing socket, close it
      if (this.activeSocket) {
        this.activeSocket.close();
      }

      this.activeSocket = ws;
      this.onStatusChange('Connected');

      ws.on('message', (data: string) => {
        try {
          const message: WsMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        if (this.activeSocket === ws) {
          this.activeSocket = null;
          this.onStatusChange('Waiting');
          releaseAllModifiers(); // Clean up keyboard modifier states
        }
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
      });
    });

    server.listen(this.port, () => {
      console.log(`RemoteServer running on port ${this.port}`);
    });
  }

  private handleMessage(msg: WsMessage): void {
    switch (msg.type) {
      case 'mouse_move':
        moveMouseRelative(msg.dx, msg.dy);
        break;
      case 'left_click':
        leftClick();
        break;
      case 'right_click':
        rightClick();
        break;
      case 'double_click':
        doubleClick();
        break;
      case 'mouse_scroll':
        scroll(msg.dy);
        break;
      case 'key_press':
        pressKey(msg.key);
        break;
      case 'special_key':
        pressSpecialKey(msg.key);
        break;
      case 'voice_command':
        executeVoiceCommand(msg).then((result) => {
          if (this.activeSocket && this.activeSocket.readyState === WebSocket.OPEN) {
            this.activeSocket.send(JSON.stringify(result));
          }
        }).catch((err) => {
          console.error('Error executing voice command:', err);
          const errorResult = {
            type: 'voice_result' as const,
            success: false,
            message: err.message || 'An internal error occurred.'
          };
          if (this.activeSocket && this.activeSocket.readyState === WebSocket.OPEN) {
            this.activeSocket.send(JSON.stringify(errorResult));
          }
        });
        break;
    }
  }

  private getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (iface) {
        for (const alias of iface) {
          if (alias.family === 'IPv4' && !alias.internal) {
            return alias.address;
          }
        }
      }
    }
    return '127.0.0.1';
  }
}
