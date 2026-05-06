const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loader = document.getElementById('loader');
const previewFrame = document.getElementById('preview-frame');
const codeDisplay = document.getElementById('code-display');
const tabs = document.querySelectorAll('.tab');
const tabPanes = document.querySelectorAll('.tab-pane');
const openBrowserBtn = document.getElementById('open-browser-btn');

let isProcessing = false;
let currentProjectFolder = '';
let currentFilePath = 'index.html';

openBrowserBtn.addEventListener('click', async () => {
    await fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_name: 'openBrowser', tool_args: { filePath: currentFilePath } })
    });
});

// Tab Switching Logic
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${target}-tab`).classList.add('active');
    });
});

function addMessage(text, role) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = `<div class="message-content">${text}</div>`;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function updatePipeline(step) {
    const steps = {
        'START': 'step-start',
        'PLAN': 'step-plan',
        'STRATEGIC PLAN': 'step-plan',
        'TOOL': 'step-build',
        'FETCH': 'step-fetch',
        'DEEP ANALYSIS': 'step-analyze',
        'OUTPUT': 'step-deploy',
        'FINAL DELIVERY': 'step-deploy'
    };

    const targetId = steps[step];
    if (targetId) {
        document.querySelectorAll('.pipeline-step').forEach(s => s.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    }
}

async function handleSynthesis() {
    const message = userInput.value.trim();
    if (!message || isProcessing) return;

    isProcessing = true;
    userInput.value = '';
    addMessage(message, 'user');
    loader.classList.remove('hidden');

    try {
        let currentResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        }).then(res => res.json());

        while (currentResponse && currentResponse.step !== 'OUTPUT' && currentResponse.step !== 'FINAL DELIVERY') {
            updatePipeline(currentResponse.step);
            addMessage(currentResponse.content, 'ai');

            if (currentResponse.step === 'TOOL') {
                const { tool_name, tool_args } = currentResponse;
                
                const toolResult = await fetch('/api/tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tool_name, tool_args })
                }).then(res => res.json());

                // If a file was written, update the preview
                if (tool_name === 'writeFile' || tool_name === 'appendFile') {
                    const filePath = tool_args.filePath || tool_args.filename;
                    currentFilePath = filePath; 
                    if (filePath.endsWith('index.html')) {
                        previewFrame.src = `/output/${filePath}?t=${Date.now()}`;
                    }
                    codeDisplay.textContent += `\n/* File: ${filePath} */\n${tool_args.content || ''}\n`;
                }

                currentResponse = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: {
                            step: "OBSERVE",
                            tool_name: currentResponse.tool_name,
                            result: toolResult.result
                        },
                        isObserve: true
                    })
                }).then(res => res.json());
            } else {
                currentResponse = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: { step: "CONTINUE" },
                        isObserve: true
                    })
                }).then(res => res.json());
            }
        }

        if (currentResponse) {
            updatePipeline(currentResponse.step);
            addMessage(currentResponse.content, 'ai');
        }
    } catch (error) {
        addMessage(`Synthesis Interrupted: ${error.message}`, 'ai');
    } finally {
        isProcessing = false;
        loader.classList.add('hidden');
    }
}

sendBtn.addEventListener('click', handleSynthesis);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSynthesis();
});
