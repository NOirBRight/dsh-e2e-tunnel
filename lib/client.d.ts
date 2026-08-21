import type { ConnectionPolicy } from './connection-policy.ts';
import { type ConnectionStatus } from './connection-manager.ts';
import { TunnelWebSocket } from './socket.ts';
import { type PendingFetch } from './http.ts';
import { type FrameTransport } from './transport.ts';
/** Tunnel lifecycle, surfaced to the app badge. */
export type TunnelState = 'connecting' | 'open' | 'closed';
export interface ClientKeypair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}
export declare function generateClientKeypair(): ClientKeypair;
export interface ConnectOptions {
    /** Stable Client Instance key used to make one-time-offer retries idempotent. */
    clientKeypair?: ClientKeypair;
    /** Persistent device token from a previous pairing (permanent until revoked, protocol §5). */
    deviceToken?: string;
    /** Called with the device token when one is issued (first pairing only — store it). */
    onDeviceToken?: (token: string) => void | Promise<void>;
    /** Called on every state transition. */
    onStateChange?: (state: TunnelState) => void;
    /** Public Endpoint policy; Automatic is the product default. */
    connectionPolicy?: ConnectionPolicy;
    /** Visible Public Endpoint route and phase changes. */
    onConnectionStatus?: (status: ConnectionStatus) => void;
    /** Handshake wait bound; default 10_000 ms. */
    handshakeTimeoutMs?: number;
    /** Transport-level reconnect attempts (roaming/4409 races); default 3. */
    connectRetries?: number;
    /** Optional Host-facing device label stored on first pairing. */
    deviceLabel?: string;
    /** Optional Client Instance type stored on first pairing. */
    clientType?: 'android' | 'browser';
}
/** openSession inputs: the connection callbacks plus the pairing credential the hello presents. */
export interface OpenSessionOptions extends ConnectOptions {
    /** One-time pairing code from the offer; required unless deviceToken is presented. */
    code?: string;
}
/** Live tunnel: multiplexed fetch + WebSocket over one sealed WSS room. */
export interface TunnelClient {
    /** Tunneled fetch; path is origin-relative (e.g. /api/host.describe). */
    fetch(path: string, init?: {
        method?: string;
        headers?: HeadersInit;
        body?: string | ArrayBuffer | Uint8Array | Blob | URLSearchParams | null;
        signal?: AbortSignal | null;
    }): Promise<Response>;
    /** Open a tunneled WebSocket to a loopback path (e.g. /api/events.mux). */
    openWebSocket(path: string): TunnelWebSocket;
    /** Probe application-level liveness inside the encrypted session. */
    probe(timeoutMs?: number): Promise<void>;
    /** The device token this session runs on (permanent until revoked, protocol §5). */
    readonly deviceToken: string | null;
    readonly state: TunnelState;
    close(): void;
    /** Close without emitting onStateChange. Used when this session lost the Automatic race. */
    discard(): void;
}
/**
 * Pair and connect: parse the offer, establish the transport the offer's
 * mode names, run the sealed handshake (tunnel-protocol.md section 2) over
 * it, and return the live session. v2 'relay': all frames ride the room
 * WebSocket. v3 'direct': the room socket carries only the SDP exchange,
 * a WebRTC DataChannel is negotiated (non-trickle, STUN-only, no fallback),
 * the signaling socket is closed, and the same handshake runs over the
 * channel — the VPS never sees a handshake or application frame.
 * @param offerUrl QR content (URL with #offer= fragment or bare payload).
 * @param options resumeToken/callbacks/timeout.
 * @returns the open TunnelClient.
 * @throws TunnelError 'bad-offer' | 'expired' | 'bad-code' (host-rejected code/token) | 'handshake' | 'timeout' | 'ice-failed' (direct mode only; no TURN fallback exists).
 */
export declare function connect(offerUrl: string, options?: ConnectOptions): Promise<TunnelClient>;
/** Build a bounded WSS route under the advertised HTTPS Gateway base path. */
export declare function publicEndpointSocketUrl(endpoint: string, route: 'signal' | 'tunnel', room: string): string;
/**
 * Run the sealed handshake (tunnel-protocol.md §2) over any already-open
 * frame transport and return the live session. This is the factory a
 * separately established channel (e.g. a WebRTC DataChannel brought up by
 * out-of-band signaling) uses to construct a TunnelSession: the caller owns
 * transport setup and teardown-on-failure, this package owns the pairing
 * credential exchange and everything above it.
 * @param transport open, reliable, ordered frame pipe (see transport.ts).
 * @param hostPub host X25519 public key — the pairing trust anchor from the offer.
 * @param options code or deviceToken (the hello credential), callbacks, timeout.
 * @returns the open TunnelClient.
 * @throws TunnelError host verdict codes | 'handshake' | 'timeout'.
 */
export declare function openSession(transport: FrameTransport, hostPub: Uint8Array, options?: OpenSessionOptions): Promise<TunnelClient>;
/** Session implementation; socket.ts and http.ts ride its demux maps. */
export declare class TunnelSession implements TunnelClient {
    readonly deviceToken: string | null;
    private currentState;
    private sendSeq;
    private recvSeq;
    private idCounter;
    private readonly fetches;
    private readonly sockets;
    private readonly probes;
    private readonly transport;
    private readonly hostPub;
    private readonly ownSec;
    private readonly options;
    constructor(transport: FrameTransport, hostPub: Uint8Array, ownSec: Uint8Array, deviceToken: string, options: ConnectOptions);
    get state(): TunnelState;
    mintId(): string;
    /** Seal and send one session message, assigning the next outgoing seq. */
    send(message: Record<string, unknown>): void;
    fetch(path: string, init?: Parameters<TunnelClient['fetch']>[1]): Promise<Response>;
    openWebSocket(path: string): TunnelWebSocket;
    probe(timeoutMs?: number): Promise<void>;
    close(): void;
    discard(): void;
    registerFetch(id: string, pending: PendingFetch): void;
    dropFetch(id: string): void;
    registerSocket(id: string, socket: TunnelWebSocket): void;
    dropSocket(id: string): void;
    private onFrame;
    private dispatch;
    private protocolClose;
    private teardown;
}
//# sourceMappingURL=client.d.ts.map