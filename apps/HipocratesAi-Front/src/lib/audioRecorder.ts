/**
 * AudioWorklet-based PCM recorder.
 *
 * Backend (Deepgram) expects `linear16` PCM at 16 kHz mono. Browsers'
 * MediaRecorder doesn't expose PCM; we use Web Audio API to grab raw samples
 * from getUserMedia, downsample to 16kHz, convert Float32 → Int16, and emit
 * ArrayBuffer chunks to the caller (typically a WS .send).
 *
 * The worklet processor runs on the audio thread and posts chunks back via
 * `port.postMessage` — keeps the main thread free.
 */

const WORKLET_PROCESSOR_NAME = 'hipo-pcm-recorder';

const WORKLET_SOURCE = `
class HipoPcmRecorder extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetRate = (options && options.processorOptions && options.processorOptions.targetRate) || 16000;
    this.sourceRate = sampleRate;
    this.ratio = this.sourceRate / this.targetRate;
    this.acc = 0;
    this.buffer = [];
    this.chunkSize = 3200; // ~200ms at 16kHz
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;

    // Downsample by accumulator (linear interp for simplicity).
    for (let i = 0; i < channel.length; i++) {
      this.acc += 1;
      if (this.acc >= this.ratio) {
        this.acc -= this.ratio;
        // Clamp + Float32 → Int16
        let s = channel[i];
        if (s > 1) s = 1;
        else if (s < -1) s = -1;
        const i16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
        this.buffer.push(i16 | 0);
        if (this.buffer.length >= this.chunkSize) {
          const out = new Int16Array(this.buffer);
          this.port.postMessage(out.buffer, [out.buffer]);
          this.buffer = [];
        }
      }
    }
    return true;
  }
}
registerProcessor('${WORKLET_PROCESSOR_NAME}', HipoPcmRecorder);
`;

export interface PcmRecorder {
  stop: () => Promise<void>;
}

interface StartRecorderArgs {
  /** Receives PCM 16-bit LE chunks at 16kHz mono. */
  onChunk: (chunk: ArrayBuffer) => void;
  onError?: (err: unknown) => void;
}

export async function startPcmRecorder({ onChunk, onError }: StartRecorderArgs): Promise<PcmRecorder> {
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let worklet: AudioWorkletNode | null = null;
  let blobUrl: string | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    context = new AudioContext();
    blobUrl = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: 'application/javascript' }));
    await context.audioWorklet.addModule(blobUrl);

    source = context.createMediaStreamSource(stream);
    worklet = new AudioWorkletNode(context, WORKLET_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 1,
      processorOptions: { targetRate: 16000 },
    });

    worklet.port.onmessage = evt => {
      const buf = evt.data as ArrayBuffer;
      onChunk(buf);
    };

    source.connect(worklet);
  } catch (err) {
    if (onError) onError(err);
    cleanup();
    throw err;
  }

  function cleanup() {
    try {
      worklet?.port.close();
    } catch {
      /* ignore */
    }
    try {
      source?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      stream?.getTracks().forEach(t => t.stop());
    } catch {
      /* ignore */
    }
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrl = null;
    }
    if (context) {
      context.close().catch(() => undefined);
      context = null;
    }
  }

  return {
    async stop() {
      cleanup();
    },
  };
}
