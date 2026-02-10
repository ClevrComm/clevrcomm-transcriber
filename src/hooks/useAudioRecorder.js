import { useState, useRef, useCallback } from 'react';

const AUDIO_WORKLET_CODE = `
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const float32Data = input[0];
      const int16Data = new Int16Array(float32Data.length);
      for (let i = 0; i < float32Data.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Data[i]));
        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      this.port.postMessage(int16Data.buffer, [int16Data.buffer]);
    }
    return true;
  }
}
registerProcessor('audio-processor', AudioProcessor);
`;

export function useAudioRecorder({ onAudioData }) {
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const workletNodeRef = useRef(null);

    const startRecording = useCallback(async () => {
        try {
            if (isRecording) return;

            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                }
            });
            streamRef.current = audioStream;
            setStream(audioStream);

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            // Load worklet from inline blob
            const blob = new Blob([AUDIO_WORKLET_CODE], { type: 'application/javascript' });
            const workletUrl = URL.createObjectURL(blob);
            await audioContext.audioWorklet.addModule(workletUrl);

            const source = audioContext.createMediaStreamSource(audioStream);
            const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');

            workletNode.port.onmessage = (event) => {
                if (onAudioData) {
                    onAudioData(event.data);
                }
            };

            source.connect(workletNode);
            workletNode.connect(audioContext.destination); // Keep graph alive
            workletNodeRef.current = workletNode;

            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
        }
    }, [isRecording, onAudioData]);

    const stopRecording = useCallback(() => {
        if (!isRecording) return;

        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setIsRecording(false);
        setStream(null);
    }, [isRecording]);

    return { isRecording, startRecording, stopRecording, stream };
}
