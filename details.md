# SYNVERSE

## Technology Stack Recommendation
**Frontend**: React with React Router (modern, component-based, excellent ecosystem)
**State Management**: React Context API + useReducer for global state
**Storage**: IndexedDB (most robust for structured data, handles large amounts of conversations better than 
localStorage)
**Styling**: Material-UI (MUI) with dark/light theme support
**Build Tool**: Vite (fast, modern, excellent HMR)

## Key Implementation Details

### Model Management
- Auto-detect local Ollama instance
- List available models on startup
- Load/unload models as needed
- Token-based conversation summarization (4000 token limit)
- Conversation history sent as context to maintain memory

### Storage Strategy
- IndexedDB for robust local storage
- Auto-save every 5 minutes
- Save before new conversation or app exit
- Backup/restore functionality for all conversations
- Pagination for long conversations (100 messages per page)

### Conversation Flow
1. New conversation → select model → load model → start chat
2. Switching conversations → save current → load previous
3. Model switching → unload current model → load new model
4. Conversation summary → token-aware truncation

### UI Structure
- Main chat area with markdown support
- Collapsible sidebar with conversation history
- Settings page with global system prompt
- Search/filter in conversation list
- Typing indicators and message status
- Light/dark theme toggle

## Context Providers

### **OllamaContext** - Covers:
- Connection status management (unknown/connecting/connected/disconnected)
- Model fetching and listing
- Response generation with streaming support
- URL configuration with localStorage persistence
- Error handling for network issues

### **SettingsContext** - Covers:
- Global system prompt configuration
- Default model selection
- Auto-save toggle
- Local storage persistence for all settings
- Easy access to user preferences throughout the app

### **ConversationContext** - Covers:
- Full conversation lifecycle management (create/load/save/delete)
- IndexedDB persistence for offline data storage
- Auto-save functionality
- Conversation metadata (title, tags, timestamps)
- Message management with proper data structure
- Import/export capabilities
- Active conversation tracking
- Proper error handling and data validation

### **Additional Features Implemented:**
- **Data Persistence**: Both localStorage and IndexedDB for different data types
- **Auto-save**: Automatic saving every 5 minutes with beforeunload protection
- **Error Handling**: Comprehensive error catching and user feedback
- **Streaming Support**: Proper handling of Ollama's streaming responses
- **Responsive Design**: Context hooks for easy component access
- **Type Safety**: Proper data structures and validation

### **Missing Features (but planned):**
- **Chat History**: Already partially covered with conversation persistence
- **Model Management**: Basic model selection, but could expand to model switching
- **User Preferences**: Settings context handles this well
- **Export/Import**: Full export/import functionality implemented
- **Offline Support**: IndexedDB provides offline capabilities
