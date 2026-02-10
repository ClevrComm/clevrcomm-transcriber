import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

async function listModels() {
    console.log("Checking API Key validity by listing models...");
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Access the model manager (not directly exposed in all SDK versions, but let's try getGenerativeModel first to see if it even inits)
        // Actually, the SDK doesn't have a simple listModels method exposed on the top level easily in all versions.
        // Let's try a direct fetch to the API endpoint to be sure.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
        } else {
            console.log("Success! Available models:");
            if (data.models) {
                data.models.forEach(m => console.log(`- ${m.name}`));
            } else {
                console.log(data);
            }
        }

    } catch (error) {
        console.error("Network or parsing error:", error);
    }
}

listModels();
