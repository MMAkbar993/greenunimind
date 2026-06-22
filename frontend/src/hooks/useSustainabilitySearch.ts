import { useState, useCallback, useRef } from 'react';
import { geminiService } from '@/services/gemini.service';
import { useSearchCoursesQuery } from '@/redux/features/course/courseApi';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  courses?: any[];
  topics?: string[];
}

export interface UseSustainabilitySearchReturn {
  query: string;
  setQuery: (q: string) => void;
  aiAnswer: string;
  relatedCourses: any[];
  topics: string[];
  isLoading: boolean;
  error: string | null;
  conversation: ConversationMessage[];
  search: (q?: string) => Promise<void>;
  clearConversation: () => void;
}

export const useSustainabilitySearch = (): UseSustainabilitySearchReturn => {
  const [query, setQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const conversationRef = useRef<ConversationMessage[]>([]);

  const { data: courseResults } = useSearchCoursesQuery(courseSearchTerm, {
    skip: !courseSearchTerm,
  });

  const relatedCourses = courseResults?.data ?? [];

  const search = useCallback(async (q?: string) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery) return;

    setIsLoading(true);
    setError(null);

    const userMsg: ConversationMessage = { role: 'user', text: searchQuery };
    const updatedHistory = [...conversationRef.current, userMsg];

    try {
      const history = conversationRef.current.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const result = await geminiService.searchSustainability(searchQuery, history);

      setAiAnswer(result.answer);
      setTopics(result.topics);

      if (result.suggestedSearchTerms?.length) {
        setCourseSearchTerm(result.suggestedSearchTerms.join(' '));
      }

      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        text: result.answer,
        topics: result.topics,
        courses: [],
      };

      const newConversation = [...updatedHistory, assistantMsg].slice(-10);
      conversationRef.current = newConversation;
      setConversation(newConversation);
      setQuery('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const clearConversation = useCallback(() => {
    conversationRef.current = [];
    setConversation([]);
    setAiAnswer('');
    setTopics([]);
    setCourseSearchTerm('');
    setError(null);
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    aiAnswer,
    relatedCourses,
    topics,
    isLoading,
    error,
    conversation,
    search,
    clearConversation,
  };
};
