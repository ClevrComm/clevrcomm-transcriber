import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Buffer } from 'buffer'; // Add this import for Buffer

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const AUDIO_URL = "https://cdn.discordapp.com/attachments/1241121334290022440/1468717552917287115/3450686765052.mp3?ex=698ba0d0&is=698a4f50&hm=9ab429d312916fb4780e5fbbfe3269e0b7709a79b1bf70c9606375a96cd05671&";

if (!API_KEY) {
    console.error("Error: VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

async function verify() {
    console.log("1. Fetching user audio...");

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(AUDIO_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        console.log(`   Audio fetched (${base64Audio.length} bytes base64)`);

        console.log("2. Initializing Gemini Client...");
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Using the verified working model
        const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

        console.log("3. Sending to Gemini for analysis (Structured Mode)...");

        let prompt = "Transcribe this audio. Identify speakers (Speaker 1, Speaker 2) and providing timestamps (MM:SS) for each turn. Also provide a summary, specific keywords found, and sentiment.";
        prompt += "\nReturn the response as a JSON object with keys: 'transcript' (LIST of objects: { speaker: 'Speaker 1' | 'Speaker 2', time: 'MM:SS', text: string }), 'summary', 'keywords' (list of strings), 'sentiment', 'scorecard' (list of objects: { criteria, score, reasoning }). Do not use markdown code blocks.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "audio/mp3",
                    data: base64Audio
                }
            }
        ]);

        console.log("\n--- Raw Response ---");
        const text = result.response.text();
        console.log(text.substring(0, 500) + "..."); // Log start of response

        try {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const json = JSON.parse(cleanText);
            console.log("\n--- Parsed JSON Success ---");
            console.log("Transcript Entries:", json.transcript.length);
            console.log("First Entry:", json.transcript[0]);
            console.log("Summary:", json.summary);
        } catch (e) {
            console.error("\nFailed to parse JSON:", e);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

verify();
