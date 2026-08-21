/** Byte/string codecs, environment-neutral (no Buffer, no Node APIs). */
const encoder = new TextEncoder();
const decoder = new TextDecoder();
/** @returns UTF-8 bytes of the string. */
export function utf8Encode(s) {
    return encoder.encode(s);
}
/** @returns string decoded from UTF-8 bytes. */
export function utf8Decode(b) {
    return decoder.decode(b);
}
const CHUNK = 0x8000;
/** @returns standard base64 of the bytes. */
export function b64encode(b) {
    let bin = '';
    for (let i = 0; i < b.length; i += CHUNK)
        bin += String.fromCharCode(...b.subarray(i, i + CHUNK));
    return btoa(bin);
}
/** @returns bytes decoded from standard base64. */
export function b64decode(s) {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
        out[i] = bin.charCodeAt(i);
    return out;
}
/** @returns base64url (no padding) of the bytes. */
export function b64urlEncode(b) {
    return b64encode(b).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
/** @returns bytes decoded from base64url. */
export function b64urlDecode(s) {
    const b64 = s.replaceAll('-', '+').replaceAll('_', '/');
    return b64decode(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
}
/** @returns concatenation of the given byte arrays. */
export function concat(...parts) {
    let total = 0;
    for (const p of parts)
        total += p.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        out.set(p, offset);
        offset += p.length;
    }
    return out;
}
//# sourceMappingURL=bytes.js.map