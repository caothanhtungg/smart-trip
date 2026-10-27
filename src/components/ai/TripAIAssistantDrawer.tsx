'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { AIAssistantMessage, AISuggestionItem } from '@/lib/types/ai-assistant';
import AISuggestionCard from './AISuggestionCard';

export interface TripAIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle?: string;
  destination?: string;
  onAddToItinerary?: (suggestion: AISuggestionItem) => void;
  onAddToExpense?: (suggestion: AISuggestionItem) => void;
}

const QUICK_PROMPTS = [
  '🏡 Gợi ý homestay view đẹp',
  '🚌 Tìm nhà xe & vé xe',
  '🍜 Quán ăn & đặc sản ngon',
  '💰 Dự toán chi phí chuyến đi',
];

export default function TripAIAssistantDrawer({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  destination,
  onAddToItinerary,
  onAddToExpense,
}: TripAIAssistantDrawerProps) {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Xin chào! Tôi là Trợ lý du lịch Smart Trip. Tôi có thể giúp bạn tìm homestay, tra cứu nhà xe, gợi ý quán ngon hoặc dự toán chi phí cho chuyến đi ${
        destination ? `tại **${destination}**` : ''
      }. Bạn đang quan tâm điều gì?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: AIAssistantMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error('Không thể kết nối với trợ lý AI.');
      }

      const resData = await res.json();
      const assistantMsg: AIAssistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: resData.data.answer,
        suggestions: resData.data.suggestions,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: 'Rất tiếc, đã có sự cố xảy ra khi kết nối trợ lý AI. Bạn hãy thử lại câu hỏi nhé!',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-white shadow-2xl transition-all duration-300 border-l border-[#DDEBD0]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DDEBD0] bg-[#184E77] px-4 py-3.5 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9ED92] text-[#184E77]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide">Trợ lý du lịch Smart Trip</h3>
            <p className="text-[11px] text-[#D9ED92] truncate max-w-[240px]">
              {destination ? `Điểm đến: ${destination}` : tripTitle || 'Đang sẵn sàng'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Đóng bảng trợ lý"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-[#DDEBD0] bg-[#F4F9EC] p-2.5 scrollbar-none">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSendMessage(prompt)}
            className="shrink-0 rounded-full border border-[#B5E48C] bg-white px-2.5 py-1 text-xs font-medium text-[#184E77] transition hover:bg-[#D9ED92] disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#184E77] text-white">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-2.5`}>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#184E77] text-white rounded-tr-none'
                    : 'bg-[#F4F9EC] text-neutral-800 border border-[#DDEBD0] rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>

              {/* Render suggestions if any */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  {msg.suggestions.map((suggestion) => (
                    <AISuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onAddToItinerary={onAddToItinerary}
                      onAddToExpense={onAddToExpense}
                    />
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#52B69A] text-white">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 italic">
            <Loader2 className="h-4 w-4 animate-spin text-[#184E77]" />
            Smart Trip AI đang suy nghĩ câu trả lời...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="border-t border-[#DDEBD0] bg-white p-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Hỏi về homestay, nhà xe, ăn uống..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-[#DDEBD0] bg-[#F4F9EC] px-3.5 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:border-[#52B69A] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#184E77] text-white transition hover:bg-[#1E6091] disabled:opacity-40"
            aria-label="Gửi tin nhắn"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
