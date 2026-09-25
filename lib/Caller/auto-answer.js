/**
 * Chama Baileys Caller — Voice Call Auto-Answer Plugin
 * 
 * Gives ANY Baileys bot instant WhatsApp VoIP voice call answering & audio playback!
 * 
 * @author Chama (@chamanemax02)
 */

import path from "node:path";
import { printChamaBanner } from "./banner.js";
import { VoipClient, CallState } from "./index.mjs";

let _activeVoipClient = null;

/**
 * Enable WhatsApp Voice Call Auto-Answer with audio playback on any Baileys socket.
 * 
 * @param {any} sock The Baileys socket created by makeWASocket()
 * @param {object} options Call configuration options
 * @param {string} [options.audio="welcome.wav"] Path to MP3 / WAV audio to play
 * @param {boolean} [options.autoAnswer=true] Automatically answer incoming calls
 * @param {number} [options.answerDelayMs=200] Delay before answering in milliseconds
 * @param {number} [options.durationMs=60000] Maximum call duration in milliseconds
 * @param {function} [options.onCall] Callback when an incoming call arrives
 * @param {function} [options.onAnswer] Callback when call is answered
 * @param {function} [options.onEnd] Callback when call ends
 * @returns {Promise<VoipClient>}
 */
export async function enableCallAutoAnswer(sock, options = {}) {
  printChamaBanner();

  if (_activeVoipClient) {
    try {
      _activeVoipClient.destroy?.();
    } catch {}
    _activeVoipClient = null;
  }

  const autoAnswer = options.autoAnswer !== false;
  const audioSource = options.audio || options.audioSource || options.audioFile || "welcome.wav";
  const videoSource = options.video || options.videoSource || options.videoFile || "sample.mp4";
  const durationMs = options.durationMs || 60000;
  const answerDelay = options.answerDelayMs || 200;
  const loop = options.loop !== false;
  const warmupSilenceMs = options.warmupSilenceMs || 1500;
  const loopGapMs = options.loopGapMs || 1500;

  console.log(`\x1b[38;5;82m📞 [Chama Caller] Voice/Video Engine Active — Auto-Answer: ${autoAnswer ? "ON" : "OFF"} | Audio: ${audioSource} | Video: ${videoSource} | Loop: ${loop ? "YES" : "NO"}\x1b[0m`);

  const client = new VoipClient({
    autoAnswer: false,
    defaultAudioSource: audioSource,
    defaultVideoSource: videoSource,
    defaultDurationMs: durationMs,
    loop,
    warmupSilenceMs,
    loopGapMs,
  });

  await client.attach(sock);
  _activeVoipClient = client;

  client.on("call", (call) => {
    const callerNumber = call.peerJid ? call.peerJid.split("@")[0].split(":")[0] : "Unknown";
    console.log(`\n\x1b[38;5;51m┌─────────────────────────────────────────────────────────────┐\x1b[0m`);
    console.log(`\x1b[38;5;51m│\x1b[0m  \x1b[1;37m📲 [CHAMA CALL]\x1b[0m \x1b[38;5;213mIncoming WhatsApp ${call.isVideo ? "VIDEO" : "VOICE"} Call\x1b[0m`);
    console.log(`\x1b[38;5;51m│\x1b[0m  👤 \x1b[38;5;222mCaller :\x1b[0m +${callerNumber}`);
    console.log(`\x1b[38;5;51m│\x1b[0m  🆔 \x1b[38;5;222mCall ID:\x1b[0m ${call.callId}`);
    console.log(`\x1b[38;5;51m└─────────────────────────────────────────────────────────────┘\x1b[0m`);

    call.recordAudio = options.recordCallerAudio !== false;
    const recordingsDir = options.recordingsDir || "./recordings";
    call.saveRecordingPath = path.resolve(recordingsDir, `incoming_${call.isVideo ? "video" : "voice"}_${callerNumber}_${Date.now()}.wav`);

    if (options.onCall) {
      try { options.onCall(call); } catch {}
    }

    if (autoAnswer) {
      setTimeout(() => {
        try {
          if (call.isVideo) {
            call.accept(audioSource, videoSource, true);
          } else {
            call.accept(audioSource);
          }
          if (options.onAnswer) {
            try { options.onAnswer(call); } catch {}
          }
        } catch (err) {
          console.error("❌ [Chama Caller] Error answering call:", err.message);
        }
      }, answerDelay);
    }

    call.on("connected", () => {
      console.log(`\x1b[38;5;46m✨ [CHAMA CALL] Connected to +${callerNumber}! Streaming ${call.isVideo ? "720p Video & Audio" : "Audio"}...\x1b[0m`);
    });

    call.on("ended", (reason) => {
      console.log(`\x1b[38;5;208m📴 [CHAMA CALL] Call Ended with +${callerNumber} (${reason})\x1b[0m\n`);
      if (options.onEnd) {
        try { options.onEnd(call, reason); } catch {}
      }
    });
  });

  return client;
}

export function getActiveVoipClient() {
  return _activeVoipClient;
}

export { CallState };
