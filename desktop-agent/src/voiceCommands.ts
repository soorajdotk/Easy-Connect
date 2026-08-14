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

/**
 * Application aliases.
 *
 * The user can say:
 * "Excel"
 * "Microsoft Excel"
 * "Open Excel"
 *
 * The parser should normalize the command to one of these keys.
 */
const APP_ALIASES: Record<string, string> = {
  chrome: 'chrome',
  'google chrome': 'chrome',

  notepad: 'notepad',

  explorer: 'explorer',
  'file explorer': 'explorer',
  'windows explorer': 'explorer',

  calculator: 'calculator',
  calc: 'calculator',

  edge: 'edge',
  'microsoft edge': 'edge',

  excel: 'excel',
  'microsoft excel': 'excel',

  word: 'word',
  'microsoft word': 'word',

  outlook: 'outlook',
  'microsoft outlook': 'outlook',

  powershell: 'powershell',
  'power shell': 'powershell'
};

const DISPLAY_NAMES: Record<string, string> = {
  chrome: 'Google Chrome',
  notepad: 'Notepad',
  explorer: 'File Explorer',
  calculator: 'Calculator',
  edge: 'Microsoft Edge',
  excel: 'Microsoft Excel',
  word: 'Microsoft Word',
  outlook: 'Microsoft Outlook',
  powershell: 'PowerShell'
};

/**
 * Windows Start Menu locations.
 *
 * Applications installed by different users/installers can appear
 * in either the user Start Menu or the system Start Menu.
 */
function getStartMenuDirectories(): string[] {
  const directories: string[] = [];

  if (process.env.APPDATA) {
    directories.push(
      path.join(
        process.env.APPDATA,
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs'
      )
    );
  }

  if (process.env.PROGRAMDATA) {
    directories.push(
      path.join(
        process.env.PROGRAMDATA,
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs'
      )
    );
  }

  return directories;
}

/**
 * Recursively search Start Menu shortcuts.
 */
function findShortcut(
  directory: string,
  aliases: string[]
): string | null {
  if (!fs.existsSync(directory)) {
    return null;
  }

  try {
    const entries = fs.readdirSync(directory, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        const result = findShortcut(fullPath, aliases);

        if (result) {
          return result;
        }

        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (path.extname(entry.name).toLowerCase() !== '.lnk') {
        continue;
      }

      const nameWithoutExtension = path
        .basename(entry.name, '.lnk')
        .toLowerCase()
        .trim();

      for (const alias of aliases) {
        if (
          nameWithoutExtension === alias ||
          nameWithoutExtension.includes(alias)
        ) {
          return fullPath;
        }
      }
    }
  } catch {
    // Ignore inaccessible directories.
  }

  return null;
}

/**
 * Find an installed application through Windows Start Menu.
 */
function discoverApplication(target: string): string | null {
  const aliases: Record<string, string[]> = {
    chrome: ['google chrome', 'chrome'],
    notepad: ['notepad'],
    explorer: ['file explorer', 'windows explorer', 'explorer'],
    calculator: ['calculator', 'calc'],
    edge: ['microsoft edge', 'edge'],
    excel: ['microsoft excel', 'excel'],
    word: ['microsoft word', 'word'],
    outlook: ['microsoft outlook', 'outlook'],
    powershell: ['windows powershell', 'powershell']
  };

  const names = aliases[target];

  if (!names) {
    return null;
  }

  for (const directory of getStartMenuDirectories()) {
    const shortcut = findShortcut(directory, names);

    if (shortcut) {
      return shortcut;
    }
  }

  return null;
}

/**
 * Windows aliases for applications that can normally be
 * resolved without knowing the installation directory.
 */
function getWindowsFallback(target: string): string | null {
  const fallback: Record<string, string> = {
    chrome: 'chrome.exe',
    notepad: 'notepad.exe',
    explorer: 'explorer.exe',
    calculator: 'calc.exe',
    edge: 'msedge.exe',
    excel: 'excel.exe',
    word: 'winword.exe',
    outlook: 'outlook.exe',
    powershell: 'powershell.exe'
  };

  return fallback[target] || null;
}

/**
 * Launch an application.
 *
 * Priority:
 *
 * 1. Discover it from Windows Start Menu
 * 2. Try Windows executable alias
 *
 * No hard-coded Program Files paths are required.
 */
