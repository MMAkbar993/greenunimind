import { useState, useEffect, useRef } from "react";
import { Search, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CourseSearchProps } from "@/types/course-management";

const CourseSearch: React.FC<CourseSearchProps> = ({
  value,
  onChange,
  placeholder = "Search courses...",
  suggestions = [],
  onSuggestionSelect,
  className
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [localValue, value, onChange]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('courseSearchHistory');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  const saveToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [
      searchTerm,
      ...recentSearches.filter(term => term !== searchTerm)
    ].slice(0, 5); // Keep only 5 recent searches
    
    setRecentSearches(newHistory);
    localStorage.setItem('courseSearchHistory', JSON.stringify(newHistory));
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setShowSuggestions(newValue.length > 0 || recentSearches.length > 0);
  };

  const handleInputFocus = () => {
    setShowSuggestions(localValue.length > 0 || recentSearches.length > 0);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalValue(suggestion);
    onChange(suggestion);
    saveToHistory(suggestion);
    setShowSuggestions(false);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveToHistory(localValue);
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('courseSearchHistory');
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(localValue.toLowerCase()) &&
    suggestion.toLowerCase() !== localValue.toLowerCase()
  );

  const displaySuggestions = localValue.length > 0 ? filteredSuggestions : [];
  const displayRecentSearches = localValue.length === 0 ? recentSearches : [];

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10"
          aria-label="Search courses"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          role="combobox"
        />
        {localValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (displaySuggestions.length > 0 || displayRecentSearches.length > 0) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
          role="listbox"
        >
          {/* Recent Searches */}
          {displayRecentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-gray-600 h-auto p-1"
                >
                  Clear
                </Button>
              </div>
              {displayRecentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2 transition-colors"
                  role="option"
                  aria-selected={false}
                >
                  <Clock className="w-3 h-3 text-gray-400" />
                  {search}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {displaySuggestions.length > 0 && (
            <div className="p-2">
              {displayRecentSearches.length > 0 && (
                <div className="border-t border-gray-100 my-2" />
              )}
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Suggestions
              </span>
              {displaySuggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-2 transition-colors"
                  role="option"
                  aria-selected={false}
                >
                  <Search className="w-3 h-3 text-gray-400" />
                  <span>
                    {suggestion.split(new RegExp(`(${localValue})`, 'gi')).map((part, i) => (
                      <span
                        key={i}
                        className={part.toLowerCase() === localValue.toLowerCase() ? 'font-medium text-brand-primary' : ''}
                      >
                        {part}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {localValue.length > 0 && displaySuggestions.length === 0 && displayRecentSearches.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              No suggestions found for "{localValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseSearch;
