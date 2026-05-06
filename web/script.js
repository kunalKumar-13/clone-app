const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const previewFrame = document.getElementById('preview-frame');
const codeView = document.getElementById('code-view');
const openBrowserBtn = document.getElementById('open-browser-btn');
const loader = document.getElementById('loader');
const tabBtns = document.querySelectorAll('.preview-tab-btn');

let isProcessing = false;
let currentFilePath = 'index.html';

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (!view) return; // Ignore "Open in Browser" button

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (view === 'preview') {
            previewFrame.style.display = 'block';
            codeView.classList.remove('active');
        } else {
            previewFrame.style.display = 'none';
            codeView.classList.add('active');
        }
    });
});

openBrowserBtn.addEventListener('click', async () => {
    await fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_name: 'openBrowser', tool_args: { filePath: currentFilePath } })
    });
});

function addMessage(content, role) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = content;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function updatePipeline(step) {
    const nodes = document.querySelectorAll('.step-node');
    const statusText = document.getElementById('pipeline-status-text');
    
    let activeDataStep = '';
    if (['START', 'PLAN', 'STRATEGIC PLAN'].includes(step)) activeDataStep = 'PLAN';
    else if (step === 'fetchWebsite') activeDataStep = 'FETCH';
    else if (['THINK', 'DEEP ANALYSIS'].includes(step)) activeDataStep = 'ANALYZE';
    else if (step === 'TOOL') activeDataStep = 'BUILD';
    else if (['OUTPUT', 'FINAL DELIVERY'].includes(step)) activeDataStep = 'DEPLOY';

    if (activeDataStep) {
        statusText.textContent = `Current Phase: ${activeDataStep}`;
        let foundActive = false;
        nodes.forEach(n => {
            const nodeStep = n.dataset.step;
            if (nodeStep === activeDataStep) {
                n.classList.add('active');
                n.classList.remove('completed');
                foundActive = true;
            } else if (!foundActive) {
                n.classList.add('completed');
                n.classList.remove('active');
            } else {
                n.classList.remove('active', 'completed');
            }
        });
    }
}

async function handleSynthesis() {
    const message = userInput.value.trim();
    if (!message || isProcessing) return;

    isProcessing = true;
    sendBtn.disabled = true;
    userInput.value = '';
    addMessage(message, 'user');
    loader.classList.add('active');
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

                if (tool_name === 'writeFile' || tool_name === 'appendFile') {
                    const filePath = tool_args.filePath || tool_args.filename;
                    currentFilePath = filePath;
                    if (filePath.endsWith('index.html')) {
                        previewFrame.src = `/output/${filePath}?t=${Date.now()}`;
                    }
                    codeView.textContent += `\n/* SYNTHESIZED: ${filePath} */\n${tool_args.content || ''}\n`;
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
        sendBtn.disabled = false;
        loader.classList.remove('active');
    }
}

sendBtn.addEventListener('click', handleSynthesis);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSynthesis();
});
