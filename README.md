# SYNVERSE

A modern, feature-rich chat application that integrates with Ollama for local AI model 
inference. This application allows you to have conversations with various AI models directly on 
your machine without requiring an internet connection.

## 🌟 Features

- **Local AI Integration**: Connect to Ollama for running AI models locally
- **Multi-Model Support**: Switch between different AI models seamlessly
- **Persistent Conversations**: All conversations saved locally using IndexedDB
- **Streaming Responses**: Real-time streaming of AI responses
- **Conversation Management**: Create, save, load, and delete conversations
- **Export/Import**: Export conversations to JSON and import from files
- **Customizable Settings**: Configure system prompts and default models
- **Offline Capabilities**: Works completely offline once loaded
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

1. **Ollama Installed**: You must have Ollama installed and running on your machine
   - Download from: https://ollama.com/download
   - Start Ollama service: `ollama serve`

2. **Ollama Models**: Pull required models (e.g., `llama3`, `mistral`, `phi3`)
   ```bash
   ollama pull llama3
   ollama pull mistral
   ```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ollama-chat-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

### Configuration

The application will automatically detect Ollama at `http://localhost:11434`. If you're running 
Ollama on a different port or host:

1. Go to Settings in the application
2. Update the Ollama URL to match your setup
3. The application will automatically reconnect

## 📖 Usage Guide

### Creating New Conversations
1. Click the "+" button to create a new conversation
2. Select your preferred AI model from the dropdown
3. Start typing your prompt in the input field
4. Press Enter or click Send to generate a response

### Managing Conversations
- **Save**: Conversations are automatically saved
- **Load**: Previous conversations appear in the sidebar
- **Delete**: Remove conversations using the delete button
- **Rename**: Click on conversation titles to rename them

### Settings
- **Global System Prompt**: Set a custom system prompt for all conversations
- **Default Model**: Choose your preferred model to use by default
- **Auto-save**: Toggle automatic saving of conversations

### Export/Import
- **Export**: Save conversations as JSON files for backup or sharing
- **Import**: Load conversations from JSON files

## 🛠️ Technical Architecture

### Context Providers

1. **OllamaContext**: Manages Ollama connection, model fetching, and response generation
2. **SettingsContext**: Handles user preferences and application settings
3. **ConversationContext**: Manages conversation lifecycle and data persistence

### Data Storage

- **localStorage**: Stores user settings and preferences
- **IndexedDB**: Persistent storage for conversation history
- **In-memory**: Current conversation state during active sessions

### Streaming Support

The application supports Ollama's streaming responses for real-time, progressive AI responses.

## 📊 System Requirements

- **Node.js**: v16 or higher
- **Ollama**: v0.1.0 or higher
- **Browser**: Modern browser with JavaScript ES6 support
- **Storage**: Minimum 1GB available disk space

## 🔧 Troubleshooting

### Common Issues

1. **Ollama Not Found**: Ensure Ollama is running with `ollama serve`
2. **Connection Refused**: Check Ollama URL in settings
3. **Model Not Found**: Pull required models with `ollama pull <model-name>`
4. **Performance Issues**: Large conversations may slow down the interface

### Development

To run in development mode:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.com) for providing local AI inference
- React community for the excellent development ecosystem
- All contributors who helped improve this application
