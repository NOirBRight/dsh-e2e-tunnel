import type { DataChannelLike } from './transport.ts';
/** The DataChannel label both ends negotiate (ordered, reliable — the defaults). */
export declare const TUNNEL_CHANNEL_LABEL = "dsh-tunnel";
/** One SDP signal (the payload of the signaling envelope). */
export interface SdpSignal {
    kind: 'offer' | 'answer';
    description: {
        type: string;
        sdp: string;
    };
}
/** Structural room-socket surface negotiation relies on (a DOM WebSocket satisfies it). */
export interface SignalingSocket {
    send(data: string): void;
    addEventListener(type: string, cb: (ev: {
        data?: unknown;
    }) => void): void;
    close(code?: number, reason?: string): void;
}
/** Structural RTCPeerConnection surface negotiation relies on (native satisfies it). */
export interface PeerConnectionLike {
    iceGatheringState: string;
    connectionState?: string;
    localDescription: {
        type?: string;
        sdp?: string | null;
    } | null;
    createDataChannel(label: string): DataChannelLike;
    setLocalDescription(description?: {
        type?: string;
        sdp?: string;
    }): Promise<void>;
    setRemoteDescription(description: {
        type: string;
        sdp: string;
    }): Promise<void>;
    addEventListener(type: string, cb: () => void): void;
    close(): void;
}
export interface NegotiateOptions {
    /** STUN-only server URLs from the v3 offer; omitted when empty. */
    ice?: string[];
    /** Bound for the whole exchange (gather + answer + channel open); default 15_000 ms. */
    timeoutMs?: number;
    /** PeerConnection factory; defaults to the native RTCPeerConnection. */
    createPeerConnection?: (config: {
        iceServers?: {
            urls: string[];
        }[];
    }) => PeerConnectionLike;
}
/** A successfully negotiated direct channel plus its teardown handle. */
export interface NegotiatedChannel {
    /** The open, reliable, ordered DataChannel, ready for openSession. */
    channel: DataChannelLike;
    /** Close the underlying peer connection (idempotent; does NOT touch the signaling socket). */
    closePeer(): void;
}
/** Encode one SDP signal as the room-socket text frame. */
export declare function encodeSignal(signal: SdpSignal): string;
/**
 * Decode one room-socket text frame.
 * @returns the SDP signal, or null for relay control envelopes (ignored).
 * @throws TunnelError 'handshake' on any malformed signal message.
 */
export declare function decodeSignal(text: string): SdpSignal | null;
/**
 * Negotiate a direct DataChannel: offer with gathered (non-trickle) ICE,
 * await the answer, await the channel opening. The client is always the
 * offerer and channel creator — mirroring the relay mode, where the client
 * also speaks first.
 * @param socket open room socket (role=client); NOT closed here — the caller owns its lifetime.
 * @param options see {@link NegotiateOptions}.
 * @returns the open channel and the peer-connection teardown handle.
 * @throws TunnelError 'handshake' | 'timeout' | 'ice-failed'.
 */
export declare function negotiateDirectChannel(socket: SignalingSocket, options?: NegotiateOptions): Promise<NegotiatedChannel>;
//# sourceMappingURL=signal.d.ts.map