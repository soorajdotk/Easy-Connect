import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { VoiceCommand, VoiceResult } from 'shared/src/types';
import {
  moveMouseRelative,
  leftClick,
  rightClick,
  doubleClick,
  scroll,
  pressKey,
  pressSpecialKey,
  pressKeyCombination
} from './input';

const APP_PATHS: Record<string, string[]> = {
  chrome: [
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.LOCALAPPDATA || 'C:\\Users\\default\\AppData\\Local', 'Google\\Chrome\\Application\\chrome.exe'),
    'chrome.exe'
  ],
  notepad: [
    'notepad.exe'
  ],
  explorer: [
    'explorer.exe'
  ],
  calculator: [
    'calc.exe'
  ]
};

export async function executeVoiceCommand(cmd: VoiceCommand): Promise<VoiceResult> {
  const { action } = cmd;

  switch (action) {
    case 'OPEN_APP': {
      const target = (cmd.target || '').toLowerCase().trim();
      const paths = APP_PATHS[target];
      if (!paths) {
        return {
          type: 'voice_result',
          success: false,
          message: 'That application is not supported.'
        };
      }

      let appNameFormatted = target === 'chrome' ? 'Chrome' : target === 'notepad' ? 'Notepad' : target === 'explorer' ? 'Explorer' : 'Calculator';

      for (const appPath of paths) {
        try {
          if (appPath.includes('\\') && !fs.existsSync(appPath)) {
            continue;
          }

          const child = spawn(appPath, [], {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();

          return await new Promise<VoiceResult>((resolve) => {
            const onError = () => {
              resolve({
                type: 'voice_result',
                success: false,
                message: `${appNameFormatted} was not found.`
              });
            };
            child.on('error', onError);
            setTimeout(() => {
              child.off('error', onError);
              resolve({
                type: 'voice_result',
                success: true,
                message: `${appNameFormatted} opened`
              });
            }, 150);
          });
        } catch (e) {
          // try next path fallback
        }
      }

      return {
        type: 'voice_result',
        success: false,
        message: `${appNameFormatted} was not found.`
      };
    }

    case 'MOUSE_CLICK': {
      if (cmd.button === 'right') {
        rightClick();
        return { type: 'voice_result', success: true, message: 'Right clicked' };
      } else {
        leftClick();
        return { type: 'voice_result', success: true, message: 'Clicked' };
      }
    }

    case 'MOUSE_DOUBLE_CLICK': {
      doubleClick();
      return { type: 'voice_result', success: true, message: 'Double clicked' };
    }

    case 'MOVE_MOUSE': {
      const direction = cmd.direction || 'left';
      const amount = cmd.amount || 100;
      let dx = 0;
      let dy = 0;

      if (direction === 'left') dx = -amount;
      else if (direction === 'right') dx = amount;
      else if (direction === 'up') dy = -amount;
      else if (direction === 'down') dy = amount;

      moveMouseRelative(dx, dy);
      return { type: 'voice_result', success: true, message: `Moved mouse ${direction}` };
    }

    case 'SCROLL': {
      const direction = cmd.direction || 'down';
      // 120 / -120 to simulate one notch scroll
      const dy = direction === 'up' ? 120 : -120;
      scroll(dy);
      return { type: 'voice_result', success: true, message: `Scrolled ${direction}` };
    }

    case 'KEY_PRESS': {
      const key = cmd.key || '';
      if (!key) {
        return { type: 'voice_result', success: false, message: 'No key specified' };
      }

      if (key === 'ENTER' || key === 'ESCAPE' || key === 'SPACE' || key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
        if (key === 'ARROWLEFT') {
          pressSpecialKey('LEFT');
        } else if (key === 'ARROWRIGHT') {
          pressSpecialKey('RIGHT');
        } else if (key === 'SPACE') {
          pressKey(' ');
        } else {
          pressSpecialKey(key as any);
        }
        return { type: 'voice_result', success: true, message: `Pressed ${key.toLowerCase()}` };
      } else {
        pressKey(key);
        return { type: 'voice_result', success: true, message: `Pressed ${key.toLowerCase()}` };
      }
    }

    case 'KEY_COMBINATION': {
      const keys = cmd.keys || [];
      if (keys.length === 0) {
        return { type: 'voice_result', success: false, message: 'No keys specified' };
      }
      pressKeyCombination(keys);
      return { type: 'voice_result', success: true, message: 'Window closed' };
    }

    default:
      return {
        type: 'voice_result',
        success: false,
        message: "Sorry, I don't understand that command."
      };
  }
}
