import { b64decode, b64encode, utf8Decode, utf8Encode } from "./bytes.js";
import { TunnelError } from "./errors.js";
/**
 * Minimal browser-WebSocket facade over one tunnel multiplex channel
 * (ws-open/ws-ack/ws-msg/ws-close). Covers exactly what the upstream browser
 * carrier uses: readyState + constants, send, close, on*-properties,
 * addEventListener/removeEventListener (with { once }).
 */
export class TunnelWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    CONNECTING = 0;
    OPEN = 1;
    CLOSING = 2;
    CLOSED = 3;
    onopen = null;
    onmessage = null;
    onerror = null;
    onclose = null;
    /** Accepted for interface parity; payloads are always delivered as strings. */
    binaryType = 'arraybuffer';
    id;
    ready = 0;
    listeners = new Map();
    session;
    path;
    constructor(session, path) {
        this.session = session;
        this.path = path;
        this.id = session.mintId();
        session.registerSocket(this.id, this);
        try {
            session.send({ t: 'ws-open', id: this.id, path });
        }
        catch (error) {
            // Listeners attach after construction; surface the failure asynchronously.
            queueMicrotask(() => this.fail(String(error), 1006));
        }
    }
    get readyState() {
        return this.ready;
    }
    addEventListener(type, cb, options) {
        const list = this.listeners.get(type) ?? [];
        list.push({ cb, once: options?.once === true });
        this.listeners.set(type, list);
    }
    removeEventListener(type, cb) {
        const list = this.listeners.get(type);
        if (!list)
            return;
        const next = list.filter((entry) => entry.cb !== cb);
        if (next.length === 0)
            this.listeners.delete(type);
        else
            this.listeners.set(type, next);
    }
    /** Send one ws-msg frame. */
    send(data) {
        if (this.ready !== 1)
            throw new TunnelError('closed', 'WebSocket is not open');
        const bytes = typeof data === 'string' ? utf8Encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
        this.session.send({ t: 'ws-msg', id: this.id, data: b64encode(bytes) });
    }
    close(code = 1000, reason = '') {
        if (this.ready === 2 || this.ready === 3)
            return;
        this.ready = 2;
        try {
            this.session.send({ t: 'ws-close', id: this.id, code, reason });
        }
        catch {
            this.session.dropSocket(this.id); // tunnel already gone; close arrives via tunnelClosed
        }
        this.settle(3, code, reason);
    }
    /** @internal host acknowledged the loopback WebSocket. */
    onAck() {
        if (this.ready !== 0)
            return;
        this.ready = 1;
        this.emit('open', {});
    }
    /** @internal host refused the loopback WebSocket. */
    onErr(message) {
        this.fail(message, 1006);
    }
    /** @internal host to client payload; delivered as a string MessageEvent. */
    onMsg(dataB64) {
        if (this.ready !== 1)
            return;
        this.emit('message', { data: utf8Decode(b64decode(dataB64)) });
    }
    /** @internal host closed its side. */
    onHostClose(code, reason) {
        this.settle(3, code ?? 1000, reason ?? '');
    }
    /** @internal the whole tunnel dropped. */
    tunnelClosed() {
        this.settle(3, 1006, 'tunnel closed');
    }
    fail(message, code) {
        this.emit('error', { message });
        this.settle(3, code, message);
    }
    settle(state, code, reason) {
        if (this.ready === 3)
            return;
        this.ready = state;
        if (state === 3) {
            this.session.dropSocket(this.id);
            this.emit('close', { code, reason });
        }
    }
    emit(type, event) {
        const ev = { type, ...event };
        const prop = type === 'open' ? this.onopen : type === 'message' ? this.onmessage : type === 'error' ? this.onerror : this.onclose;
        if (prop)
            prop(ev);
        const list = this.listeners.get(type);
        if (!list)
            return;
        for (const entry of [...list]) {
            entry.cb(ev);
            if (entry.once)
                this.removeEventListener(type, entry.cb);
        }
    }
}
//# sourceMappingURL=socket.js.map