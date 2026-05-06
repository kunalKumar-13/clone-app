const readline = require('readline');
const chalk = require('chalk');
const { callLLM } = require('./agent');
const tools = require('./tools');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const banner = `
\x1b[1m\x1b[35m
 ██▒   █▓ ▄▄▄       ███▄    █ ▄▄▄▄   ▓█████▄  ▄████  ▓█████ 
▓██░   █▒▒████▄     ██ ▀█   █▓█████▄ ▒██▀ ██▌██▒ ▀█▒▓█   ▀ 
 ▓██  █▒░▒██  ▀█▄  ▓██  ▀█ ██▒▒██  ▀█▄░██   █▌██░▄▄▄░▒███   
  ▒██ █░░░██▄▄▄▄██ ▓██▒  ▐▌██▒░███▄▄▄█▒██   █▌▓█  ██▓▒▓█  ▄ 
   ▒▀█░   ▓█   ▓██▒▒██░   ▓██░░▓█  ██▓░▓████▀ ▒█████▀░▒████▒
   ░ ▐░   ▒▒   ▓▒█░░ ▒░   ▒ ▒ ░▒▓███▀▒ ░▒▒▓  ▒  ░▒ ▒  ░░ ▒░ ░
   ░ ░░    ▒   ▒▒ ░░ ░░   ░ ▒░ ▒▒▒ ▒    ░ ▒  ▒  ░ ░ ░  ░ ░  ░
     ░░    ░   ▒      ░   ░ ░  ░ ▒ ▒    ░ ░  ░  ░ ░ ░    ░   
      ░        ░  ░         ░  ░ ░ ░      ░           ░  ░   
     ░                           ░      ░                  
\x1b[0m
`;

function askUser() {
    return new Promise((resolve) => {
        process.stdout.write(banner);
        console.log(chalk.cyan.bold("===================================================="));
        console.log(chalk.magenta.bold("          VANTAGE AI - HIGH-END DESIGN ENGINE"));
        console.log(chalk.cyan.bold("===================================================="));
        rl.question(chalk.green.bold("\n➤ Enter your architectural request: "), resolve);
    });
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

const toolMap = {
    writeFile: tools.WRITE_FILE,
    createFolder: tools.CREATE_FOLDER,
    openBrowser: tools.OPEN_BROWSER,
    appendFile: tools.APPEND_FILE,
    fetchWebsite: tools.FETCH_WEBSITE,
    startWebServer: tools.START_WEB_SERVER
};

async function runTool(action) {
    const { tool_name, tool_args } = action;

    if (!tool_name) return "Error: Missing tool_name";

    const tool = toolMap[tool_name];

    if (!tool) return `Error: Unknown tool ${tool_name}`;

    try {
        return await tool(...Object.values(tool_args || {}));
    } catch (err) {
        return `Error executing tool: ${err.message}`;
    }
}

async function getValidResponse(input, retries = 2) {
    while (retries-- >= 0) {
        const raw = await callLLM(input);

        const parsed = extractJSON(raw);

        if (parsed) return parsed;

        console.log(chalk.yellow("\n⚠️  Signal interference detected (Invalid JSON). Recalibrating..."));
    }

    return null;
}

async function startCLI() {
    const userInput = await askUser();

    let currentInput = JSON.stringify({
        step: "START",
        content: userInput
    });

    let steps = 0;
    const MAX_STEPS = 50;

    while (steps++ < MAX_STEPS) {
        process.stdout.write(chalk.blue("\n⟡ Vantage AI is synthesizing solutions... "));
        
        const response = await getValidResponse(currentInput);

        if (!response) {
            console.log(chalk.red("\n❌ Critical Error: Uplink lost after multiple retries."));
            break;
        }

        const { step, content, tool_name, tool_args } = response;

        const validSteps = ["START", "THINK", "TOOL", "OUTPUT", "PLAN", "STRATEGIC PLAN", "DEEP ANALYSIS", "FINAL DELIVERY"];

        if (!validSteps.includes(step)) {
            console.log(chalk.red(`\n❌ Error: Invalid architectural phase [${step}]`));
            break;
        }

        console.log(chalk.magenta(`\n\n[PHASE: ${step}]`));
        if (content) console.log(chalk.white(`➤ ${content}`));

        if (step === "OUTPUT" || step === "FINAL DELIVERY") {
            console.log(chalk.green.bold("\n✅ Synthesis complete. Project deployed successfully.\n"));
            break;
        }

        if (step === "TOOL") {
            console.log(chalk.yellow(`\n⚙️  Executing Module: ${tool_name}`));

            const result = await runTool({ tool_name, tool_args });

            console.log(chalk.cyan(`⟳ Execution Result: ${result}`));

            currentInput = JSON.stringify({
                step: "OBSERVE",
                tool_name,
                result
            });

            continue;
        }

        currentInput = JSON.stringify({
            step: "CONTINUE"
        });
    }

    if (steps >= MAX_STEPS) {
        console.log(chalk.red("\n❌ Security Lockout: Max iterations reached."));
    }

    rl.close();
}

startCLI();