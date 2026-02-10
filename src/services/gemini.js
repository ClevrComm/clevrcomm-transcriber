import { GoogleGenerativeAI } from "@google/generative-ai";

const HOST = "generativelanguage.googleapis.com";
const URI = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export class GeminiLiveService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.ws = null;
        this.onMessage = null;
    }

    connect(onMessage, systemInstruction = null) {
        this.onMessage = onMessage;
        this.systemInstruction = systemInstruction;
        const url = `${URI}?key=${this.apiKey}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log("Connected to Gemini Live API");
            this.sendInitialSetup();
        };

        this.ws.onmessage = async (event) => {
            if (event.data instanceof Blob) {
                console.log("Received blob message");
            } else {
                try {
                    const data = JSON.parse(event.data);

                    // Handle all types of responses for immediate streaming
                    // Check for serverContent (final or partial)
                    if (data.serverContent?.modelTurn?.parts) {
                        this.onMessage(data);
                    }
                    // Check for tool calls or other response types
                    else if (data.serverContent?.turnComplete !== undefined) {
                        // Turn complete signal
                        console.log("Turn complete");
                    }
                    // Setup acknowledgment
                    else if (data.setupComplete) {
                        console.log("Setup complete, ready for audio");
                    }
                    // Pass through any other data
                    else {
                        this.onMessage(data);
                    }
                } catch (e) {
                    console.warn("Error parsing message", e);
                }
            }
        };

        this.ws.onerror = (error) => {
            console.warn("Gemini WebSocket Error:", error);
        };

        this.ws.onclose = () => {
            console.log("Gemini WebSocket Closed");
        }
    }

    sendInitialSetup() {
        const setupMessage = {
            setup: {
                model: "models/gemini-2.0-flash",
                generation_config: {
                    response_modalities: ["TEXT"],
                    // Enable streaming for immediate partial results
                    temperature: 0.7,
                    top_p: 0.95,
                    top_k: 40,
                }
            }
        };

        if (this.systemInstruction) {
            setupMessage.setup.system_instruction = {
                parts: [{ text: this.systemInstruction }]
            };
        }

        this.send(setupMessage);
    }

    sendAudioChunk(base64Data) {
        const msg = {
            realtime_input: {
                media_chunks: [
                    {
                        mime_type: "audio/pcm",
                        data: base64Data
                    }
                ]
            }
        };
        this.send(msg);
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn("WebSocket not open, cannot send");
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// ============================================================
// PASS 1: Pure Transcription (Audio → Streamed Plain Text)
// Fast, cheap — user sees words appearing instantly.
// ============================================================
export async function transcribeAudio(base64Data, mimeType, apiKey, onProgress = null) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Flash Lite is ~50% cheaper — transcription is a straightforward task
    const model = genAI.getGenerativeModel({
        model: "models/gemini-2.0-flash-lite",
        generationConfig: { temperature: 0 }  // deterministic for accuracy
    });

    const prompt = `Transcribe this audio accurately. Identify different speakers as "Speaker 1", "Speaker 2", etc. Provide timestamps (MM:SS) for each speaker turn.

Format each turn on its own line like this:
[00:00] Speaker 1: What they said here.
[00:15] Speaker 2: Their response here.

Rules:
- Output ONLY the transcript lines, nothing else.
- Do NOT add any summary, analysis, or commentary.
- Do NOT wrap in JSON or markdown code blocks.
- Each speaker turn should be a separate line.`;

    let fullText = '';
    try {
        const result = await model.generateContentStream([
            prompt,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            }
        ]);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            if (onProgress) {
                onProgress(chunkText, fullText);
            }
        }

        console.log("[Pass 1] Transcription complete. Length:", fullText.length);
        return fullText.trim();
    } catch (e) {
        console.warn("[Pass 1] Transcription failed", e);
        throw new Error("Transcription failed: " + e.message);
    }
}

// ============================================================
// PASS 2: Text Analysis (Transcript Text → Structured JSON)
// ~100x faster than audio — processes text only.
// ============================================================
export async function analyzeTranscript(transcriptText, apiKey, context = {}) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Flash for analysis — needs reasoning ability for summaries & scoring
    const model = genAI.getGenerativeModel({
        model: "models/gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",  // constrained JSON output
            temperature: 0.3  // mostly deterministic, slight creativity for summaries
        }
    });

    const { keywords = [], scorecard = null } = context;

    // NOTE: We skip re-structuring the transcript here — the client parses it
    // from the Pass 1 output using parseTranscriptText(). This saves output tokens.
    let prompt = `Analyze the following conversation transcript.

TRANSCRIPT:
"""
${transcriptText}
"""

Return a JSON object with these keys:
- "summary": A concise executive summary of the conversation (2-4 sentences).
- "keywords": A list of important keywords/phrases found in the conversation.
- "sentiment": Overall sentiment of the conversation (e.g. "Positive", "Negative", "Neutral", "Mixed").`;

    if (keywords.length > 0) {
        prompt += `\n- Also specifically check for and include these keywords if found: ${keywords.join(', ')}.`;
    }

    if (scorecard) {
        prompt += `\n- "scorecard": Evaluate the conversation based on scorecard "${scorecard.name}". Criteria:\n${scorecard.criteria.map(c => `  - ${c}`).join('\n')}\n  For each criterion, provide: { "criteria": string, "score": "Yes"/"No"/"Partial" or 1-10, "reasoning": string }.`;
    } else {
        prompt += `\n- "scorecard": An empty array [].`;
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // With responseMimeType: "application/json", output is already clean JSON
        const parsed = JSON.parse(text);

        // Merge in the structured transcript from client-side parsing
        parsed.transcript = parseTranscriptText(transcriptText);

        console.log("[Pass 2] Analysis complete. Keys:", Object.keys(parsed));
        return parsed;
    } catch (e) {
        console.warn("[Pass 2] Analysis failed", e);
        // Return a safe fallback so the UI doesn't crash
        return {
            transcript: parseTranscriptText(transcriptText),
            summary: "Analysis failed. The transcript is available above.",
            keywords: keywords.length > 0 ? keywords : [],
            sentiment: "Unknown",
            scorecard: []
        };
    }
}

// Helper: Parse plain-text transcript lines into structured array
// Format: [MM:SS] Speaker N: text
function parseTranscriptText(text) {
    if (!text) return [];
    const lines = text.split('\n').filter(l => l.trim());
    const parsed = [];

    for (const line of lines) {
        const match = line.match(/^\[(\d{1,2}:\d{2})\]\s*(Speaker\s*\d+|[^:]+):\s*(.+)/i);
        if (match) {
            parsed.push({
                time: match[1],
                speaker: match[2].trim(),
                text: match[3].trim()
            });
        } else if (line.trim()) {
            // Fallback for lines that don't match the expected format
            parsed.push({
                time: '',
                speaker: 'Speaker',
                text: line.trim()
            });
        }
    }
    return parsed;
}
