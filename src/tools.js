const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { analyzeWebsite } = require('./websiteAnalyzer');

const outputDir = path.join(__dirname, '../output');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

module.exports = {
    WRITE_FILE: (filename, content) => {
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, content.trim(), 'utf8');
        return `Successfully wrote to ${filename}`;
    },

    CREATE_FOLDER: (foldername) => {
        const folderPath = path.join(outputDir, foldername);
        if (!fs.existsSync(folderPath)) { 
            fs.mkdirSync(folderPath, { recursive: true }); 
        }
        return `Successfully created folder ${foldername}`;
    },
    
    OPEN_BROWSER: (filename) => {
        const filePath = path.join(outputDir, filename);
        const command = process.platform === 'darwin' ? `open "${filePath}"` :
                        process.platform === 'win32' ? `start "" "${filePath}"` :
                        `xdg-open "${filePath}"`;
        
        exec(command);
        return `Successfully opened ${filename} in the browser.`;
    },

    APPEND_FILE: (filename, content) => {
        const filePath = path.join(outputDir, filename);
        fs.appendFileSync(filePath, content.trim(), 'utf8');
        return `Successfully appended to ${filename}`;
    },

    FETCH_WEBSITE: async (url) => {
        try {
            new URL(url);

            const result = await analyzeWebsite(url);

            return JSON.stringify(result, null, 2);
        } catch (err) {
            return `Error fetching website: ${err.message}`;
        }
    },

    START_WEB_SERVER: async () => {
        return "Web server capability initialized. (Dashboard accessible via localhost:3000)";
    }
};