import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  role: 'user' | 'agent';
  content: string;
};

interface ChatState {
  messages: ChatMessage[];
  status: 'idle' | 'sending' | 'streaming';
  addMessage: (msg: ChatMessage) => void;
  appendStreamChunk: (chunk: string) => void;
  setStatus: (status: 'idle' | 'sending' | 'streaming') => void;
  clearMessages: () => void;
  resetSession: () => void;
  sessionId: string;
}

export const useChatStore = create<ChatState>()((set) => ({
  sessionId: `codeatlas-session-${crypto.randomUUID()}`,
  messages: [
    {
      id: 'welcome-msg',
      role: 'agent',
      content: "Hello! I'm CodeAtlas. Ask me anything about the repository's structure, architecture, or codebase."
    }
  ],
  status: 'idle',
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  appendStreamChunk: (chunk) => set((state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage && lastMessage.role === 'agent') {
      const updatedMessages = [...state.messages];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + chunk
      };
      return { messages: updatedMessages };
    } else {
      // Create a new agent message if last was user
      return {
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: 'agent', content: chunk }
        ]
      };
    }
  }),
  setStatus: (status) => set({ status }),
  clearMessages: () => set({ 
    messages: [
      {
        id: 'welcome-msg',
        role: 'agent',
        content: "Hello! I'm CodeAtlas. Ask me anything about the repository's structure, architecture, or codebase."
      }
    ]
  }),
  resetSession: () => set({ sessionId: `codeatlas-session-${crypto.randomUUID()}` }),
}));
