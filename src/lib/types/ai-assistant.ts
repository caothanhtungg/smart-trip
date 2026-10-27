/**
 * Domain types for AI Travel Assistant.
 * Used for Gemini generation, local knowledge engine, and frontend cards.
 */

export type AISuggestionCategory = 'homestay' | 'transport' | 'food' | 'attraction' | 'other';

export interface AISuggestionItem {
  id: string;
  name: string;
  category: AISuggestionCategory;
  description: string;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactInfo?: string;
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: AISuggestionItem[];
  timestamp: string;
}

export interface AITripContext {
  id?: string;
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
}

export interface AIAssistantRequest {
  message: string;
  tripContext?: AITripContext;
}

export interface AIAssistantResponse {
  answer: string;
  suggestions: AISuggestionItem[];
}
