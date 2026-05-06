const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { callLLM } = require('./src/agent');
const tools = require('./src/tools');

const app = express();
const PORT = 3000;

const path = require('path');
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'web')));
app.use('/output', express.static(path.join(__dirname, 'output')));

const toolMap = {
    writeFile: tools.WRITE_FILE,
    createFolder: tools.CREATE_FOLDER,
    openBrowser: tools.OPEN_BROWSER,
    appendFile: tools.APPEND_FILE,
    fetchWebsite: tools.FETCH_WEBSITE
};

async function runTool(action) {
    const { tool_name, tool_args } = action;
    const tool = toolMap[tool_name];
    if (!tool) throw new Error(`Unknown tool ${tool_name}`);
    return await tool(...Object.values(tool_args || {}));
}

function extractJSON(text) {
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch (e) {
        return null;
    }
}

app.post('/api/chat', async (req, res) => {
    const { message, isObserve } = req.body;
    
    try {
        let input = message;
        if (isObserve) {
            input = JSON.stringify(message);
        } else {
            input = JSON.stringify({
                step: "START",
                content: message
            });
        }

        console.log("Synthesizing phase...");
        const rawResponse = await callLLM(input);
        const parsed = extractJSON(rawResponse);

        if (!parsed) {
            console.error("AI returned invalid JSON:", rawResponse);
            return res.status(500).json({ error: "Architecture synthesis failed: Invalid response from engine." });
        }

        res.json(parsed);
    } catch (error) {
        console.error("Synthesis Error:", error);
        res.status(500).json({ error: "System Error: " + error.message });
    }
});

app.post('/api/tool', async (req, res) => {
    const { tool_name, tool_args } = req.body;
    try {
        const result = await runTool({ tool_name, tool_args });
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Vantage AI Server running at http://localhost:${PORT}`);
});
