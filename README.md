# SYNVERSE

A modern, feature-rich chat application that integrates with Ollama for local and cloud AI model
inference. Chat with AI models directly on your machine or leverage Ollama Cloud for access to 
larger, more powerful models.

## 🌟 Features

- **Local & Cloud AI Integration**: Connect to local Ollama or Ollama Cloud at `https://ollama.com`
- **Cloud Model Library**: Browse and select from 25+ cloud models (DeepSeek, GPT-OSS, GLM, Kimi, etc.)
- **Multi-Model Support**: Switch between different AI models seamlessly
- **Streaming Responses**: Real-time streaming of AI responses with visual indicators
- **Markdown Rendering**: Full markdown support in assistant responses (code blocks, tables, etc.)
- **Persistent Conversations**: All conversations saved locally using IndexedDB
- **Conversation Management**: Create, save, load, and delete conversations
- **Customizable Settings**: Configure system prompts, default models, and API keys
- **Dark/Light Theme**: Toggle between dark and light themes
- **Responsive Design**: Works on desktop and mobile devices
- **API Key Support**: Authenticate with Ollama Cloud using your API key
- **Proxy Support**: Optional dev server proxy to handle CORS issues

## 🚀 Getting Started

### Prerequisites

**Option A: Local Ollama (default)**
1. Install Ollama: https://ollama.com/download
2. Start Ollama service: `ollama serve`
3. Pull models: `ollama pull llama3`, `ollama pull mistral`, etc.

**Option B: Ollama Cloud**
1. Create an account at https://ollama.com
2. Sign in: `ollama signin`
3. Get your API key from the Ollama dashboard
4. Configure the app to use `https://ollama.com` as the Ollama URL

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```
4. Open your browser to `http://localhost:3000`

### Configuration

#### Local Ollama (Default)
The app automatically connects to `http://localhost:11434`. To change:
1. Go to Settings
2. Update the Ollama URL

#### Ollama Cloud
1. Go to Settings
2. Set the Ollama URL to `https://ollama.com`
3. Enter your API key
4. Cloud mode is automatically detected when the URL contains `ollama.com`
5. Browse and select cloud models from the "Available Cloud Models" section

## 📖 Usage Guide

### Chatting
1. Select a model from the dropdown in the header
2. Type your message and press Enter (Shift+Enter for new line)
3. Watch the response stream in real-time

### Cloud Models
When connected to Ollama Cloud, you can access powerful models:
- **DeepSeek V3.1/V3.2/V4** - Advanced reasoning models
- **GPT-OSS 20B/120B** - OpenAI's open-weight models
- **GLM-5/5.1** - Z.ai's reasoning and agentic models
- **Kimi K2/K2.5/K2.6** - Moonshot AI's multimodal models
- **MiniMax M2/M2.5/M2.7** - Coding and agentic workflow models
- **Qwen3-Coder/Coder-Next/3.5** - Alibaba's coding models
- **Gemma3/4** - Google's frontier models
- **Mistral Large 3** - Production-grade multimodal model
- **Nemotron 3 Super/Nano** - NVIDIA's efficient agentic models
- **Devstral** - Mistral's code exploration models
- And more!

### Managing Conversations
- **New Chat**: Click "New Chat" in the sidebar
- **Switch**: Click a conversation in the sidebar
- **Delete**: Click the delete icon (with confirmation)
- **Auto-save**: Conversations are saved automatically

### Settings
- **Ollama URL**: Configure local or cloud connection
- **API Key**: Authenticate with Ollama Cloud
- **System Prompt**: Global system prompt for all conversations
- **Default Model**: Your preferred model
- **Theme**: Toggle dark/light mode from the header
- **Proxy**: Enable dev server proxy for CORS handling

## 🛠️ Technical Architecture

### Context Providers
1. **OllamaContext**: Connection management, model fetching, response generation with streaming
2. **SettingsContext**: User preferences and application settings
3. **ConversationContext**: Conversation lifecycle and IndexedDB persistence

### API Endpoints
- `GET /api/tags` - List available models
- `POST /api/chat` - Chat with a model (with streaming support)
- Uses NDJSON streaming format for real-time responses

### Data Storage
- **localStorage**: Settings, API key, theme preference
- **IndexedDB**: Conversation history with full message data

### Cloud Authentication
- API key sent as `Authorization: Bearer <key>` header
- Automatically included in all requests when configured
- Cloud mode auto-detected from URL pattern

## 📊 System Requirements

- **Node.js**: v16 or higher
- **Ollama**: v0.12+ (for cloud model support)
- **Browser**: Modern browser with JavaScript ES6 support
- **Storage**: Minimum 100MB available disk space

## 🔧 Troubleshooting

### Common Issues

1. **CORS errors with Ollama Cloud**: Enable "Use dev server proxy" in Settings, or set up a reverse proxy
2. **Ollama Not Found**: Ensure Ollama is running with `ollama serve`
3. **Cloud Authentication Failed**: Verify your API key at ollama.com
4. **Model Not Found**: For local, pull with `ollama pull <name>`. For cloud, check the model name format (e.g., `model:size-cloud`)
5. **Streaming Not Working**: Check browser console for errors

### Development

```bash
npm run dev    # Development server
npm run build  # Production build
```

## 📄 License

This project is licensed under the MIT License.