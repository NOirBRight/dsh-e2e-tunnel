const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const MODEL_FILLERS = new Set(['find', 'galaxy', 'thinkpad', 'ideapad']);
/** Keep paired-device labels readable in narrow controls; never use for identity or routing. */
export function compactDisplayName(value, fallback = 'Device', maxLength = 18) {
    let normalized = value.replace(CONTROL_CHARS, '').replace(/\s+/g, ' ').trim();
    if (normalized === '')
        normalized = fallback;
    normalized = normalized.replace(/\b(workstation|desktop|computer)\b/giu, 'PC');
    const words = normalized.split(' ');
    if (words.length >= 3) {
        const compact = words.filter((word, index) => !(index > 0 && index < words.length - 1 && MODEL_FILLERS.has(word.toLocaleLowerCase()))).join(' ');
        if (compact.length < normalized.length)
            normalized = compact;
    }
    if (Array.from(normalized).length <= maxLength)
        return normalized;
    const parts = normalized.split(' ');
    if (parts.length >= 2) {
        const edgeName = parts[0] + ' ' + parts.at(-1);
        if (Array.from(edgeName).length <= maxLength)
            return edgeName;
    }
    return Array.from(normalized).slice(0, Math.max(1, maxLength - 1)).join('') + '…';
}
//# sourceMappingURL=display-name.js.map