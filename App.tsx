import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Sparkles, AlertCircle, Headphones, Radio, Trash2, Zap } from 'lucide-react';
import { ArticleList } from './components/ArticleList';
import { Player } from './components/Player';
import { summarizeArticles, generateSpeech } from './services/geminiService';
import { Article, GenerationState, TTSVoice } from './types';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const MAX_CHARS = 5000;

// Helper to parse errors into user-friendly messages
const getFriendlyErrorMessage = (error: any): string => {
  const msg = (error?.message || '').toLowerCase();
  
  if (msg.includes('api_key') || msg.includes('apikey')) {
    return 'API Key is missing or invalid. Please check your settings.';
  }
  if (msg.includes('quota') || msg.includes('429')) {
    return 'API usage limit exceeded. Please try again later.';
  }
  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harmful')) {
    return 'Content was flagged by safety filters. Please review and edit your articles.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
    return 'Network connection error. Please check your internet and try again.';
  }
  if (msg.includes('503') || msg.includes('overloaded') || msg.includes('service unavailable')) {
    return 'The AI service is currently overloaded. Please wait a moment and try again.';
  }
  if (msg.includes('no audio data')) {
    return 'Audio generation failed to return data. Please try again.';
  }
  
  return error.message || "An unexpected error occurred. Please try again.";
};

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>(TTSVoice.Kore);
  const [autoGenerate, setAutoGenerate] = useState(false);
  
  // Persist AudioContext to avoid creating multiple contexts
  const audioContextRef = useRef<AudioContext | null>(null);
  // Track the latest generation request to handle race conditions
  const lastGenRequestRef = useRef<number>(0);

  useEffect(() => {
    // Init AudioContext on mount
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const handleAddArticle = () => {
    if (!inputText.trim()) return;

    const newArticle: Article = {
      id: generateId(),
      title: inputTitle.trim() || `Article ${articles.length + 1}`,
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setArticles([...articles, newArticle]);
    setInputText('');
    setInputTitle('');
  };

  const handleRemoveArticle = (id: string) => {
    setArticles(articles.filter(a => a.id !== id));
  };

  const handleClearAll = () => {
    if (articles.length === 0) return;
    if (window.confirm("Are you sure you want to remove all articles?")) {
      setArticles([]);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (articles.length === 0) return;
    if (!audioContextRef.current) return;

    const currentRequestTime = Date.now();
    lastGenRequestRef.current = currentRequestTime;

    // Reset previous state (except when auto-updating, we might want to keep showing old player? 
    // No, better to show loading state to indicate activity)
    setSummaryText(null);
    setAudioBuffer(null);
    setGenerationState({ status: 'summarizing' });

    try {
      // 1. Summarize
      const contentList = articles.map(a => `Title: ${a.title}\nContent: ${a.content}`);
      const summary = await summarizeArticles(contentList);
      
      if (lastGenRequestRef.current !== currentRequestTime) return; // Stale
      setSummaryText(summary);

      // 2. Generate Audio
      setGenerationState({ status: 'generating_audio' });
      const buffer = await generateSpeech(summary, selectedVoice, audioContextRef.current);
      
      if (lastGenRequestRef.current !== currentRequestTime) return; // Stale
      setAudioBuffer(buffer);
      setGenerationState({ status: 'ready' });

    } catch (error: any) {
      if (lastGenRequestRef.current !== currentRequestTime) return; // Stale
      console.error('Generation Error:', error);
      
      setGenerationState({ 
        status: 'error', 
        error: getFriendlyErrorMessage(error)
      });
    }
  }, [articles, selectedVoice]);

  // Effect: Auto-generate when articles change or toggle is enabled
  useEffect(() => {
    if (autoGenerate && articles.length > 0) {
      const timer = setTimeout(() => {
        handleGenerate();
      }, 1500); // 1.5s debounce to allow for multiple rapid changes
      return () => clearTimeout(timer);
    }
  }, [articles, autoGenerate, handleGenerate]);

  // Effect: Clear state when list becomes empty
  useEffect(() => {
    if (articles.length === 0) {
      setAudioBuffer(null);
      setSummaryText(null);
      setGenerationState({ status: 'idle' });
    }
  }, [articles.length]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Commute Briefing</h1>
              <p className="text-xs text-slate-500 font-medium">Powered by Gemini 2.5</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Auto-Update Toggle */}
            <label className="flex items-center gap-2 cursor-pointer group" title="Automatically regenerate audio when content changes">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={autoGenerate} 
                  onChange={e => setAutoGenerate(e.target.checked)} 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 transition-colors"></div>
              </div>
              <span className={`text-xs font-semibold select-none transition-colors ${autoGenerate ? 'text-indigo-700' : 'text-slate-500 group-hover:text-slate-700'}`}>
                Auto-Update
              </span>
            </label>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Voice Selector */}
             <select 
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as TTSVoice)}
              className="text-xs font-medium bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {Object.values(TTSVoice).map(voice => (
                <option key={voice} value={voice}>{voice} Voice</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        
        {/* Input Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-500" />
            Add Content
          </h2>
          
          <div className="space-y-3">
             <input
              type="text"
              placeholder="Article Title (Optional)"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
            />
            <div className="relative">
              <textarea
                placeholder="Paste news article content here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={MAX_CHARS}
                className="w-full p-4 h-32 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-slate-400"
              />
              <div className={`text-xs mt-1.5 text-right font-medium transition-colors ${inputText.length >= MAX_CHARS ? 'text-red-500' : 'text-slate-400'}`}>
                {inputText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddArticle}
                disabled={!inputText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add to Briefing
              </button>
            </div>
          </div>
        </section>

        {/* Article List Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              In Your Queue ({articles.length})
            </h2>
            {articles.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="text-xs font-medium text-slate-400 hover:text-red-600 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
          <ArticleList articles={articles} onRemove={handleRemoveArticle} />
        </section>

        {/* Action Area */}
        {articles.length > 0 && (
          <div className="sticky bottom-6 z-40">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent -top-12 pointer-events-none"></div>
            
            {(generationState.status === 'idle' || generationState.status === 'error' || generationState.status === 'ready') && (
              <button
                onClick={handleGenerate}
                disabled={autoGenerate || generationState.status === 'summarizing' || generationState.status === 'generating_audio'}
                className={`w-full py-4 rounded-2xl shadow-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-[0.99]
                  ${autoGenerate 
                    ? 'bg-indigo-50 text-indigo-400 cursor-default shadow-none hover:translate-y-0 active:scale-100' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
              >
                {autoGenerate ? (
                  <>
                    <Zap className="w-6 h-6 animate-pulse" />
                    Auto-Update Active
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 fill-indigo-400" />
                    Generate Audio Briefing
                  </>
                )}
              </button>
            )}

            {/* Error Message */}
            {generationState.status === 'error' && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100 shadow-sm text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-0.5">Generation Failed</p>
                  <p className="opacity-90">{generationState.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading / Progress State */}
        {(generationState.status === 'summarizing' || generationState.status === 'generating_audio') && (
          <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center max-w-sm w-full mx-4">
              <div className="relative w-16 h-16 mx-auto mb-6">
                 <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {generationState.status === 'summarizing' ? 'Reading Articles...' : 'Recording Audio...'}
              </h3>
              <p className="text-slate-500 text-sm">
                {generationState.status === 'summarizing' 
                  ? 'Gemini is analyzing and condensing your news.' 
                  : 'Synthesizing your personalized speech.'}
              </p>
            </div>
          </div>
        )}

        {/* Audio Player Result */}
        {generationState.status === 'ready' && audioBuffer && audioContextRef.current && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <Player 
              audioBuffer={audioBuffer} 
              audioContext={audioContextRef.current}
              transcript={summaryText || undefined}
            />
          </section>
        )}

      </main>
    </div>
  );
}

export default App;