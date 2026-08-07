import koffi from 'koffi';
import { SpecialKey } from 'shared/src/types';

// Load User32.dll
const user32 = koffi.load('user32.dll');

// Define POINT struct for GetCursorPos
const POINT = koffi.struct('POINT', {
  x: 'long',
  y: 'long'
});

// Declare user32 functions
const SetCursorPos = user32.func('bool __stdcall SetCursorPos(int x, int y)');
const GetCursorPos = user32.func('bool __stdcall GetCursorPos(_Out_ POINT *lpPoint)');
const mouse_event = user32.func('void __stdcall mouse_event(uint32_t dwFlags, uint32_t dx, uint32_t dy, uint32_t dwData, uintptr_t dwExtraInfo)');
const keybd_event = user32.func('void __stdcall keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)');
const VkKeyScanA = user32.func('int16_t __stdcall VkKeyScanA(uint8_t ch)');

// Mouse event constants
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;
const MOUSEEVENTF_WHEEL = 0x0800;

// Keyboard event constants
const KEYEVENTF_KEYUP = 0x0002;

// Virtual Key Codes
const VK_BACK = 0x08;
const VK_RETURN = 0x0D;
const VK_ESCAPE = 0x1B;
const VK_LEFT = 0x25;
const VK_UP = 0x26;
const VK_RIGHT = 0x27;
const VK_DOWN = 0x28;
const VK_SHIFT = 0x10;
const VK_CONTROL = 0x11;
const VK_MENU = 0x12; // Alt key

// Modifier state tracking
let isCtrlPressed = false;
let isAltPressed = false;
let isShiftPressed = false;

export function moveMouseRelative(dx: number, dy: number): void {
  const pt = { x: 0, y: 0 };
  if (GetCursorPos(pt)) {
    SetCursorPos(pt.x + dx, pt.y + dy);
  }
}

export function leftClick(): void {
  mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
  mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
}

export function rightClick(): void {
  mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
  mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
}

export function doubleClick(): void {
  leftClick();
  leftClick();
}

export function scroll(dy: number): void {
  // dwData represents wheel delta. Usually 120 per notch.
  mouse_event(MOUSEEVENTF_WHEEL, 0, 0, dy, 0);
}

export function pressKey(key: string): void {
  if (key.length === 0) return;

  // Space is a special character
  if (key === ' ') {
    keybd_event(0x20, 0, 0, 0);
    keybd_event(0x20, 0, KEYEVENTF_KEYUP, 0);
    return;
  }

  const code = key.charCodeAt(0);
  const scan = VkKeyScanA(code);
  if (scan === -1) {
    console.warn(`Unsupported character: ${key}`);
    return;
  }

  const vk = scan & 0xFF;
  const shiftNeeded = (scan >> 8) & 1;

  // If Shift is needed but not already toggled down, temporarily press it
  if (shiftNeeded && !isShiftPressed) {
    keybd_event(VK_SHIFT, 0, 0, 0);
  }

  // Press key
  keybd_event(vk, 0, 0, 0);
  keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);

  // Release Shift if temporarily pressed
  if (shiftNeeded && !isShiftPressed) {
    keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, 0);
  }
}

export function pressSpecialKey(key: SpecialKey): void {
  switch (key) {
    case 'ENTER':
      keybd_event(VK_RETURN, 0, 0, 0);
      keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, 0);
      break;
    case 'BACKSPACE':
      keybd_event(VK_BACK, 0, 0, 0);
      keybd_event(VK_BACK, 0, KEYEVENTF_KEYUP, 0);
      break;
    case 'ESCAPE':
      keybd_event(VK_ESCAPE, 0, 0, 0);
      keybd_event(VK_ESCAPE, 0, KEYEVENTF_KEYUP, 0);
      break;
    case 'LEFT':
      keybd_event(VK_LEFT, 0, 0, 0);
      keybd_event(VK_LEFT, 0, KEYEVENTF_KEYUP, 0);
      break;
    case 'UP':
      keybd_event(VK_UP, 0, 0, 0);
      keybd_event(VK_UP, 0, KEYEVENTF_KEYUP, 0);
      break;
    case 'RIGHT':
      keybd_event(VK_RIGHT, 0, 0, 0);
      keybd_event(VK_RIGHT, 0, KEYEVENTF_KEYUP, 0);
      break;
    case 'DOWN':
      keybd_event(VK_DOWN, 0, 0, 0);
      keybd_event(VK_DOWN, 0, KEYEVENTF_KEYUP, 0);
      break;
    case 'CONTROL':
      isCtrlPressed = !isCtrlPressed;
      keybd_event(VK_CONTROL, 0, isCtrlPressed ? 0 : KEYEVENTF_KEYUP, 0);
      break;
    case 'ALT':
      isAltPressed = !isAltPressed;
      keybd_event(VK_MENU, 0, isAltPressed ? 0 : KEYEVENTF_KEYUP, 0);
      break;
    case 'SHIFT':
      isShiftPressed = !isShiftPressed;
      keybd_event(VK_SHIFT, 0, isShiftPressed ? 0 : KEYEVENTF_KEYUP, 0);
      break;
  }
}

// Ensure modifiers are released when app resets/cleans up
export function releaseAllModifiers(): void {
  if (isCtrlPressed) {
    keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
    isCtrlPressed = false;
  }
  if (isAltPressed) {
    keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0);
    isAltPressed = false;
  }
  if (isShiftPressed) {
    keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, 0);
    isShiftPressed = false;
  }
}
