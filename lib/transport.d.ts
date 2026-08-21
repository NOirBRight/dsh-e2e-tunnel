/** The binary frame pipe a TunnelSession rides. See the module header for the contract. */
export interface FrameTransport {
    send(frame: Uint8Array): void;
    onFrame(cb: (frame: Uint8Array | string) => void): void;
    onClose(cb: () => void): void;
    close(code?: number, reason?: string): void;
}
/** Hard cap on one RTCDataChannel application message (SCTP interop insurance). */
export declare const MAX_MESSAGE_BYTES: number;
/**
 * Defensive cap on one reassembled frame. Session plaintext is capped at
 * 200 KiB by the tunnel protocol, so honest frames are far smaller; this
 * bound exists to stop a peer from forcing unbounded reassembly buffers.
 */
export declare const MAX_FRAME_BYTES: number;
/**
 * Split one frame into ≤60 KiB application messages (pure).
 * @param frame the whole tunnel frame.
 * @param frameId sender-side rolling id (u16); only meaningful for fragmented frames.
 * @returns one or more wire messages, each ≤ MAX_MESSAGE_BYTES.
 */
export declare function fragmentFrame(frame: Uint8Array, frameId: number): Uint8Array[];
/**
 * Strict reassembler for the wire format above. At most one frame in
 * flight; fragments must continue the in-flight frame at the exact next
 * offset. Any violation throws TunnelError('bad-fragment') and the
 * reassembler is unusable afterwards — the owning transport closes.
 */
export declare class FrameReassembler {
    private pending;
    private broken;
    /**
     * @param message one received application message (≤ MAX_MESSAGE_BYTES).
     * @returns the complete frame, or null while the frame is incomplete.
     * @throws TunnelError 'bad-fragment' on any format/order/size violation.
     */
    push(message: Uint8Array): Uint8Array | null;
    private accept;
}
/** Shared ordered-delivery core: normalizes payloads through a promise queue so seq order survives async Blob reads. */
declare abstract class QueuedTransport implements FrameTransport {
    private frameHandler;
    private closeHandler;
    private queue;
    /** Enqueue one raw payload; the handler fires after every earlier payload. */
    protected ingest(data: unknown): void;
    /**
     * Transform one normalized payload into a deliverable frame.
     * @returns the frame to deliver, or null to swallow it (incomplete fragment).
     */
    protected process(frame: Uint8Array | string): Uint8Array | string | null;
    /** Fire the close handler once all queued frames have been delivered. */
    protected emitClose(): void;
    onFrame(cb: (frame: Uint8Array | string) => void): void;
    onClose(cb: () => void): void;
    abstract send(frame: Uint8Array): void;
    abstract close(code?: number, reason?: string): void;
}
/** Relay-room WebSocket adapter (the M3 wire). Construct once the socket exists; open-wait stays with the caller. */
export declare class WsFrameTransport extends QueuedTransport {
    private readonly ws;
    constructor(ws: WebSocket);
    send(frame: Uint8Array): void;
    close(code?: number, reason?: string): void;
}
/**
 * Structural RTCDataChannel surface the adapter relies on. Declared here
 * (rather than using the DOM RTCDataChannel type) so the package stays
 * testable in Node and tolerant of WebView quirks; a real RTCDataChannel
 * satisfies this structurally.
 */
export interface DataChannelLike {
    binaryType: string;
    send(data: Uint8Array | ArrayBuffer): void;
    close(): void;
    addEventListener(type: string, cb: (ev: MessageEvent) => void): void;
}
/**
 * WebRTC DataChannel adapter. The channel must already be open and
 * negotiated reliable+ordered (the default): the session protocol numbers
 * every frame and closes on a seq gap, so reordering is fatal — the same
 * assumption the single relay WebSocket provided. DTLS secures the wire,
 * but the NaCl handshake/session layer on top is unchanged: the signaling
 * path stays untrusted.
 *
 * Fragmentation is transparent: send() splits frames into ≤60 KiB
 * application messages and incoming messages are reassembled before the
 * FrameTransport handler ever runs (see the wire format at the top of this
 * file). A malformed fragment stream is a protocol error and closes the
 * transport.
 */
export declare class DataChannelTransport extends QueuedTransport {
    private readonly channel;
    private readonly reassembler;
    private nextFrameId;
    constructor(channel: DataChannelLike);
    send(frame: Uint8Array): void;
    protected process(frame: Uint8Array | string): Uint8Array | string | null;
    close(): void;
}
export {};
//# sourceMappingURL=transport.d.ts.map