async function launchApplication(
  target: string
): Promise<VoiceResult> {
  const displayName = DISPLAY_NAMES[target] || target;

  // ---------------------------------------
  // 1. Windows Start Menu discovery
  // ---------------------------------------

  const shortcut = discoverApplication(target);

  if (shortcut) {
    try {
      const child = spawn(
        'explorer.exe',
        [shortcut],
        {
          detached: true,
          stdio: 'ignore',
          windowsHide: true
        }
      );

      child.unref();

      return {
        type: 'voice_result',
        success: true,
        message: `${displayName} opened`
      };
    } catch {
      // Continue to executable fallback.
    }
  }

  // ---------------------------------------
  // 2. Windows executable fallback
  // ---------------------------------------

  const executable = getWindowsFallback(target);

  if (executable) {
    try {
      const child = spawn(
        executable,
        [],
        {
          detached: true,
          stdio: 'ignore',
          windowsHide: false
        }
      );

      child.unref();

      return await new Promise<VoiceResult>((resolve) => {
        let finished = false;

        const success = () => {
          if (finished) return;

          finished = true;

          resolve({
            type: 'voice_result',
            success: true,
            message: `${displayName} opened`
          });
        };

        const failure = () => {
          if (finished) return;

          finished = true;

          resolve({
            type: 'voice_result',
            success: false,
            message: `${displayName} was not found on this computer.`
          });
        };

        child.once('error', failure);

        setTimeout(success, 300);
      });
    } catch {
      // Continue to failure.
    }
  }

  return {
    type: 'voice_result',
    success: false,
    message: `${displayName} was not found on this computer.`
  };
}

/**
 * Execute a structured voice command.
 */
export async function executeVoiceCommand(
  cmd: VoiceCommand
): Promise<VoiceResult> {
  const { action } = cmd;

  switch (action) {

    // ============================================================
    // OPEN APPLICATION
    // ============================================================

    case 'OPEN_APP': {
      const rawTarget = (cmd.target || '')
        .toLowerCase()
        .trim();

      const target =
        APP_ALIASES[rawTarget] || rawTarget;

      if (!DISPLAY_NAMES[target]) {
        return {
          type: 'voice_result',
          success: false,
          message: 'That application is not supported.'
        };
      }

      return launchApplication(target);
    }

    // ============================================================
    // MOUSE CLICK
    // ============================================================

    case 'MOUSE_CLICK': {
      if (cmd.button === 'right') {
        rightClick();

        return {
          type: 'voice_result',
          success: true,
          message: 'Right clicked'
        };
      }

      leftClick();

      return {
        type: 'voice_result',
        success: true,
        message: 'Clicked'
      };
    }

    // ============================================================
    // DOUBLE CLICK
    // ============================================================

    case 'MOUSE_DOUBLE_CLICK': {
      doubleClick();

      return {
        type: 'voice_result',
        success: true,
        message: 'Double clicked'
      };
    }

    // ============================================================
    // MOVE MOUSE
    // ============================================================

    case 'MOVE_MOUSE': {
      const direction = cmd.direction || 'left';
      const amount = cmd.amount || 100;

      let dx = 0;
      let dy = 0;

      if (direction === 'left') {
        dx = -amount;
      } else if (direction === 'right') {
        dx = amount;
      } else if (direction === 'up') {
        dy = -amount;
      } else if (direction === 'down') {
        dy = amount;
      }

      moveMouseRelative(dx, dy);

      return {
        type: 'voice_result',
        success: true,
        message: `Moved mouse ${direction}`
      };
    }

    // ============================================================
    // SCROLL
    // ============================================================

    case 'SCROLL': {
      const direction = cmd.direction || 'down';

      const dy =
        direction === 'up'
          ? 120
          : -120;

      scroll(dy);

      return {
        type: 'voice_result',
        success: true,
        message: `Scrolled ${direction}`
      };
    }

    // ============================================================
    // KEY PRESS
    // ============================================================

    case 'KEY_PRESS': {
      const key = (cmd.key || '').toUpperCase();

      if (!key) {
        return {
          type: 'voice_result',
          success: false,
          message: 'No key specified'
        };
      }

      if (key === 'ARROWLEFT') {
        pressSpecialKey('LEFT');
      } else if (key === 'ARROWRIGHT') {
        pressSpecialKey('RIGHT');
      } else if (key === 'ARROWUP') {
        pressSpecialKey('UP');
      } else if (key === 'ARROWDOWN') {
        pressSpecialKey('DOWN');
      } else if (
        key === 'ENTER' ||
        key === 'ESCAPE' ||
        key === 'TAB' ||
        key === 'BACKSPACE'
      ) {
        pressSpecialKey(key as any);
      } else if (key === 'SPACE') {
        pressKey(' ');
      } else {
        pressKey(key);
      }

      return {
        type: 'voice_result',
        success: true,
        message: `Pressed ${key.toLowerCase()}`
      };
    }

    // ============================================================
    // KEY COMBINATION
    // ============================================================

    case 'KEY_COMBINATION': {
      const keys = cmd.keys || [];

      if (keys.length === 0) {
        return {
          type: 'voice_result',
          success: false,
          message: 'No keys specified'
        };
      }

      pressKeyCombination(keys);

      return {
        type: 'voice_result',
        success: true,
        message: 'Key combination executed'
      };
    }

    // ============================================================
    // UNKNOWN COMMAND
    // ============================================================

    default:
      return {
        type: 'voice_result',
        success: false,
        message: "Sorry, I don't understand that command."
      };
  }
}