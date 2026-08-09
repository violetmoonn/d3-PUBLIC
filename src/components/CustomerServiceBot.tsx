import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, MessageSquare, Info } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const CustomerServiceBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLegalNoticePopup, setShowLegalNoticePopup] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Hello! Welcome to D3COMPOSURE Customer Service. How can I help?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const historyForApi = messages.map(m => ({ sender: m.sender, text: m.text }));
      const response = await fetch('/api/customer-service/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: historyForApi })
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.text || 'Thank you for reaching out. How else can I assist you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Failed to get customer service response:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Our customer support service is currently online. You can ask any question about shipping, sizing, or orders!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9000] flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mb-3 w-[calc(100vw-3rem)] sm:w-96 max-h-[520px] h-[500px] bg-white rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden backdrop-blur-xl"
            id="customer-service-bot-panel"
          >
            {/* Header */}
            <div className="bg-white text-ink px-5 py-4 flex items-center justify-between border-b border-black/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div>
                  <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-ink">
                    D3COMPOSURE SUPPORT
                  </h3>
                  <p className="text-[10px] font-mono text-ink/60 uppercase tracking-wider">
                    24/7 Support
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowLegalNoticePopup(prev => !prev)}
                  className="text-ink/60 hover:text-ink p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                  title="Toggle Legal Notice"
                  aria-label="Toggle Legal Notice"
                  id="toggle-legal-notice-btn"
                >
                  <Info size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-ink/70 hover:text-ink p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Close customer service chat"
                  id="close-bot-btn"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Legal Notice Pop-up Notification */}
            <AnimatePresence>
              {showLegalNoticePopup && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="mx-3 mt-3 p-3 bg-neutral-100 text-neutral-800 rounded-xl shadow-sm border border-neutral-200 flex items-start justify-between gap-2.5 shrink-0 z-20 relative"
                  id="legal-notice-popup"
                >
                  <div className="flex items-start gap-2 text-[10px] font-mono leading-relaxed">
                    <Info size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-neutral-900 uppercase tracking-wider block mb-0.5">
                        Legal Notice
                      </span>
                      <p className="text-neutral-700">
                        This chat is recorded to improve our service here at D3COMPOSURE and for our customers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLegalNoticePopup(false)}
                    className="text-neutral-400 hover:text-neutral-800 p-1 rounded-md hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
                    aria-label="Close Legal Notice"
                    id="dismiss-legal-notice-btn"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50 text-xs font-sans">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-black text-white rounded-br-none shadow-md'
                        : 'bg-white text-neutral-900 border border-black/10 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-neutral-500 bg-white border border-black/10 px-3 py-2 rounded-2xl rounded-bl-none w-max">
                  <Loader2 size={14} className="animate-spin text-black" />
                  <span className="text-[10px] font-mono uppercase tracking-wider animate-pulse">
                    Support typing...
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className="bg-white border-t border-black/10 p-3 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about shipping, sizing, orders..."
                  className="flex-1 bg-neutral-100 border border-neutral-200 focus:border-black rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:bg-white text-neutral-900 placeholder:text-neutral-400 font-sans transition-all"
                  disabled={isLoading}
                  id="bot-input-field"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider underline text-neutral-900 disabled:opacity-40 hover:text-neutral-600 transition-all cursor-pointer shrink-0"
                  aria-label="Send Message"
                  id="send-bot-msg-btn"
                >
                  Send
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom-Right Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ opacity: 0.7 }}
          onClick={() => setIsOpen(true)}
          className="text-[10px] font-mono tracking-wider text-ink/80 hover:text-ink hover:underline cursor-pointer bg-paper/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-ink/10 shadow-sm transition-all"
          aria-label="Open Customer Service"
          id="customer-service-bot-trigger"
        >
          chat with a live assistant
        </motion.button>
      )}
    </div>
  );
};
