/** Public API of @dsh-mobile/e2e-tunnel. */
export { connect, generateClientKeypair, openSession, publicEndpointSocketUrl, TunnelSession } from "./client.js";
export { parseOffer } from "./offer.js";
export { TunnelError } from "./errors.js";
export { connectionAttempts } from "./connection-policy.js";
export { ConnectionCoordinator, DEFAULT_DIRECT_GRACE_MS } from "./connection-manager.js";
export { HeartbeatController } from "./heartbeat.js";
export { TunnelWebSocket } from "./socket.js";
export { WsFrameTransport, DataChannelTransport, fragmentFrame, FrameReassembler, MAX_MESSAGE_BYTES, MAX_FRAME_BYTES } from "./transport.js";
export { negotiateDirectChannel, encodeSignal, decodeSignal, TUNNEL_CHANNEL_LABEL } from "./signal.js";
export { b64urlEncode, b64urlDecode } from "./bytes.js";
export { compactDisplayName } from "./display-name.js";
//# sourceMappingURL=index.js.map