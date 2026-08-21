/** Byte/string codecs, environment-neutral (no Buffer, no Node APIs). */
/** @returns UTF-8 bytes of the string. */
export declare function utf8Encode(s: string): Uint8Array;
/** @returns string decoded from UTF-8 bytes. */
export declare function utf8Decode(b: Uint8Array): string;
/** @returns standard base64 of the bytes. */
export declare function b64encode(b: Uint8Array): string;
/** @returns bytes decoded from standard base64. */
export declare function b64decode(s: string): Uint8Array;
/** @returns base64url (no padding) of the bytes. */
export declare function b64urlEncode(b: Uint8Array): string;
/** @returns bytes decoded from base64url. */
export declare function b64urlDecode(s: string): Uint8Array;
/** @returns concatenation of the given byte arrays. */
export declare function concat(...parts: Uint8Array[]): Uint8Array;
//# sourceMappingURL=bytes.d.ts.map