
import React, { useState, useEffect, useCallback } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      // Automatically trigger search on successful transcription
      onSearch(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const suggestions = [
    "Gaming laptop under $1200 with OLED",
    "Ergonomic office chair for back pain",
    "Noise cancelling headphones for travel",
    "Mechanical keyboard with brown switches"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i className={`fas ${isListening ? 'fa-microphone text-red-500 animate-pulse' : 'fa-search text-gray-400'} text-lg group-focus-within:text-blue-500 transition-colors`}></i>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isListening ? "I'm listening..." : "What are you looking for today?"}
          className={`block w-full pl-12 pr-44 py-4 bg-white border ${isListening ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200'} rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-lg transition-all outline-none`}
          disabled={isLoading}
        />
        
        <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleVoiceSearch}
            disabled={isLoading || isListening}
            className={`w-12 h-full flex items-center justify-center rounded-xl transition-all ${
              isListening 
                ? 'bg-red-50 text-red-600' 
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-blue-600'
            }`}
            title="Search by voice"
          >
            <i className={`fas fa-microphone ${isListening ? 'animate-bounce' : ''}`}></i>
          </button>
          
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 h-full bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
              <>
                <span className="hidden sm:inline">Find Best Deals</span>
                <i className="fas fa-arrow-right"></i>
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion);
            }}
            className="text-xs font-medium px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors border border-gray-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchInput;
