/**
 * Client side of v3 'direct' negotiation (offer.ts). Signaling rides the
 * same room WebSocket the relay mode uses, but carries ONLY SDP envelopes —
 * never handshake or application frames — while the NaCl hello/ack and all
 * session traffic run unchanged over the negotiated DataChannel
 * (openSession), so the signaling VPS cannot impersonate the host and never
 * carries a handshake or application frame. The signaling socket stays open
 * for the peer's whole lifetime (future renegotiation/ICE restart needs a
 * channel); the caller owns closing it when the tunnel dies.
 *
 * Wire contract (text frames on the room socket):
 *   { "type": "signal", "phase": "sdp",
 *     "payload": "<base64url(JSON {kind:'offer'|'answer', description:{type,sdp}})>" }
 * Envelopes with a "relay" key are relay control messages (PROTOCOL.md §5)
 * and are ignored; anything else malformed is a handshake error.
 *
 * Non-trickle ICE: the client gathers to completion before sending its
 * offer, and no candidates are ever exchanged. No TURN. An ICE failure is
 * surfaced as TunnelError('ice-failed'). Automatic connection policy may
 * then try Tunnel Fallback on the same Public Endpoint; this signaling
 * path itself never retries into a project-operated relay.
 *
 * The peer connection is created through a structural interface
 * (PeerConnectionLike) so tests can substitute a fake; the default factory
 * uses the browser's native RTCPeerConnection.
 */
import { b64urlDecode, b64urlEncode, utf8Decode, utf8Encode } from "./bytes.js";
import { TunnelError } from "./errors.js";
/** The DataChannel label both ends negotiate (ordered, reliable — the defaults). */
export const TUNNEL_CHANNEL_LABEL = 'dsh-tunnel';
/** Encode one SDP signal as the room-socket text frame. */
export function encodeSignal(signal) {
    return JSON.stringify({ type: 'signal', phase: 'sdp', payload: b64urlEncode(utf8Encode(JSON.stringify(signal))) });
}
/**
 * Decode one room-socket text frame.
 * @returns the SDP signal, or null for relay control envelopes (ignored).
 * @throws TunnelError 'handshake' on any malformed signal message.
 */
export function decodeSignal(text) {
    let envelope;
    try {
        envelope = JSON.parse(text);
    }
    catch {
        throw new TunnelError('handshake', 'signaling message is not JSON');
    }
    if (envelope !== null && typeof envelope === 'object' && 'relay' in envelope)
        return null;
    const e = envelope;
    if (e.type !== 'signal' || e.phase !== 'sdp' || typeof e.payload !== 'string') {
        throw new TunnelError('handshake', 'unexpected signaling envelope');
    }
    let signal;
    try {
        signal = JSON.parse(utf8Decode(b64urlDecode(e.payload)));
    }
    catch {
        throw new TunnelError('handshake', 'malformed signal payload');
    }
    const s = signal;
    const d = s.description;
    if ((s.kind !== 'offer' && s.kind !== 'answer') ||
        d === null || typeof d !== 'object' ||
        typeof d.type !== 'string' || d.type === '' ||
        typeof d.sdp !== 'string' || d.sdp === '') {
        throw new TunnelError('handshake', 'malformed signal payload');
    }
    return { kind: s.kind, description: { type: d.type, sdp: d.sdp } };
}
function defaultCreatePeerConnection(config) {
    return new RTCPeerConnection(config);
}
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
export async function negotiateDirectChannel(socket, options = {}) {
    const timeoutMs = options.timeoutMs ?? 15_000;
    const createPc = options.createPeerConnection ?? defaultCreatePeerConnection;
    const pc = createPc(options.ice !== undefined && options.ice.length > 0 ? { iceServers: [{ urls: options.ice }] } : {});
    let timer;
    const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new TunnelError('timeout', 'direct negotiation timed out')), timeoutMs);
    });
    try {
        const channel = await Promise.race([negotiate(pc, socket), deadline]);
        let closed = false;
        return {
            channel,
            closePeer() {
                if (closed)
                    return;
                closed = true;
                try {
                    pc.close();
                }
                catch { /* already gone */ }
            },
        };
    }
    catch (error) {
        try {
            pc.close();
        }
        catch { /* already gone */ }
        throw error;
    }
    finally {
        clearTimeout(timer);
    }
}
async function negotiate(pc, socket) {
    const channel = pc.createDataChannel(TUNNEL_CHANNEL_LABEL);
    // Attach both waits before any async step so no event can race past.
    const channelOpen = onceChannelOpen(pc, channel);
    const answer = waitForAnswer(socket);
    await pc.setLocalDescription();
    await gatheringComplete(pc);
    const local = pc.localDescription;
    const sdp = local !== null && typeof local.sdp === 'string' ? local.sdp : null;
    if (sdp === null || sdp === '')
        throw new TunnelError('handshake', 'no local SDP after ICE gathering');
    const type = local !== null && typeof local.type === 'string' && local.type !== '' ? local.type : 'offer';
    socket.send(encodeSignal({ kind: 'offer', description: { type, sdp } }));
    const desc = await answer;
    await pc.setRemoteDescription(desc.description);
    await channelOpen;
    return channel;
}
/** @returns resolved once ICE gathering reaches 'complete' (non-trickle: the offer then carries every candidate). */
function gatheringComplete(pc) {
    if (pc.iceGatheringState === 'complete')
        return Promise.resolve();
    return new Promise((resolve) => {
        pc.addEventListener('icegatheringstatechange', () => {
            if (pc.iceGatheringState === 'complete')
                resolve();
        });
    });
}
/** @returns the host's answer; relay control frames are skipped, socket close/malformed frames reject. */
function waitForAnswer(socket) {
    return new Promise((resolve, reject) => {
        socket.addEventListener('message', (ev) => {
            if (typeof ev.data !== 'string')
                return; // signaling is text-only; binaries are not ours
            let signal;
            try {
                signal = decodeSignal(ev.data);
            }
            catch (error) {
                reject(error);
                return;
            }
            if (signal === null)
                return; // relay control envelope
            if (signal.kind !== 'answer') {
                reject(new TunnelError('handshake', 'expected an SDP answer, got ' + signal.kind));
                return;
            }
            resolve(signal);
        });
        socket.addEventListener('close', () => reject(new TunnelError('handshake', 'signaling socket closed during negotiation')));
    });
}
/** @returns resolved on channel open; rejects 'ice-failed' when the connection or channel dies first. */
function onceChannelOpen(pc, channel) {
    return new Promise((resolve, reject) => {
        channel.addEventListener('open', () => resolve());
        channel.addEventListener('close', () => reject(new TunnelError('ice-failed', 'data channel closed before opening')));
        pc.addEventListener('connectionstatechange', () => {
            if (pc.connectionState === 'failed') {
                reject(new TunnelError('ice-failed', 'ICE connection failed; no TURN fallback exists by design'));
            }
        });
    });
}
//# sourceMappingURL=signal.js.map