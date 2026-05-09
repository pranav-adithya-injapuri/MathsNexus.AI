
import React, { useState, useRef, useEffect } from 'react';
import { chatWithTutor } from '../services/geminiService';
import { Message } from '../types';

const MarkdownLite: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-xl font-black text-white mt-2 mb-2 tracking-tight">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-black text-white mt-4 mb-4 tracking-tighter">{line.replace('## ', '')}</h2>;
        }
        
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={i} className="flex gap-3 ml-1">
              <span className="text-blue-500 mt-1.5 flex-shrink-0 text-[10px]">●</span>
              <span className="text-base text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatBold(line.trim().substring(2)) }} />
            </div>
          );
        }
        
        if (/^\d+\./.test(line.trim())) {
          return (
            <div key={i} className="flex gap-3 ml-1">
              <span className="text-blue-500 font-black text-xs mt-1.5 flex-shrink-0">{line.trim().split('.')[0]}.</span>
              <span className="text-base text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatBold(line.trim().split('.').slice(1).join('.')) }} />
            </div>
          );
        }

        if (!line.trim()) return <div key={i} className="h-2" />;

        return <p key={i} className="text-base text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatBold(line) }} />;
      })}
    </div>
  );
};

const formatBold = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-400 font-bold">$1</strong>');
};

const MathTutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: '### 💡 Welcome to MathNexus AI\nI am your lead engineering tutor. I break down complex math into clean, actionable logic.\n\nWhat are we building today? 🚀', 
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      chatHistory.push({ role: 'user', parts: [{ text: textToSend }] });

      const responseText = await chatWithTutor(chatHistory);
      if (responseText) {
        setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "❌ **System Error**: Engineering fail. Please retry your request.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QuickAction = ({ label, prompt, icon }: { label: string, prompt: string, icon: string }) => (
    <button 
      onClick={() => handleSend(prompt)}
      className="bg-[#111] hover:bg-zinc-800 border border-zinc-800/60 px-5 py-2 rounded-xl text-[12px] font-semibold text-zinc-500 hover:text-white transition-all flex-shrink-0 flex items-center gap-2.5 shadow-lg backdrop-blur-sm"
    >
      <span className="text-sm grayscale opacity-70">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Background Watermark Text - Matches Screenshot */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 px-10">
        <h1 className="text-[14vw] font-black text-[#0a0a0a] leading-none tracking-tighter text-center uppercase">
          LEARN WITH<br/>INTELLIGENCE
        </h1>
        <p className="text-[1vw] font-bold text-[#0c0c0c] tracking-[2em] uppercase mt-12 text-center opacity-60">
          LOGIC
        </p>
      </div>

      {/* Messages Viewport - Redesigned to push to ends */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-[15%] pt-12 pb-56 space-y-12 scroll-smooth z-10 relative">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start animate-in fade-in slide-in-from-bottom-4 duration-500'}`}>
            
            {/* Badge Above Bubble */}
            <div className={`w-10 h-8 rounded-lg flex items-center justify-center text-[10px] font-black mb-2 shadow-xl ${
              msg.role === 'user' ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 text-white'
            }`}>
              {msg.role === 'user' ? 'ME' : 'AI'}
            </div>

            {/* Message Content Bubble - Engineering / WhatsApp style */}
            <div className={`max-w-[85%] rounded-[1.5rem] px-8 py-6 shadow-2xl relative transition-all duration-500 border ${
              msg.role === 'user' 
                ? `bg-zinc-900/60 backdrop-blur-md text-zinc-100 border-zinc-800/40 rounded-tr-none` 
                : `bg-[#0d0d0f]/95 backdrop-blur-xl text-zinc-200 border-zinc-800/30 rounded-tl-none`
            }`}>
              <div className="prose prose-invert prose-blue max-w-none">
                <MarkdownLite text={msg.text} />
              </div>
              
              {/* Timestamp at bottom */}
              <div className="text-[9px] mt-4 opacity-30 font-black tracking-widest text-left font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex flex-col items-start">
            <div className="w-10 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black mb-2 text-white">AI</div>
            <div className="bg-[#0f0f12]/50 backdrop-blur-md border border-zinc-800 rounded-2xl rounded-tl-none px-8 py-4 flex gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Sticky Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth justify-center">
            <QuickAction icon="🧬" label="Fibonacci Strategy" prompt="Break down the Fibonacci sequence logic for engineering applications." />
            <QuickAction icon="📐" label="Advanced Calculus" prompt="Give me a comprehensive cheat sheet for essential derivatives." />
            <QuickAction icon="🏁" label="Convergence Test" prompt="Compare the Integral Test vs Ratio Test using a clean table." />
            <QuickAction icon="📊" label="Visualizer Guide" prompt="How do I plot oscillating series effectively?" />
          </div>

          {/* Redesigned Input Bar */}
          <div className="bg-[#080808] rounded-[2rem] border border-zinc-800/60 p-1.5 shadow-2xl transition-all duration-300 focus-within:border-zinc-700">
            <div className="flex items-center gap-4 px-4 py-1">
               <div className="text-zinc-600 ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
               </div>
               
               <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Collaborate on a complex proof..."
                className="w-full bg-transparent border-none py-3 focus:outline-none text-white placeholder-zinc-800 font-medium text-base resize-none min-h-[44px] max-h-[200px]"
               />

               <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                  input.trim() ? 'bg-zinc-800 text-white hover:bg-zinc-700 shadow-xl' : 'bg-zinc-900/40 text-zinc-800'
                }`}
               >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
               </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center px-4">
             <div className="flex items-center gap-4">
               <span className="text-[10px] text-zinc-800 font-black uppercase tracking-[0.2em]">MathNexus Pro V2.9</span>
               <span className="w-1 h-1 rounded-full bg-zinc-900"></span>
               <span className="text-[10px] text-zinc-900 font-black uppercase tracking-[0.2em]">Gemini-3 Elite Logic</span>
             </div>
             <div className="flex items-center gap-2 opacity-20">
               <span className="text-[10px] text-zinc-800 font-black uppercase tracking-widest">Encrypted Reasoning Active</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathTutor;
