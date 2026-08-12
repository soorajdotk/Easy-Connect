export function parseVoiceCommand(text) {
    if (!text)
        return null;
    // Clean the text by collapsing spaces and converting to lowercase
    const cleanText = text.toLowerCase().replace(/\s+/g, ' ').trim();
    // 1. Direct matches
    if (cleanText === 'open chrome') {
        return { type: 'voice_command', action: 'OPEN_APP', target: 'chrome' };
    }
    if (cleanText === 'open notepad') {
        return { type: 'voice_command', action: 'OPEN_APP', target: 'notepad' };
    }
    if (cleanText === 'open file explorer') {
        return { type: 'voice_command', action: 'OPEN_APP', target: 'explorer' };
    }
    if (cleanText === 'click') {
        return { type: 'voice_command', action: 'MOUSE_CLICK', button: 'left' };
    }
    if (cleanText === 'right click') {
        return { type: 'voice_command', action: 'MOUSE_CLICK', button: 'right' };
    }
    if (cleanText === 'double click') {
        return { type: 'voice_command', action: 'MOUSE_DOUBLE_CLICK' };
    }
    if (cleanText === 'scroll up') {
        return { type: 'voice_command', action: 'SCROLL', direction: 'up' };
    }
    if (cleanText === 'scroll down') {
        return { type: 'voice_command', action: 'SCROLL', direction: 'down' };
    }
    if (cleanText === 'move mouse left') {
        return { type: 'voice_command', action: 'MOVE_MOUSE', direction: 'left', amount: 100 };
    }
    if (cleanText === 'move mouse right') {
        return { type: 'voice_command', action: 'MOVE_MOUSE', direction: 'right', amount: 100 };
    }
    if (cleanText === 'press enter') {
        return { type: 'voice_command', action: 'KEY_PRESS', key: 'ENTER' };
    }
    if (cleanText === 'press escape') {
        return { type: 'voice_command', action: 'KEY_PRESS', key: 'ESCAPE' };
    }
    if (cleanText === 'press space') {
        return { type: 'voice_command', action: 'KEY_PRESS', key: 'SPACE' };
    }
    if (cleanText === 'next slide') {
        return { type: 'voice_command', action: 'KEY_PRESS', key: 'ARROWRIGHT' };
    }
    if (cleanText === 'previous slide') {
        return { type: 'voice_command', action: 'KEY_PRESS', key: 'ARROWLEFT' };
    }
    if (cleanText === 'close window') {
        return { type: 'voice_command', action: 'KEY_COMBINATION', keys: ['ALT', 'F4'] };
    }
    // 2. Fallbacks and Variations
    // "open chrome browser", "launch chrome"
    if (cleanText.includes('chrome')) {
        if (cleanText.includes('open') || cleanText.includes('launch') || cleanText.includes('start') || cleanText.includes('run')) {
            return { type: 'voice_command', action: 'OPEN_APP', target: 'chrome' };
        }
    }
    // "open notepad", "launch notepad"
    if (cleanText.includes('notepad')) {
        if (cleanText.includes('open') || cleanText.includes('launch') || cleanText.includes('start') || cleanText.includes('run')) {
            return { type: 'voice_command', action: 'OPEN_APP', target: 'notepad' };
        }
    }
    // "open explorer", "open file explorer", "launch file explorer"
    if (cleanText.includes('explorer')) {
        if (cleanText.includes('open') || cleanText.includes('launch') || cleanText.includes('start') || cleanText.includes('run')) {
            return { type: 'voice_command', action: 'OPEN_APP', target: 'explorer' };
        }
    }
    return null;
}
