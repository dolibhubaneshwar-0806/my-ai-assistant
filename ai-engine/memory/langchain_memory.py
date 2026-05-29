"""LangChain Memory store configuration for AI LifeOS"""

from typing import Dict, List, Any
import os

try:
    from langchain.memory import ConversationBufferWindowMemory
    from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False


class UserMemory:
    def __init__(self, k: int = 10):
        self.k = k
        self.memories: Dict[str, Any] = {}

    def get_memory(self, user_id: str):
        """Get or create conversation window memory for a user."""
        if not LANGCHAIN_AVAILABLE:
            if user_id not in self.memories:
                self.memories[user_id] = []
            return self.memories[user_id]
            
        if user_id not in self.memories:
            self.memories[user_id] = ConversationBufferWindowMemory(
                k=self.k,
                return_messages=True,
                memory_key="chat_history",
                input_key="input"
            )
        return self.memories[user_id]

    def save_context(self, user_id: str, user_input: str, ai_output: str):
        """Append user input and AI output to memory."""
        if not LANGCHAIN_AVAILABLE:
            memory = self.get_memory(user_id)
            memory.append({"role": "user", "content": user_input})
            memory.append({"role": "model", "content": ai_output})
            # enforce window capacity
            if len(memory) > self.k * 2:
                self.memories[user_id] = memory[-(self.k * 2):]
            return

        memory = self.get_memory(user_id)
        memory.save_context({"input": user_input}, {"output": ai_output})

    def get_history(self, user_id: str) -> List[Dict[str, str]]:
        """Retrieve structured chat history for prompt consumption."""
        if not LANGCHAIN_AVAILABLE:
            return self.get_memory(user_id)

        memory = self.get_memory(user_id)
        chat_vars = memory.load_memory_variables({})
        messages = chat_vars.get("chat_history", [])
        
        history = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                history.append({"role": "model", "content": msg.content})
        return history

    def clear_memory(self, user_id: str):
        """Reset conversation memory for a user."""
        if not LANGCHAIN_AVAILABLE:
            self.memories[user_id] = []
            return
            
        if user_id in self.memories:
            self.memories[user_id].clear()


# Singleton Instance
user_memory = UserMemory(k=10)
