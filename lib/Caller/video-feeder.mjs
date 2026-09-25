/**
 * Video Feeder for WhatsApp VoIP Calling
 * 
 * Decodes video files (MP4, MKV, WebM, etc.) into raw I420 / YUV420p frames using FFmpeg,
 * then streams frames with accurate cadence to the WhatsApp Web VoIP WASM engine.
 * 
 * @author Chama (@chamanemax02) & ShellTear
 */
import { spawn } from "node:child_process";

// In-memory cache for decoded video frames
const videoFramesCache = new Map();

export class VideoFeeder {
    source;
    width;
    height;
    fps;
    format; // 0 = NV12, 1 = I420
    orientation; // 1 = Normal (upright)
    onFrame;
    onFinished;
    loop;
    warmupSilenceMs;
    
    #active = false;
    #timer = null;
    #proc = null;
    #frames = null;
    #playhead = 0;
    #startTime = 0;
    #framesEmitted = 0;
    #frameIntervalMs = 0;
    #frameSize = 0;
    #blackFrame = null;
    #warmupRemaining = 0;

    constructor(
        source = "black",
        onFrame,
        width = 720,
        height = 1280,
        fps = 15,
        loop = true,
        warmupSilenceMs = 1000,
        onFinished = null
    ) {
        this.source = source;
        this.onFrame = onFrame;
        this.width = width;
        this.height = height;
        this.fps = fps;
        this.format = 0; // 0 = NV12 (required by WhatsApp Web VoIP WASM)
        this.orientation = 1; // 1 = Normal (upright)
        this.loop = loop;
        this.warmupSilenceMs = warmupSilenceMs;
        this.onFinished = onFinished;

        this.#frameIntervalMs = 1000 / this.fps;
        this.#frameSize = Math.floor(this.width * this.height * 1.5);
        this.#warmupRemaining = Math.max(0, Math.round(this.warmupSilenceMs / this.#frameIntervalMs));

        // Construct a neutral black frame in NV12
        this.#blackFrame = VideoFeeder.createBlackFrame(this.width, this.height);
    }

    get framesEmitted() {
        return this.#framesEmitted;
    }

    /**
     * Creates a pure neutral black frame in NV12 (Y=16, UV=128)
     */
    static createBlackFrame(width, height) {
        const frameSize = Math.floor(width * height * 1.5);
        const frame = new Uint8Array(frameSize);
        // Y plane (luminance): 16 is digital black in BT.601/BT.709
        frame.fill(16, 0, width * height);
        // UV interleaved plane: 128 is neutral (no color) in NV12
        frame.fill(128, width * height);
        return frame;
    }

    /**
     * Pre-decode video frames into memory ahead of time.
     */
    static preload = async (source, width = 720, height = 1280, fps = 15) => {
        if (!source || source === "black") return null;
        const cacheKey = `${source}:${width}:${height}:${fps}`;
        if (videoFramesCache.has(cacheKey)) {
            return videoFramesCache.get(cacheKey);
        }
        return VideoFeeder.#decodeSource(source, width, height, fps);
    };

    /**
     * Clear cached in-memory decoded video frames.
     */
    static clearCache = () => {
        videoFramesCache.clear();
    };

    static #decodeSource = (source, width = 720, height = 1280, fps = 15) => {
        const cacheKey = `${source}:${width}:${height}:${fps}`;
        const frameSize = Math.floor(width * height * 1.5);

