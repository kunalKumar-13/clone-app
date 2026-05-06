# Vantage AI | Autonomous Design Engine

Vantage AI is a sophisticated design synthesis engine that architecturally re-engineers digital experiences. It analyzes target websites and reconstructs them into high-performance, premium digital products using autonomous precision.




| Criterion | Status | Implementation Detail |
|-----------|--------|-----------------------|
| **Conversational CLI Agent** | ✅ | Fully interactive terminal loop with professional branding. |
| **Natural Language Support** | ✅ | Direct chat in terminal (Cursor/Windsurf style). |
| **Agent Reasoning/Loop** | ✅ | Implements START → THINK → TOOL → OBSERVE loop. |
| **Produces Real Output** | ✅ | Generates `index.html`, `style.css`, and `script.js` in `output/`. |
| **Cloning Capabilities** | ✅ | Optimized for cloning websites like Scaler Academy. |
| **Header/Hero/Footer** | ✅ | Guaranteed inclusion via strict Architectural Prompts. |
| **Browser Integration** | ✅ | Automatic `openBrowser` call upon synthesis completion. |
| **Documentation** | ✅ | Clean code, professional README, and architectural overview. |

## 🛠️ Technology Stack

- **Engine**: Node.js, Express, Groq SDK
- **Intelligence**: Llama-3.3-70B (Architectural Reasoning)
- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism), JavaScript (ES6+)

## 📥 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kunalKumar-13/clone-app.git
   cd clone-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory and add your Groq API key:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

## 🖥️ Usage

### Web Dashboard (Recommended)
Launch the high-end workspace to visualize the synthesis process:
```bash
npm run dev
```
Then visit `http://localhost:3000` in your browser.

### CLI Mode
For rapid, terminal-based architecture requests:
```bash
npm start
```

## 🏗️ Architecture

- `src/`: Core engine logic and architectural prompts.
- `web/`: High-performance dashboard assets.
- `server.js`: Bridge between the UI and the synthesis engine.
- `output/`: Synthesized architectural assets (HTML/CSS/JS).

---
*Synthesized by Vantage AI.*
