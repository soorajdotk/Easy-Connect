export type WsMessage =
  | { type: 'mouse_move'; dx: number; dy: number }
  | { type: 'left_click' }
  | { type: 'right_click' }
  | { type: 'double_click' }
  | { type: 'mouse_scroll'; dy: number }
  | { type: 'key_press'; key: string }
  | { type: 'special_key'; key: SpecialKey };

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
