const Groq = require('groq-sdk');
require('dotenv').config();
const systemPrompt = require('./prompts/system');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let messageHistory = [
    { role: 'system', content: systemPrompt }
];

async function callLLM(userInput) {
    try {
        messageHistory.push({ role: 'user', content: userInput });

        const chatCompletion = await groq.chat.completions.create({
            messages: messageHistory,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "";
        console.log("AI Response received:", responseText.substring(0, 100) + "...");
        
        messageHistory.push({ role: 'assistant', content: responseText });

        return responseText;
    } catch (error) {
        console.error("LLM Error:", error.message);
        return "Sorry, I encountered an error communicating with the AI.";
    }
}

async function provideToolResult(resultMessage) {
    messageHistory.push({ 
        role: 'user', 
        content: `System Tool Execution Result: ${resultMessage}\nDo not execute the tool again immediately unless necessary.` 
    });
}

module.exports = { callLLM, provideToolResult };