'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AISuggestionItem } from '@/lib/types/ai-assistant';
import TripAIAssistantDrawer from './TripAIAssistantDrawer';

export interface FloatingAIAssistantProps {
  tripId: string;
  tripTitle?: string;
  destination?: string;
  onAddToItinerary?: (suggestion: AISuggestionItem) => void;
  onAddToExpense?: (suggestion: AISuggestionItem) => void;
}

export default function FloatingAIAssistant({
  tripId,
  tripTitle,
  destination,
  onAddToItinerary,
  onAddToExpense,
}: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#184E77] to-[#1E6091] px-4 py-3 text-white shadow-xl ring-2 ring-[#D9ED92]/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:ring-[#D9ED92] active:scale-95"
            aria-label="Mở Trợ lý du lịch AI"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D9ED92] text-[#184E77] shadow-inner transition group-hover:rotate-12">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold tracking-wide pr-1">Trợ lý AI</span>

            {/* Subtle glow effect */}
            <span className="absolute -inset-0.5 -z-10 rounded-full bg-[#D9ED92] opacity-30 blur-sm group-hover:opacity-60 transition duration-300"></span>
          </button>
        </div>
      )}

      {/* Slide-over Drawer */}
      <TripAIAssistantDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tripId={tripId}
        tripTitle={tripTitle}
        destination={destination}
        onAddToItinerary={onAddToItinerary}
        onAddToExpense={onAddToExpense}
      />
    </>
  );
}
