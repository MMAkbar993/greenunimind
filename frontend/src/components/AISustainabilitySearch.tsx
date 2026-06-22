import { FormEvent, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, BookOpen, Trash2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  useSustainabilitySearch,
  type ConversationMessage,
} from '@/hooks/useSustainabilitySearch';

interface AISustainabilitySearchProps {
  compact?: boolean;
  className?: string;
  onCourseClick?: () => void;
}

const SUGGESTED_QUESTIONS = [
  'How can universities reduce carbon emissions?',
  'What are the UN SDGs?',
  'Explain circular economy basics',
  'How does renewable energy work?',
];

const AISustainabilitySearch = ({
  compact = false,
  className,
  onCourseClick,
}: AISustainabilitySearchProps) => {
  const {
    query,
    setQuery,
    relatedCourses,
    isLoading,
    error,
    conversation,
    search,
    clearConversation,
  } = useSustainabilitySearch();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    search();
  };

  const handleSuggestion = (q: string) => {
    setQuery(q);
    search(q);
  };

  return (
    <div className={cn('flex flex-col', compact ? 'h-full' : 'h-[520px]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-green-600 text-white">
            <Leaf size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">GreenUniMind AI</h3>
            <p className="text-[10px] text-green-600">Sustainability Assistant</p>
          </div>
        </div>
        {conversation.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={clearConversation}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {/* Conversation area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <Sparkles className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Ask me anything about sustainability
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Climate action, SDGs, green tech, and more
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversation.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-green-600 text-sm p-3">
            <Loader2 size={16} className="animate-spin" />
            <span>Thinking...</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
        )}

        {/* Related courses */}
        {relatedCourses.length > 0 && conversation.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <BookOpen size={12} /> Related Courses
            </p>
            <div className="space-y-2">
              {relatedCourses.slice(0, 3).map((course: any) => (
                <Link
                  key={course._id}
                  to={`/courses/${course._id}`}
                  onClick={onCourseClick}
                  className="block p-2.5 rounded-lg border border-green-100 bg-white hover:bg-green-50 hover:border-green-300 transition-colors group"
                >
                  <p className="text-sm font-medium text-gray-800 group-hover:text-green-700 line-clamp-1">
                    {course.title}
                  </p>
                  {course.subtitle && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {course.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {course.courseLevel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                        {course.courseLevel}
                      </span>
                    )}
                    {course.coursePrice !== undefined && (
                      <span className="text-[10px] text-gray-500">
                        {course.coursePrice === 0
                          ? 'Free'
                          : `$${course.coursePrice}`}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-green-100 p-3 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            placeholder="Ask about sustainability..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm border-green-200 focus:border-green-500 focus:ring-green-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !query.trim()}
            className="bg-green-600 hover:bg-green-700 text-white shrink-0 h-9 w-9"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Powered by GreenUniMind AI
        </p>
      </div>
    </div>
  );
};

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 bg-green-600 text-white text-sm">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-gray-100 text-gray-800 text-sm">
        <div
          className="prose prose-sm prose-green max-w-none [&_p]:mb-1.5 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-green-700"
          dangerouslySetInnerHTML={{ __html: message.text }}
        />
        {message.topics && message.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
            {message.topics.map((topic) => (
              <span
                key={topic}
                className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AISustainabilitySearch;
