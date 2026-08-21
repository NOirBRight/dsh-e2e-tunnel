import type { TunnelSession } from './client.ts';
type Listener = (ev: Record<string, unknown>) => void;
/**
 * Minimal browser-WebSocket facade over one tunnel multiplex channel
 * (ws-open/ws-ack/ws-msg/ws-close). Covers exactly what the upstream browser
 * carrier uses: readyState + constants, send, close, on*-properties,
 * addEventListener/removeEventListener (with { once }).
 */
export declare class TunnelWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
    onopen: Listener | null;
    onmessage: Listener | null;
    onerror: Listener | null;
    onclose: Listener | null;
    /** Accepted for interface parity; payloads are always delivered as strings. */
    binaryType: string;
    readonly id: string;
    private ready;
    private listeners;
    private readonly session;
    readonly path: string;
    constructor(session: TunnelSession, path: string);
    get readyState(): number;
    addEventListener(type: string, cb: Listener, options?: {
        once?: boolean;
    }): void;
    removeEventListener(type: string, cb: Listener): void;
    /** Send one ws-msg frame. */
    send(data: string | ArrayBuffer | Uint8Array): void;
    close(code?: number, reason?: string): void;
    /** @internal host acknowledged the loopback WebSocket. */
    onAck(): void;
    /** @internal host refused the loopback WebSocket. */
    onErr(message: string): void;
    /** @internal host to client payload; delivered as a string MessageEvent. */
    onMsg(dataB64: string): void;
    /** @internal host closed its side. */
    onHostClose(code?: number, reason?: string): void;
    /** @internal the whole tunnel dropped. */
    tunnelClosed(): void;
    private fail;
    private settle;
    private emit;
}
/** Structural WebSocket surface the upstream carrier relies on. */
export type WebSocketLike = TunnelWebSocket;
export {};
//# sourceMappingURL=socket.d.ts.map