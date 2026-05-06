const https = require('https');
const http = require('http');
const { URL } = require('url');

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;

        const req = lib.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchHTML(res.headers.location));
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy(new Error('Request timeout'));
        });
    });
}

function cleanHTML(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function extractSignals(html) {
    const count = (regex) => (html.match(regex) || []).length;

    return {
        nav: count(/<nav|navbar|menu/g),
        header: count(/<header/g),
        footer: count(/<footer/g),
        section: count(/<section/g),
        buttons: count(/<button|btn/g),
        cards: count(/card|feature|grid|col-/g),
        forms: count(/<form|input/g),
        images: count(/<img/g),
        headings: count(/<h[1-3]/g)
    };
}

function detectStructure(signals) {
    return {
        navbar: signals.nav > 0 || signals.header > 0,
        hero: signals.header > 0 && signals.headings > 0,
        footer: signals.footer > 0,
        multiSection: signals.section > 2,
        cards: signals.cards > 2,
        forms: signals.forms > 0
    };
}

function detectLayout(signals) {
    if (signals.cards > 6) return "card-based grid";
    if (signals.forms > 2) return "form-heavy";
    if (signals.images > 12) return "media-heavy landing page";
    if (signals.section > 5) return "multi-section landing page";
    return "simple landing page";
}

function detectTheme(html) {
    const theme = {
        mode: "light",
        style: "minimal",
        colors: []
    };

    if (/background[^;]*#0|#111|#000|dark/i.test(html)) {
        theme.mode = "dark";
    }

    if (/gradient/i.test(html)) {
        theme.style = "gradient";
    } else if (/flex|grid|container/i.test(html)) {
        theme.style = "modern";
    }

    const colors = [...html.matchAll(/#([0-9a-f]{3,6})/gi)]
        .map(c => "#" + c[1])
        .slice(0, 6);

    theme.colors = colors;

    return theme;
}

function extractContent(html) {
    const strip = (str) => str.replace(/<[^>]+>/g, '').trim();

    const headings = [...html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)]
        .map(h => strip(h[1]))
        .filter(Boolean)
        .slice(0, 10);

    const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/gi)]
        .map(b => strip(b[1]))
        .filter(Boolean)
        .slice(0, 6);

    const links = [...html.matchAll(/<a[^>]*>(.*?)<\/a>/gi)]
        .map(a => strip(a[1]))
        .filter(Boolean)
        .slice(0, 10);

    return { headings, buttons, links };
}

function extractTitle(html) {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() : "Unknown";
}

function analyzeHTML(html) {
    const cleaned = cleanHTML(html);

    const signals = extractSignals(cleaned);
    const structure = detectStructure(signals);
    const layout = detectLayout(signals);
    const theme = detectTheme(cleaned);
    const content = extractContent(html);
    const title = extractTitle(html);

    return {
        title,
        structure,
        layout,
        theme,
        content
    };
}

async function analyzeWebsite(url) {
    const html = await fetchHTML(url);
    return analyzeHTML(html);
}

module.exports = {
    analyzeWebsite
};