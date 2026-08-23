/** Shared offer fields (tunnel-protocol.md §1). */
interface OfferBase {
    /** Reachability address: relay WSS base (v2) or signaling WSS URL (v3). */
    addr: string;
    /** Room id (128-bit hex) on the relay/signaling server. */
    room: string;
    /** Host X25519 public key, base64url — the pairing trust anchor. */
    pubkey: string;
    /** One-time pairing code. */
    code: string;
    /** Expiry, unix seconds. */
    exp: number;
    /** Human-facing Host name; presentation metadata, never endpoint or Room identity. */
    hostName?: string;
}
/** v2: traffic rides the relay room (NaCl-sealed frames over the room WebSocket). */
export interface RelayOffer extends OfferBase {
    v: 2;
    mode: 'relay';
}
/**
 * v3: the room is signaling-only (SDP/ICE exchange); traffic rides a WebRTC
 * DataChannel brought up out-of-band and handed to openSession. ice lists
 * STUN servers only — never TURN: there is no relay fallback by design, and
 * a TURN URL would smuggle one in.
 */
export interface DirectOffer extends OfferBase {
    v: 3;
    mode: 'direct';
    /** STUN server URLs (stun:/stuns:); optional — host candidates suffice on shared-LAN paths. */
    ice?: string[];
}
/** Capabilities advertised by one Host-owned Public Endpoint. */
export interface PublicEndpointCapabilities {
    browser: boolean;
    direct: boolean;
    tunnel: boolean;
    endpointRefresh: boolean;
}
/** v4: one Host-owned HTTPS endpoint provides rendezvous and optional tunnel fallback. */
export interface PublicEndpointOffer {
    v: 4;
    mode: 'public';
    protocol: 1;
    endpoint: string;
    endpointKind: 'temporary' | 'custom';
    room: string;
    pubkey: string;
    code: string;
    exp: number;
    capabilities: PublicEndpointCapabilities;
    /** Human-facing Host name available immediately after scanning. */
    hostName?: string;
    /** STUN-only ICE discovery; Tunnel Fallback is the non-direct path. */
    ice?: string[];
}
/** Parsed pairing offer (tunnel-protocol.md §1). */
export type Offer = RelayOffer | DirectOffer | PublicEndpointOffer;
export interface ParseOfferOptions {
    /** Permit an expired pairing window when a caller has a persistent device token. */
    allowExpired?: boolean;
}
/**
 * Parse and validate an offer. Accepts a full URL with an '#offer=<base64url>'
 * fragment or a bare base64url payload. v2 requires mode 'relay', v3 requires
 * mode 'direct' with a STUN-only ice list — anything else is rejected, never
 * coerced.
 * @param offerUrl QR content or bare payload.
 * @param options Validation policy; token reconnects may outlive the QR window.
 * @returns the validated offer.
 * @throws TunnelError 'bad-offer' (malformed) or 'expired' (past exp).
 */
export declare function parseOffer(offerUrl: string, options?: ParseOfferOptions): Offer;
export {};
//# sourceMappingURL=offer.d.ts.map