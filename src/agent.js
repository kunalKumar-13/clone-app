const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const systemPrompt = require('./prompts/system');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt 
});

let chat = model.startChat({
    history: [],
    generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
    },
});

async function callLLM(userInput) {
    try {
        console.log("Synthesizing with Gemini...");
        const result = await chat.sendMessage(userInput);
        const responseText = result.response.text();
        
        console.log("Gemini Response received:", responseText.substring(0, 100) + "...");
        return responseText;
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        // Reset chat if there's a serious error
        if (error.message.includes("429") || error.message.includes("safety")) {
            chat = model.startChat({ history: [] });
        }
        return JSON.stringify({
            step: "THINK",
            content: "I encountered a communication error with the Gemini Uplink. Re-establishing connection..."
        });
    }
}

async function provideToolResult(resultMessage) {
    try {
        const input = `System Tool Execution Result: ${resultMessage}\nProceed to the next step based on the strategic plan.`;
        await chat.sendMessage(input);
    } catch (error) {
        console.error("Error providing tool result to Gemini:", error.message);
    }
}

module.exports = { callLLM, provideToolResult };