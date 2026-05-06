const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const previewFrame = document.getElementById('preview-frame');
const codeDisplay = document.getElementById('code-display');
const tabs = document.querySelectorAll('.tab');
const tabPanes = document.querySelectorAll('.tab-pane');
const openBrowserBtn = document.getElementById('open-browser-btn');
const loader = document.getElementById('loader');

let isProcessing = false;
let currentFilePath = 'index.html';

openBrowserBtn.addEventListener('click', async () => {
    await fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_name: 'openBrowser', tool_args: { filePath: currentFilePath } })
    });
});

// Tab Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
});

function addMessage(content, role) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerHTML = `<div class="message-content">${content}</div>`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function updatePipeline(step) {
    const steps = document.querySelectorAll('.pipeline-step');
    const statusText = document.getElementById('pipeline-status-text');
    
    let activeStep = '';
    if (['START', 'PLAN', 'STRATEGIC PLAN'].includes(step)) activeStep = 'PLAN';
    else if (step === 'fetchWebsite') activeStep = 'FETCH';
    else if (['THINK', 'DEEP ANALYSIS'].includes(step)) activeStep = 'ANALYZE';
    else if (step === 'TOOL') activeStep = 'BUILD';
    else if (['OUTPUT', 'FINAL DELIVERY'].includes(step)) activeStep = 'DEPLOY';

    if (activeStep) {
        statusText.textContent = `Current Phase: ${activeStep}`;
        let foundActive = false;
        steps.forEach(s => {
            const sStep = s.dataset.step;
            if (sStep === activeStep) {
                s.classList.add('active');
                s.classList.remove('completed');
                foundActive = true;
            } else if (!foundActive) {
                s.classList.add('completed');
                s.classList.remove('active');
            } else {
                s.classList.remove('active', 'completed');
            }
        });
    }
}

async function handleSynthesis() {
    const message = userInput.value.trim();
    if (!message || isProcessing) return;

    isProcessing = true;
    userInput.value = '';
    addMessage(message, 'user');
    loader.classList.remove('hidden');
    updatePipeline('PLAN');

    try {
        let currentResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        }).then(res => res.json());

        while (currentResponse && currentResponse.step !== 'OUTPUT' && currentResponse.step !== 'FINAL DELIVERY') {
            updatePipeline(currentResponse.step || (currentResponse.tool_name ? 'TOOL' : 'THINK'));
            if (currentResponse.content) {
                addMessage(currentResponse.content, 'ai');
            }

            if (currentResponse.step === 'TOOL') {
                const { tool_name, tool_args } = currentResponse;
                
                const toolResult = await fetch('/api/tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tool_name, tool_args })
                }).then(res => res.json());

                // Real-time Preview Update
                if (tool_name === 'writeFile' || tool_name === 'appendFile') {
                    const filePath = tool_args.filePath || tool_args.filename;
                    currentFilePath = filePath;
                    if (filePath.endsWith('index.html')) {
                        previewFrame.src = `/output/${filePath}?t=${Date.now()}`;
                    }
                    codeDisplay.textContent += `\n/* SYNTHESIZED: ${filePath} */\n${tool_args.content || ''}\n`;
                }

                currentResponse = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: {
                            step: "OBSERVE",
                            tool_name: tool_name,
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
            updatePipeline('FINAL DELIVERY');
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
