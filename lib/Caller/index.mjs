/**
 * baileys-caller — WhatsApp voice calling for Node.js.
 *
 * Wraps WhatsApp Web's official VoIP WASM stack and routes signaling through
 * Baileys. Public surface:
 *
 *   const client = new VoipClient({ authDir })
 *   await client.connect()
 *   const call = await client.call("12345678901", { audioSource: "./hi.mp3" })
 *
 * @author ShellTear
 */
import { EventEmitter } from "node:events";
import { randomBytes, createHmac } from "node:crypto";
import { resolve } from "node:path";
import { WasmEngine } from "./wasm-engine.mjs";
import { RelayRtcTransport } from "./relay-transport.mjs";
import { SignalingBridge } from "./signaling.mjs";
import { AudioFeeder } from "./audio-feeder.mjs";
import { VideoFeeder } from "./video-feeder.mjs";
import { CallState } from "./types.mjs";
import { float32ToWav, saveFloat32ToWavFile } from "./audio-utils.js";
export { CallState } from "./types.mjs";
export { AudioFeeder } from "./audio-feeder.mjs";
export { VideoFeeder } from "./video-feeder.mjs";
export { float32ToWav, saveFloat32ToWavFile } from "./audio-utils.js";
const SHA256_LEN = 32;
const loadBaileys = async () => {
    try {
        const rel = "../index.js";
        return await import(rel);
    }
    catch { }
    try {
        const rel2 = "./index.js";
        return await import(rel2);
    }
    catch { }
    try {
        return await import("@whiskeysockets/baileys");
    }
    catch {
        throw new Error("Could not load Baileys module. Make sure chama-baileys-caller or @whiskeysockets/baileys is available.");
    }
};
const toBareJid = (jid) => {
    if (!jid)
        return jid;
    const at = jid.indexOf("@");
    if (at < 0)
        return jid;
    const user = jid.slice(0, at).split(":")[0];
    return `${user}@${jid.slice(at + 1)}`;
};
const computeHkdf = (key, salt, info, length) => {
    const effectiveSalt = salt && salt.length > 0 ? Buffer.from(salt) : Buffer.alloc(SHA256_LEN, 0);
    const prk = createHmac("sha256", effectiveSalt).update(key).digest();
    const blocks = Math.ceil(length / SHA256_LEN);
    const okm = Buffer.alloc(blocks * SHA256_LEN);
    let prev = Buffer.alloc(0);
    for (let i = 1; i <= blocks; i += 1) {
        prev = createHmac("sha256", prk)
            .update(prev)
            .update(info)
            .update(Buffer.from([i]))
            .digest();
        prev.copy(okm, (i - 1) * SHA256_LEN);
    }
    return new Uint8Array(okm.buffer, okm.byteOffset, length);
};
const computeHmacSha256 = (data, key) => {
    const result = createHmac("sha256", Buffer.from(key)).update(data).digest();
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
};
const isCallReceiptNode = (node) => {
    if (node?.tag !== "receipt")
        return false;
    const child = Array.isArray(node.content) ? node.content[0] : null;
    return !!(child?.attrs?.["call-id"] || child?.attrs?.call_id);
};
/** A live or recently-ended call. */
export class ActiveCall extends EventEmitter {
    callId;
    engine;
    durationMs;
    #state = CallState.Idle;
    #endResolver;
    #endPromise;
    #endTimer = null;
    #ended = false;
    /** @internal mirrors the source path for the audio feeder */
    _audioSource = "silence";
    /** @internal mirrors the source path for the video feeder */
    _videoSource = "black";
    isVideo = false;
    peerJid = "";
    isIncoming = false;
    _videoWidth = 720;
    _videoHeight = 1280;
    _videoFps = 15;
    #accepted = false;
    /** @internal */
    _shouldAutoAccept = false;
    #audioChunks = [];
    recordAudio = true;
    saveRecordingPath = null;
    #ringingTimer = null;
    constructor(callId, engine, durationMs) {
        super();
        this.callId = callId;
        this.engine = engine;
        this.durationMs = durationMs;
        this.#endPromise = new Promise((res) => { this.#endResolver = res; });
        this.#ringingTimer = setTimeout(() => {
            if (this.#state !== CallState.Active && !this.#ended) {
                console.log(`[ActiveCall] Call ${this.callId} timed out waiting for answer (45s). Ending...`);
                this.end();
            }
        }, 45000);
    }
    get state() { return this.#state; }
    accept = (audioSource, videoSource, isVideo) => {
        if (this.#ended || this.#accepted)
            return;
        this.#accepted = true;
        if (audioSource)
            this._audioSource = audioSource;
        if (videoSource)
            this._videoSource = videoSource;
        if (isVideo !== undefined)
            this.isVideo = Boolean(isVideo);
        if (this.#state >= CallState.ReceivedCall) {
            console.log(`[ActiveCall] Accepting call ${this.callId} immediately (WASM state: ${this.#state}, isVideo: ${this.isVideo})...`);
            try {
                this.engine.acceptCall(true, this.isVideo);
            }
            catch (err) {
                console.error("[ActiveCall] acceptCall error:", err?.message || err);
            }
        }
        else {
            console.log(`[ActiveCall] Call ${this.callId} accept requested, but WASM state is ${this.#state}. Queuing accept until WASM reaches ReceivedCall (3)...`);
            this._shouldAutoAccept = true;
        }
    };
    reject = () => {
        if (this.#ended)
            return;
        try {
            this.engine.rejectCall();
        }
        catch { }
        this.end();
    };
    end = () => {
        if (this.#ended)
            return;
        this.#ended = true;
        if (this.#endTimer) {
            clearTimeout(this.#endTimer);
            this.#endTimer = null;
        }
        try {
            this.engine.endCall(0, true);
        }
        catch { }
        this._forceEnd("ended");
    };
    mute = (muted) => {
        try {
            this.engine.setMute(muted);
        }
        catch { }
    };
    waitForEnd = () => this.#endPromise;
    /** @internal — called by VoipClient on WASM call-state change */
    _updateState = (state) => {
        this.#state = state;
        if (state === CallState.ReceivedCall) {
            if (this._shouldAutoAccept) {
                this._shouldAutoAccept = false;
                console.log(`[ActiveCall] WASM reached ReceivedCall (state 3) for call ${this.callId}. Executing queued accept now (isVideo: ${this.isVideo})!`);
                try {
                    this.engine.acceptCall(true, this.isVideo);
                }
                catch (err) {
                    console.error("[ActiveCall] Delayed acceptCall error:", err?.message || err);
                }
            }
        }
        else if (state === CallState.PreacceptReceived) {
            this.emit("ringing");
        }
        else if (state === CallState.Active) {
            if (this.#ringingTimer) {
                clearTimeout(this.#ringingTimer);
                this.#ringingTimer = null;
            }
            if (this.durationMs > 0 && !this.#endTimer) {
                this.#endTimer = setTimeout(() => this.end(), this.durationMs);
            }
            this.emit("connected");
        }
        else if (state === CallState.Idle || state === CallState.Ending) {
            this._forceEnd("ended");
        }
    };
    /** @internal */
    _emitAudio = (pcm) => {
        if (this.recordAudio && pcm && pcm.length > 0) {
            this.#audioChunks.push(new Float32Array(pcm));
        }
        this.emit("audio", pcm);
    };
    getRecordedWav = (sampleRate = 16000) => {
        if (!this.#audioChunks.length)
            return null;
        return float32ToWav(this.#audioChunks, sampleRate, 1);
    };
    /** @internal */
    _forceEnd = (reason) => {
        if (this.#ended)
            return;
        this.#ended = true;
        if (this.#ringingTimer) {
            clearTimeout(this.#ringingTimer);
            this.#ringingTimer = null;
        }
        if (this.#endTimer) {
            clearTimeout(this.#endTimer);
            this.#endTimer = null;
        }
        if (this.recordAudio && this.#audioChunks.length > 0) {
            try {
                const wav = this.getRecordedWav();
                if (wav) {
                    this.emit("recording", wav);
                    if (this.saveRecordingPath) {
                        saveFloat32ToWavFile(this.#audioChunks, this.saveRecordingPath, 16000);
                        console.log(`🎙️ [ActiveCall] Saved caller audio recording to ${this.saveRecordingPath} (${(wav.length / 32000).toFixed(1)}s)`);
                    }
                }
            }
            catch (err) {
                console.error("[ActiveCall] Error generating recording:", err?.message || err);
            }
        }
        this.emit("ended", reason);
        this.#endResolver(reason);
    };
}
/** Top-level client. Connects to WhatsApp and lets you place or answer calls. */
export class VoipClient extends EventEmitter {
    #config;
    #engine = null;
    #relay = null;
    #signaling = null;
    #sock = null;
    #activeCall = null;
    #baileys = null;
    // Capture state populated when WASM negotiates audio params
    #capturePtr = 0;
    #captureChunkBytes = 0;
    #captureSampleRate = 16000;
    #captureChannels = 1;
    #captureFramesPerChunk = 320;
    #feeder = null;
    #videoFeeder = null;
    #silenceTimer = null;
    static preloadAudio = AudioFeeder.preload;
    static preloadVideo = VideoFeeder.preload;
    constructor(config = {}) {
        super();
        this.#config = config;
    }
    get sock() { return this.#sock; }
    get isReady() { return !!(this.#engine?.isInitialized?.() && this.#signaling); }
    get activeCall() {
        if (this.#activeCall && (this.#activeCall.state === CallState.Idle || this.#activeCall.state === CallState.Ending)) {
            this.#activeCall = null;
        }
        return this.#activeCall;
    }
    get engine() { return this.#engine; }
    /** Connect to WhatsApp and bring up the WASM VoIP stack. */
    connect = async () => {
        this.#baileys = await loadBaileys();
        const { useMultiFileAuthState, default: makeWASocket, DisconnectReason } = this.#baileys;
        const makeSocket = makeWASocket ?? this.#baileys.makeWASocket ?? this.#baileys;
        let state;
        let saveCreds;
        if (this.#config.authState) {
            state = this.#config.authState.state;
            saveCreds = this.#config.authState.saveCreds;
        }
        else {
            const authDir = resolve(this.#config.authDir || "./auth");
            const authResult = await useMultiFileAuthState(authDir);
            state = authResult.state;
            saveCreds = authResult.saveCreds;
        }
        const silentLogger = {
            level: "silent",
            child: () => silentLogger,
            trace: () => { },
            debug: () => { },
            info: () => { },
            warn: () => { },
            error: () => { },
            fatal: () => { },
        };
        const createSocket = () => makeSocket({
            auth: state,
            emitOwnEvents: true,
            logger: silentLogger,
        });
        // Connect with auto-reconnect on the post-QR 515 stream-error path.
        await new Promise((resolveOpen, rejectOpen) => {
            let opened = false;
            let retries = 0;
            const maxRetries = 5;
            const connectSocket = () => {
                this.#sock = createSocket();
                this.#sock.ev.on("creds.update", saveCreds);
                process.removeAllListeners("uncaughtException");
                process.on("uncaughtException", (err) => {
                    const code = err?.output?.statusCode ?? err?.data?.attrs?.code;
                    if ((code === 515 || code === "515") && !opened && retries < maxRetries) {
                        retries += 1;
                        setTimeout(connectSocket, 1500);
                    }
                    else if (!opened) {
                        rejectOpen(err);
                    }
                });
                this.#sock.ev.on("connection.update", (update) => {
                    this.emit("connection.update", update);
                    if (update.qr) {
                        this.emit("qr", update.qr);
                    }
                    if (update.connection === "open") {
                        opened = true;
                        process.removeAllListeners("uncaughtException");
                        this.emit("ready");
                        resolveOpen();
                        return;
                    }
                    if (update.connection === "close" && !opened) {
                        const err = update.lastDisconnect?.error;
                        const statusCode = err?.output?.statusCode ?? err?.data?.attrs?.code;
                        const msg = err?.message || "";
                        const isLoggedOut = statusCode === DisconnectReason?.loggedOut;
                        if (!isLoggedOut) {
                            retries += 1;
                            setTimeout(connectSocket, 1500);
                        }
                        else {
                            rejectOpen(err ?? new Error("socket closed before open"));
                        }
                    }
                });
            };
            connectSocket();
        });
        await this.#initVoipOnSocket();
        if (this.#config.defaultAudioSource && this.#config.defaultAudioSource !== "silence") {
            void AudioFeeder.preload(this.#config.defaultAudioSource, this.#captureSampleRate, this.#captureChannels);
        }
    };
    /** Attach to an existing Baileys socket instead of creating a new one. */
    attach = async (sock) => {
        this.#baileys = await loadBaileys();
        this.#sock = sock;
        if (this.#sock.authState?.creds?.me?.id && this.#sock.ws?.isOpen) {
            await this.#initVoipOnSocket();
        }
        else {
            await new Promise((resolve) => {
                const handler = async (update) => {
                    if (update.connection === "open") {
                        this.#sock.ev.off("connection.update", handler);
                        await this.#initVoipOnSocket();
                        resolve();
                    }
                };
                this.#sock.ev.on("connection.update", handler);
            });
        }
    };
    #initVoipOnSocket = async () => {
        this.#signaling = new SignalingBridge({ sock: this.#sock });
        await this.#signaling.init();
        this.#relay = new RelayRtcTransport({
            onTransportMessage: (data, ip, port) => this.#engine?.handleOnTransportMessage(data, ip, port),
            onIceRtt: (rttMs, ip, port) => this.#engine?.updateIceRtt(rttMs, ip, port),
        });
        this.#engine = new WasmEngine({
            callbacks: {
                onLog: (level, msg) => {
                    if (!msg) return;
                    if (
                        msg.includes("audio_health") ||
                        msg.includes("wa_tp_") ||
                        msg.includes("wa_tp.") ||
                        msg.includes("wa_call_event") ||
                        msg.includes("spkrProc") ||
                        msg.includes("micProc") ||
                        msg.includes("virtual_audio") ||
                        msg.includes("audiodev") ||
                        msg.includes("pjlib") ||
                        msg.includes("endpoint") ||
                        msg.includes("wa_opus") ||
                        msg.includes("wa_media_api") ||
                        msg.includes("Data Tx to peer") ||
                        msg.includes("RelayLatency") ||
                        msg.includes("Sampled Ping") ||
                        msg.includes("sampled ping") ||
                        msg.includes("delayed ping") ||
                        msg.includes("wa_freeze_counts") ||
                        msg.includes("pwr in dB") ||
                        msg.includes("change_call_state") ||
                        msg.includes("Handle MESSAGE") ||
                        msg.includes("init_local_state") ||
                        msg.includes("start_precall") ||
                        msg.includes("VOIP STAC")
                    ) return;
                    if (level === "error" || level === "warn") {
                        console.log(`\x1b[33m[VoIP ${level}]\x1b[0m ${msg}`);
                    }
                },
                onSignalingXmpp: (peerJid, callId, xmlPayload) => this.#signaling.sendSignaling(peerJid, callId, xmlPayload),
                onCallEvent: (eventType, eventData) => this.#handleCallEvent(eventType, eventData),
                sendDataToRelay: (data, ip, port) => this.#relay.send(data, ip, port),
                onAudioCaptureInit: (config) => this.#handleAudioCaptureInit(config),
                onAudioCaptureStart: () => this.#handleAudioCaptureStart(),
                onAudioCaptureStop: () => this.#handleAudioCaptureStop(),
                onVideoCaptureStart: (data) => this.#handleVideoCaptureStart(data),
                onVideoCaptureStop: () => this.#handleVideoCaptureStop(),
                onAudioPlaybackData: (audioData) => this.#activeCall?._emitAudio(audioData),
                cryptoHkdf: computeHkdf,
                hmacSha256: computeHmacSha256,
            },
        });
        await this.#engine.initialize();
        this.#signaling.attachEngine(this.#engine);
        const selfPnJid = this.#sock.authState.creds.me?.id;
        const selfLidJid = this.#sock.authState.creds.me?.lid;
        this.#engine.initVoipStack(selfPnJid, toBareJid(selfPnJid), selfLidJid);
        await this.#engine.waitForVoipStackReady();
        try {
            this.#engine.updateNetworkMedium(2, 0);
        }
        catch { }
        this.#sock.ws?.on?.("CB:call", async (node) => {
            this.#checkIncomingCallTerminate(node);
            this.#checkIncomingCallOffer(node);
            try {
                await this.#signaling.processIncomingCall(node, this.#engine, this.#activeCall?.callId ?? "");
            }
            catch (err) {
                console.error("[VoipClient] Error processing incoming call signaling:", err);
            }
        });
        this.#sock.ws?.on?.("CB:receipt", (node) => {
            if (!isCallReceiptNode(node))
                return;
            this.#signaling.processIncomingReceipt(node, this.#engine, this.#activeCall?.callId ?? "");
        });
    };
    /** Place an outbound voice or video call. */
    call = async (phoneNumber, opts = {}) => {
        if (!this.#engine || !this.#signaling)
            throw new Error("Not connected. Call connect() first.");
        if (this.#activeCall)
            throw new Error("A call is already active.");
        const targetNumber = phoneNumber.replace(/\D/g, "");
        const targetPnJid = `${targetNumber}@s.whatsapp.net`;
        const durationMs = opts.durationMs ?? 120_000;
        const audioSource = opts.audioSource ?? opts.audio ?? "silence";
        const isVideo = Boolean(opts.isVideo);
        const videoSource = opts.videoSource ?? opts.video ?? "black";
        const peerLid = await this.#signaling.resolveLid(targetPnJid);
        if (!peerLid)
            throw new Error(`Could not resolve LID for ${targetPnJid}`);
        for (const jid of [targetPnJid, peerLid]) {
            try {
                await this.#sock.presenceSubscribe(jid);
            }
            catch { }
        }
        await new Promise((r) => setTimeout(r, 750));
        const peerDeviceJids = await this.#signaling.discoverPeerDevices(peerLid);
        const deviceList = peerDeviceJids.length ? peerDeviceJids : [toBareJid(peerLid)];
        const selfPn = this.#sock.authState.creds.me?.id;
        const bareSelfPn = selfPn ? toBareJid(selfPn) : null;
        const sessionTargets = [...deviceList];
        if (bareSelfPn) {
            sessionTargets.push(`${bareSelfPn.split("@")[0]}:0@s.whatsapp.net`);
        }
        await this.#signaling.ensureSessionsForPeers(sessionTargets);
        await new Promise((r) => setTimeout(r, 500));
        await Promise.allSettled([
            this.#signaling.issueTcToken(peerLid),
            this.#signaling.issueTcToken(targetPnJid)
        ]);
        const tcToken = await this.#signaling.ensureTcToken(peerLid, targetPnJid);
        const callId = ("00" + randomBytes(16).toString("hex").slice(2)).toUpperCase();
        this.#signaling.trackCall(callId, { isVideo, targetPn: targetPnJid });
        const videoWidth = opts.width ?? opts.videoWidth ?? this.#config.videoWidth ?? 720;
        const videoHeight = opts.height ?? opts.videoHeight ?? this.#config.videoHeight ?? 1280;
        const videoFps = opts.fps ?? opts.videoFps ?? this.#config.videoFps ?? 15;
        const call = new ActiveCall(callId, this.#engine, durationMs);
        call.isVideo = isVideo;
        call._audioSource = audioSource;
        call._videoSource = videoSource;
        call._videoWidth = videoWidth;
        call._videoHeight = videoHeight;
        call._videoFps = videoFps;
        call.recordAudio = opts.recordCallerAudio !== false;
        if (opts.saveRecordingPath) {
            call.saveRecordingPath = opts.saveRecordingPath;
        } else if (opts.recordingsDir) {
            call.saveRecordingPath = resolve(opts.recordingsDir, `outgoing_${isVideo ? "video" : "voice"}_${targetNumber}_${Date.now()}.wav`);
        } else if (opts.recordCallerAudio !== false) {
            call.saveRecordingPath = resolve("./recordings", `outgoing_${isVideo ? "video" : "voice"}_${targetNumber}_${Date.now()}.wav`);
        }
        this.#activeCall = call;
        call.on("ended", () => {
            this.#signaling.untrackCall(callId);
            if (this.#activeCall === call) {
                this.#activeCall = null;
            }
            this.#handleAudioCaptureStop();
            this.#handleVideoCaptureStop();
            try {
                this.#engine?.endCall(0, false);
            }
            catch { }
            void this.#relay?.closeAll();
        });
        if (isVideo && videoSource && videoSource !== "black") {
            void VideoFeeder.preload(videoSource, videoWidth, videoHeight, videoFps);
        }
        this.#engine.startCall({
            peerJid: peerLid,
            peerPn: targetPnJid,
            peerList: deviceList,
            callId,
            isVideo,
            isLidCall: true,
            isFromDialer: false,
            extraData: tcToken,
        });
        return call;
    };
    /** Accept an incoming call */
    acceptCall = (audioSource, videoSource, isVideo) => {
        if (!this.#engine)
            throw new Error("Not connected. Call connect() first.");
        if (this.#activeCall) {
            this.#activeCall.accept(audioSource, videoSource, isVideo);
            return;
        }
        this.#engine.acceptCall(true, Boolean(isVideo));
    };
    /** Reject an incoming call */
    rejectCall = () => {
        if (!this.#engine)
            throw new Error("Not connected. Call connect() first.");
        this.#engine.rejectCall();
        this.#activeCall?._forceEnd("rejected");
        this.#activeCall = null;
    };
    /** Tear down the WhatsApp socket and release resources. */
    disconnect = () => {
        this.#activeCall?._forceEnd("disconnect");
        this.#activeCall = null;
        this.#relay?.closeAll();
        this.#engine?.destroy();
        this.#sock?.end?.();
        this.#engine = null;
        this.#relay = null;
        this.#signaling = null;
        this.#sock = null;
    };
    // ─── private ──────────────────────────────────────────────────────────────
    #checkIncomingCallOffer = (node) => {
        try {
            const { getAllBinaryNodeChildren } = this.#baileys;
            const voipChild = getAllBinaryNodeChildren(node)[0];
            console.log(`📞 [VoipClient] checkIncomingCallOffer child tag: <${voipChild?.tag}>`);
            if (!voipChild || voipChild.tag !== "offer")
                return;
            const incomingCallId = String(voipChild.attrs["call-id"] ?? voipChild.attrs.call_id ?? "");
            const senderDeviceJid = String(voipChild.attrs.participant ?? "") ||
                String(node.attrs.participant ?? "") ||
                String(node.attrs.from ?? "") ||
                String(voipChild.attrs["call-creator"] ?? "");
            const callbackPeerJid = String(node.attrs.from ?? "") || senderDeviceJid;
            const isVideoCall = voipChild.attrs.video === "true" ||
                voipChild.attrs["video-call"] === "true" ||
                voipChild.attrs.type === "video" ||
                (Array.isArray(voipChild.content) && voipChild.content.some((c) => c?.tag === "video"));
            console.log(`📞 [VoipClient] Incoming call type: ${isVideoCall ? "VIDEO" : "VOICE"} (callId: ${incomingCallId})`);
            if (this.#activeCall) {
                if (this.#activeCall.callId === incomingCallId) {
                    console.log(`[VoipClient] Retransmitted/duplicate offer for call ${incomingCallId} received, ignoring.`);
                    return;
                }
                console.log(`[VoipClient] Cleaning up previous call ${this.#activeCall.callId} to receive new call ${incomingCallId}`);
                this.#activeCall._forceEnd("superseded");
                this.#activeCall = null;
                this.#handleAudioCaptureStop();
                this.#handleVideoCaptureStop();
                try {
                    this.#engine?.endCall(0, false);
                }
                catch { }
                void this.#relay?.closeAll();
            }
            const call = new ActiveCall(incomingCallId, this.#engine, this.#config.defaultDurationMs ?? 60_000);
            call.peerJid = callbackPeerJid || senderDeviceJid;
            call.isIncoming = true;
            call.isVideo = isVideoCall;
            call._audioSource = this.#config.defaultAudioSource ?? "silence";
            call._videoSource = this.#config.defaultVideoSource ?? "black";
            this.#activeCall = call;
            if (call._audioSource && call._audioSource !== "silence") {
                void AudioFeeder.preload(call._audioSource, this.#captureSampleRate, this.#captureChannels);
            }
            if (call.isVideo && call._videoSource && call._videoSource !== "black") {
                void VideoFeeder.preload(call._videoSource, 720, 1280, 15);
            }
            call.on("ended", () => {
                if (this.#activeCall === call) {
                    this.#activeCall = null;
                }
                this.#handleAudioCaptureStop();
                this.#handleVideoCaptureStop();
                try {
                    this.#engine?.endCall(0, false);
                }
                catch { }
                void this.#relay?.closeAll();
            });
            this.emit("call", call);
            if (this.#config.autoAnswer) {
                console.log(`[VoipClient] autoAnswer is enabled. Requesting accept for call ${call.callId} (isVideo: ${call.isVideo})...`);
                call.accept(call._audioSource, call._videoSource, call.isVideo);
            }
        }
        catch (err) {
            console.error("[VoipClient] Error inspecting incoming call:", err);
        }
    };
    #checkIncomingCallTerminate = (node) => {
        try {
            const { getAllBinaryNodeChildren } = this.#baileys;
            const voipChild = getAllBinaryNodeChildren(node)[0];
            if (voipChild && (voipChild.tag === "terminate" || voipChild.tag === "reject")) {
                console.log(`📴 [VoipClient] Remote peer terminated/rejected call (tag: <${voipChild.tag}>)`);
                if (this.#activeCall) {
                    this.#activeCall._forceEnd(voipChild.tag);
                    this.#activeCall = null;
                }
                this.#handleAudioCaptureStop();
                this.#handleVideoCaptureStop();
                try {
                    this.#engine?.endCall(0, false);
                }
                catch { }
                void this.#relay?.closeAll();
            }
        }
        catch { }
    };
    #handleCallEvent = (eventType, eventData) => {
        console.log(`[VoipClient] WASM Event ${eventType}:`, eventData ? eventData.slice(0, 100) : "");
        if (eventType === 16 && eventData) {
            try {
                const parsed = JSON.parse(eventData);
                const info = parsed.call_info ?? parsed.callInfo ?? {};
                const callState = Number(info.call_state ?? info.callState ?? 0);
                console.log(`[VoipClient] WASM Call State transitioned to: ${callState}`);
                this.#activeCall?._updateState(callState);
                if (callState === 6) { // CallState.Active
                    console.log("[VoipClient] Call reached Active state (6). Starting streamers...");
                    this.#startVoicePlayback();
                    if (this.#activeCall?.isVideo) {
                        this.#startVideoPlayback();
                    }
                }
            }
            catch { }
        }
        else if (eventType === 156 && eventData) {
            try {
                const update = JSON.parse(eventData);
                console.log(`[VoipClient] WASM Relay List Update (${update.relays?.length || 0} relays available)`);
                this.#relay?.updateRelayList(update);
            }
            catch { }
        }
    };
    #ensureCaptureBuffer = () => {
        if (!this.#engine)
            return;
        if (!this.#capturePtr) {
            const chunkSamples = this.#captureFramesPerChunk * this.#captureChannels;
            this.#captureChunkBytes = chunkSamples * Float32Array.BYTES_PER_ELEMENT;
            this.#capturePtr = this.#engine.malloc(this.#captureChunkBytes);
            console.log(`[VoipClient] Allocated audio capture buffer: ptr=${this.#capturePtr}, bytes=${this.#captureChunkBytes} (${this.#captureSampleRate}Hz, ${this.#captureChannels}ch)`);
        }
    };
    #handleAudioCaptureInit = (config) => {
        if (!this.#engine)
            return;
        this.#captureSampleRate = config.sampleRate || 16000;
        this.#captureChannels = config.channels || 1;
        this.#captureFramesPerChunk = config.framesPerChunk || 320;
        this.#ensureCaptureBuffer();
    };
    #handleAudioCaptureStart = () => {
        if (!this.#engine)
            return;
        this.#ensureCaptureBuffer();
        if (!this.#capturePtr) {
            console.error("[VoipClient] Failed to allocate audio capture buffer!");
            return;
        }
        if (this.#activeCall?.state === CallState.Active) {
            this.#startVoicePlayback();
        }
        else {
            this.#startSilenceFeeder();
        }
    };
    #startSilenceFeeder = () => {
        if (this.#silenceTimer || this.#feeder)
            return;
        const chunkSamples = this.#captureFramesPerChunk * this.#captureChannels;
        const silence = new Float32Array(chunkSamples);
        const intervalMs = (this.#captureFramesPerChunk / this.#captureSampleRate) * 1000;
        this.#silenceTimer = setInterval(() => {
            if (this.#engine && this.#capturePtr && !this.#feeder) {
                this.#engine.sendAudioData(silence, this.#capturePtr);
            }
        }, intervalMs);
    };
    #stopSilenceFeeder = () => {
        if (this.#silenceTimer) {
            clearInterval(this.#silenceTimer);
            this.#silenceTimer = null;
        }
    };
    #startVoicePlayback = () => {
        if (this.#feeder) {
            console.log("[VoipClient] Audio feeder is already active.");
            return;
        }
        const audioSource = this.#activeCall?._audioSource ?? this.#config.defaultAudioSource ?? "silence";
        const loop = this.#config.loop !== false;
        const warmupSilenceMs = this.#config.warmupSilenceMs ?? 1500;
        const trailingSilenceMs = this.#config.trailingSilenceMs ?? 2000;
        const loopGapMs = this.#config.loopGapMs ?? 1500;
        console.log(`[VoipClient] Call active. Starting high-precision AudioFeeder for: ${audioSource} (loop: ${loop}, warmup: ${warmupSilenceMs}ms)`);
        this.#stopSilenceFeeder();
        this.#feeder = new AudioFeeder(
            this.#captureSampleRate,
            this.#captureChannels,
            this.#captureFramesPerChunk,
            (chunk) => {
                if (this.#engine && this.#capturePtr) {
                    this.#engine.sendAudioData(chunk, this.#capturePtr);
                }
            },
            audioSource,
            () => {
                if (!loop) {
                    console.log("[VoipClient] Audio playback completed. Auto hanging up call...");
                    this.#activeCall?.end();
                }
            },
            loop,
            warmupSilenceMs,
            trailingSilenceMs,
            loopGapMs
        );
        this.#feeder.start();
    };
    #handleAudioCaptureStop = () => {
        console.log("[VoipClient] Stopping AudioFeeder...");
        this.#stopSilenceFeeder();
        this.#feeder?.stop();
        this.#feeder = null;
        if (this.#engine && this.#capturePtr) {
            try {
                this.#engine.free(this.#capturePtr);
            }
            catch { }
            this.#capturePtr = 0;
        }
    };
    #startVideoPlayback = (targetWidth = 720, targetHeight = 1280, targetFps = 15) => {
        if (this.#videoFeeder) {
            console.log("[VoipClient] Video feeder is already active.");
            return;
        }
        if (!this.#activeCall?.isVideo) {
            return;
        }
        const videoSource = this.#activeCall?._videoSource ?? this.#config.defaultVideoSource ?? "black";
        const width = this.#activeCall?._videoWidth ?? targetWidth;
        const height = this.#activeCall?._videoHeight ?? targetHeight;
        const fps = this.#activeCall?._videoFps ?? targetFps;
        const loop = this.#config.loop !== false;
        const warmupSilenceMs = this.#config.warmupSilenceMs ?? 1000;
        console.log(`[VoipClient] Call active. Starting VideoFeeder for: ${videoSource} (${width}x${height} @ ${fps}fps, loop: ${loop}, warmup: ${warmupSilenceMs}ms)`);
        this.#videoFeeder = new VideoFeeder(
            videoSource,
            (frameBuffer, w, h, f, orientation, format) => {
                if (this.#engine) {
                    this.#engine.sendVideoFrame(frameBuffer, w, h, f, orientation, format);
                }
            },
            width,
            height,
            fps,
            loop,
            warmupSilenceMs,
            () => {
                console.log("[VoipClient] Video playback finished.");
            }
        );
        this.#videoFeeder.start();
    };
    #handleVideoCaptureStart = (data) => {
        console.log("[VoipClient] Video capture start requested by WASM:", data);
        let width = data?.width || 720;
        let height = data?.height || 1280;
        if (width > height) {
            // WASM default is landscape 1280x720, but mobile WhatsApp video call is portrait 720x1280!
            width = 720;
            height = 1280;
        }
        const fps = data?.max_fps || data?.maxFps || 15;
        if (this.#activeCall?.state === CallState.Active || this.#activeCall?.isVideo) {
            this.#startVideoPlayback(width, height, fps);
        }
    };
    #handleVideoCaptureStop = () => {
        console.log("[VoipClient] Stopping VideoFeeder...");
        this.#videoFeeder?.stop();
        this.#videoFeeder = null;
    };
    destroy = () => {
        try {
            this.#stopSilenceFeeder();
            this.#feeder?.stop();
            this.#feeder = null;
            this.#handleVideoCaptureStop();
            this.#activeCall?.end();
            this.#activeCall = null;
            void this.#relay?.closeAll();
            this.#relay = null;
            this.#engine?.destroy();
            this.#engine = null;
            this.#sock?.end(undefined);
            this.#sock = null;
        }
        catch { }
    };
}