        return new Promise((resolve) => {
            console.log(`[VideoFeeder] Decoding video frames: ${source} (${width}x${height} @ ${fps}fps NV12 Fullscreen)`);
            const proc = spawn("ffmpeg", [
                "-hide_banner",
                "-loglevel", "error",
                "-i", source,
                "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
                "-f", "rawvideo",
                "-pix_fmt", "nv12",
                "-r", String(fps),
                "pipe:1"
            ]);

            const frames = [];
            let leftover = Buffer.alloc(0);

            proc.stdout.on("data", (chunk) => {
                const combined = leftover.length > 0 ? Buffer.concat([leftover, chunk]) : chunk;
                let offset = 0;
                while (offset + frameSize <= combined.length) {
                    const frameSlice = combined.subarray(offset, offset + frameSize);
                    frames.push(new Uint8Array(frameSlice));
                    offset += frameSize;
                }
                leftover = offset < combined.length ? combined.subarray(offset) : Buffer.alloc(0);
            });

            proc.stderr.on("data", (chunk) => {
                process.stderr.write(`[VideoFeeder] ${chunk.toString().trim()}\n`);
            });

            proc.on("close", (code) => {
                if (frames.length > 0) {
                    videoFramesCache.set(cacheKey, frames);
                    console.log(`✅ [VideoFeeder] Decoded and cached ${frames.length} video frames (${(frames.length / fps).toFixed(1)}s) from ${source}`);
                    resolve(frames);
                } else {
                    console.warn(`[VideoFeeder] Decode produced 0 frames for ${source} (code ${code})`);
                    resolve(null);
                }
            });

            proc.on("error", (err) => {
                console.error(`[VideoFeeder] ffmpeg spawn error decoding ${source}:`, err);
                resolve(null);
            });
        });
    };

    start = () => {
        if (this.#active) return;
        this.#active = true;
        this.#startTime = performance.now();
        this.#framesEmitted = 0;
        this.#playhead = 0;

        const cacheKey = `${this.source}:${this.width}:${this.height}:${this.fps}`;
        if (!this.source || this.source === "black") {
            this.#frames = null;
            this.#startPacer();
            return;
        }

        const cached = videoFramesCache.get(cacheKey);
        if (cached && cached.length > 0) {
            console.log(`[VideoFeeder] Using cached video frames (${cached.length} frames) for ${this.source}`);
            this.#frames = cached;
            this.#startPacer();
            return;
        }

        // If not cached, start pacer immediately with black frames while decoding in background
        console.log(`[VideoFeeder] Video frames not cached yet; starting pacer with warmup while decoding ${this.source}...`);
        this.#startPacer();
        VideoFeeder.#decodeSource(this.source, this.width, this.height, this.fps).then((frames) => {
            if (this.#active && frames) {
                this.#frames = frames;
                console.log(`[VideoFeeder] Background video decode completed (${frames.length} frames); video streaming active!`);
            }
        });
    };

    #startPacer = () => {
        if (this.#timer || !this.#active) return;
        this.#tick();
        this.#timer = setInterval(this.#tick, Math.max(5, Math.floor(this.#frameIntervalMs / 4)));
    };

    #tick = () => {
        if (!this.#active) return;
        const elapsedMs = performance.now() - this.#startTime;
        const targetFrames = Math.floor(elapsedMs / this.#frameIntervalMs);

        while (this.#framesEmitted < targetFrames && this.#active) {
            this.#flushOne();
        }
    };

    #flushOne = () => {
        if (!this.#active) return;

        let frameToSend = this.#blackFrame;

        if (this.#warmupRemaining > 0) {
            this.#warmupRemaining--;
            frameToSend = this.#blackFrame;
        } else if (this.#frames && this.#frames.length > 0) {
            if (this.#playhead < this.#frames.length) {
                frameToSend = this.#frames[this.#playhead++];
            } else if (this.loop) {
                this.#playhead = 0;
                frameToSend = this.#frames[this.#playhead++];
            } else {
                frameToSend = this.#blackFrame;
                this.stop();
                this.onFinished?.();
                return;
            }
        }

        this.#framesEmitted++;
        if (this.onFrame) {
            try {
                this.onFrame(frameToSend, this.width, this.height, this.fps, this.orientation, this.format);
            } catch (err) {
                console.warn("[VideoFeeder] onFrame error:", err?.message || err);
            }
        }
    };

    stop = () => {
        if (!this.#active) return;
        this.#active = false;
        console.log(`[VideoFeeder] Stopped. Total emitted video frames: ${this.#framesEmitted}`);
        if (this.#timer) {
            clearInterval(this.#timer);
            this.#timer = null;
        }
        if (this.#proc) {
            try {
                this.#proc.kill("SIGTERM");
            } catch {}
            this.#proc = null;
        }
        this.#playhead = 0;
    };
}
