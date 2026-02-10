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
                    console.error("Error parsing message", e);
                }
            }
        };

        this.ws.onerror = (error) => {
            console.error("Gemini WebSocket Error:", error);
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

// ... (skipping lines)

export async function analyzeAudioFile(base64Data, mimeType, apiKey, context = {}) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

    const { keywords = [], scorecard = null } = context;

    let prompt = "Transcribe this audio. Identify speakers (Speaker 1, Speaker 2) and providing timestamps (MM:SS) for each turn. Also provide a summary, specific keywords found, and sentiment.";

    if (keywords.length > 0) {
        prompt += `\nCheck for these specific keywords: ${keywords.join(', ')}.`;
    }

    if (scorecard) {
        prompt += `\nEvaluate the conversation based on this scorecard: "${scorecard.name}". Criteria:\n${scorecard.criteria.map(c => `- ${c}`).join('\n')}. Provide a score (Yes/No/Partial or 1-10) and reasoning for each.`;
    }

    prompt += "\nReturn the response as a JSON object with keys: 'transcript' (LIST of objects: { speaker: 'Speaker 1' | 'Speaker 2', time: 'MM:SS', text: string }), 'summary', 'keywords' (list of strings), 'sentiment', 'scorecard' (list of objects: { criteria, score, reasoning }). Do not use markdown code blocks.";

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        }
    ]);

    try {
        const text = result.response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON", e);
        return { transcript: result.response.text(), summary: "Failed to parse analysis.", keywords: [] };
    }
}
