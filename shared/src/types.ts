export type WsMessage =
  | { type: 'mouse_move'; dx: number; dy: number }
  | { type: 'left_click' }
  | { type: 'right_click' }
  | { type: 'double_click' }
  | { type: 'mouse_scroll'; dy: number }
  | { type: 'key_press'; key: string }
  | { type: 'special_key'; key: SpecialKey }
  | VoiceCommand
  | VoiceResult;

export interface VoiceCommand {
  type: 'voice_command';
  action:
    | 'OPEN_APP'
    | 'MOUSE_CLICK'
    | 'MOUSE_DOUBLE_CLICK'
    | 'MOVE_MOUSE'
    | 'SCROLL'
    | 'KEY_PRESS'
    | 'KEY_COMBINATION';
  target?: string;
  button?: 'left' | 'right';
  direction?: 'left' | 'right' | 'up' | 'down';
  amount?: number;
  key?: string;
  keys?: string[];
}

export interface VoiceResult {
  type: 'voice_result';
  success: boolean;
  message: string;
}

export type SpecialKey =
  | 'ENTER'
  | 'BACKSPACE'
  | 'ESCAPE'
  | 'CONTROL'
  | 'ALT'
  | 'SHIFT'
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT';

export interface PairingInfo {
  wsUrl: string;
  deviceId: string;
  pairToken: string;
}
