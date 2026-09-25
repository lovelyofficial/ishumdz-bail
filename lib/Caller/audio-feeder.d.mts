export declare class AudioFeeder {
    #private;
    private readonly sampleRate;
    private readonly channels;
    private readonly framesPerChunk;
    private readonly onChunk;
    private readonly source;
    private readonly onFinished?;
    private readonly loop;
    private readonly warmupSilenceMs;
    private readonly trailingSilenceMs;
    droppedChunks: number;
    underflowChunks: number;
    bytesProduced: number;
    constructor(sampleRate: number, channels: number, framesPerChunk: number, onChunk: (chunk: Float32Array) => void, source?: string, onFinished?: (() => void) | undefined, loop?: boolean, warmupSilenceMs?: number, // 500ms warm-up for WebRTC/RTP stabilization
    trailingSilenceMs?: number);
    get chunksEmitted(): number;
    /**
     * Pre-decode an audio file into memory ahead of time so playback can start with 0ms latency.
     */
    static preload: (source: string, sampleRate?: number, channels?: number) => Promise<Float32Array | null>;
    start: () => void;
    stop: () => void;
}
