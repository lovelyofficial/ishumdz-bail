/**
 * Audio Utilities for Chama Baileys VoIP Calling
 * 
 * Provides PCM Float32 conversion to valid RIFF WAV buffers and helpers.
 * 
 * @author Chama (@chamanemax02) & ShellTear
 */
import fs from "node:fs";
import path from "node:path";

/**
 * Convert Float32Array audio chunks into a valid RIFF WAV buffer (16-bit PCM).
 * 
 * @param {Float32Array[]} chunks Array of Float32Array PCM chunks
 * @param {number} [sampleRate=16000] Sample rate in Hz
 * @param {number} [numChannels=1] Number of channels
 * @returns {Buffer} Valid WAV audio Buffer
 */
export function float32ToWav(chunks, sampleRate = 16000, numChannels = 1) {
    let totalSamples = 0;
    for (const chunk of chunks) {
        if (chunk && chunk.length) totalSamples += chunk.length;
    }
    const buffer = Buffer.alloc(44 + totalSamples * 2);

    // RIFF chunk descriptor
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + totalSamples * 2, 4);
    buffer.write("WAVE", 8);

    // "fmt " sub-chunk
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);                               // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20);                                // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(numChannels, 22);                      // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);                       // SampleRate
    buffer.writeUInt32LE(sampleRate * numChannels * 2, 28);     // ByteRate
    buffer.writeUInt16LE(numChannels * 2, 32);                  // BlockAlign
    buffer.writeUInt16LE(16, 34);                               // BitsPerSample (16-bit)

    // "data" sub-chunk
    buffer.write("data", 36);
    buffer.writeUInt32LE(totalSamples * 2, 40);

    let offset = 44;
    for (const chunk of chunks) {
        if (!chunk) continue;
        for (let i = 0; i < chunk.length; i++) {
            const s = Math.max(-1, Math.min(1, chunk[i]));
            buffer.writeInt16LE(s < 0 ? Math.floor(s * 0x8000) : Math.floor(s * 0x7FFF), offset);
            offset += 2;
        }
    }
    return buffer;
}

/**
 * Save Float32 PCM chunks to a WAV file on disk.
 * 
 * @param {Float32Array[]} chunks 
 * @param {string} filePath 
 * @param {number} [sampleRate=16000] 
 * @returns {Buffer}
 */
export function saveFloat32ToWavFile(chunks, filePath, sampleRate = 16000) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const wavBuffer = float32ToWav(chunks, sampleRate, 1);
    fs.writeFileSync(filePath, wavBuffer);
    return wavBuffer;
}
