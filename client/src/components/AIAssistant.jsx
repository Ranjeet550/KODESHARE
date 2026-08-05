import { useState, useEffect } from 'react';
import { analyzeCodeIssues, getCodeSuggestions, explainCode, fixCodeErrors, askAboutCode, isGeminiConfigured } from '../utils/geminiService';

const CHAT_HISTORY_KEY = 'ai_assistant_chat_history';
const MAX_HISTORY_MESSAGES = 50; // Limit stored messages

const AIAssistant = ({ code, language, output, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setMessages(parsedHistory);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Keep only the last MAX_HISTORY_MESSAGES
        const messagesToSave = messages.slice(-MAX_HISTORY_MESSAGES);
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
      } catch (err) {
        console.error('Failed to save chat history:', err);
      }
    }
  }, [messages]);

  // Clear chat history
  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    setError('');
  };

  const handleSendQuestion = async () => {
    if (!inputQuestion.trim()) return;

    const userMessage = { role: 'user', content: inputQuestion, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInputQuestion('');
    setLoading(true);
    setError('');

    try {
      const response = await askAboutCode(code, language, inputQuestion);
      const assistantMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Failed to get response');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeIssues = async () => {
    if (!code.trim()) {
      setError('Please write some code first before analyzing.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');
    setActiveTab('analysis');

    try {
      const result = await analyzeCodeIssues(code, language);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze code');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!code.trim()) {
      setError('Please write some code first before getting suggestions.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');
    setActiveTab('suggestions');

    try {
      const result = await getCodeSuggestions(code, language);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Failed to get suggestions');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainCode = async () => {
    if (!code.trim()) {
      setError('Please write some code first before explaining.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');
    setActiveTab('explanation');

    try {
      const result = await explainCode(code, language);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Failed to explain code');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixErrors = async () => {
    if (!code.trim()) {
      setError('Please write some code first before fixing.');
      return;
    }

    if (!output.trim()) {
      setError('Please run the code first to see errors that need fixing.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');
    setActiveTab('fix');

    try {
      const result = await fixCodeErrors(code, language, output);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Failed to fix code');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isGeminiConfigured()) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 dark:from-amber-600 dark:via-orange-600 dark:to-red-600 dark:hover:from-amber-700 dark:hover:via-orange-700 dark:hover:to-red-700 text-white rounded-full p-4 shadow-xl dark:shadow-amber-900/50 transition-all hover:shadow-2xl hover:scale-110 animate-pulse"
          title="AI Assistant - Not Configured"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute bottom-16 right-0 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-gray-900/80 p-6 border border-gray-200 dark:border-gray-600 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center">
              <div className="inline-block p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">AI Assistant Not Configured</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                Please set the <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-900 dark:text-gray-100">VITE_GEMINI_API_KEY</code> environment variable to enable the AI assistant.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 group">
      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setIsExpanded(false);
        }}
        className="bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 dark:from-purple-600 dark:via-pink-600 dark:to-red-600 dark:hover:from-purple-700 dark:hover:via-pink-700 dark:hover:to-red-700 text-white rounded-full p-4 shadow-xl dark:shadow-purple-900/50 transition-all hover:shadow-2xl hover:scale-110 relative group"
        title="AI Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="absolute top-0 right-0 h-3 w-3 bg-green-400 dark:bg-green-500 rounded-full animate-pulse border-2 border-white dark:border-gray-800"></span>
      </button>

      {/* Assistant Panel */}
      {isOpen && (
        <div
          className={`absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-gray-900/80 border border-gray-200 dark:border-gray-600 flex flex-col overflow-hidden backdrop-blur-sm transition-all duration-300 ${
            isExpanded
              ? 'w-[45vw] max-h-[90vh]'
              : 'w-96 max-h-[600px]'
          } animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 dark:from-purple-700 dark:via-pink-700 dark:to-red-700 text-white p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/30 dark:bg-white/10 rounded-lg backdrop-blur-sm shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg drop-shadow-sm">AI Assistant</h3>
                <p className="text-xs text-white/95 dark:text-white/80 drop-shadow-sm">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:bg-white/25 dark:hover:bg-white/10 rounded-lg p-2 transition-all duration-200 hover:scale-110 active:scale-95"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsExpanded(false);
                }}
                className="text-white hover:bg-white/25 dark:hover:bg-white/10 rounded-lg p-2 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 relative ${
                activeTab === 'chat'
                  ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
              {activeTab === 'chat' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 dark:from-purple-500 dark:via-pink-500 dark:to-red-500 rounded-t"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 relative ${
                activeTab === 'tools'
                  ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tools
              {activeTab === 'tools' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 dark:from-purple-500 dark:via-pink-500 dark:to-red-500 rounded-t"></div>
              )}
            </button>
          </div>

          {/* Content */}
          {activeTab === 'chat' ? (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-purple-400 dark:scrollbar-thumb-purple-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
                {messages.length === 0 && !error && (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    <div className="mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ask me anything about your code!</p>
                    <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">I can analyze, explain, and improve your code.</p>
                    <p className="text-xs mt-3 text-gray-400 dark:text-gray-500">💡 Your chat history is automatically saved</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-600 text-red-800 dark:text-red-200 p-4 rounded-lg text-sm animate-in fade-in shadow-sm">
                    <p className="font-semibold mb-1 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      Error
                    </p>
                    <p>{error}</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div
                      className={`max-w-xs px-4 py-3 rounded-xl text-sm transition-all ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.timestamp && (
                        <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start animate-in fade-in">
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-600 dark:bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-pink-600 dark:bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline animate-spin mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-inner">
                {messages.length > 0 && (
                  <div className="px-3 pt-2 flex justify-end">
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                      title="Clear chat history"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear history
                    </button>
                  </div>
                )}
                <div className="p-3 flex gap-2">
                  <input
                    type="text"
                    value={inputQuestion}
                    onChange={(e) => setInputQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
                    placeholder="Ask about your code..."
                    className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendQuestion}
                    disabled={loading || !inputQuestion.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800 disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    {loading ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 p-4 bg-gray-50 dark:bg-gray-900">
              {/* Tools Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={handleAnalyzeIssues}
                  disabled={loading}
                  className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-900/60 dark:hover:to-blue-800/60 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 dark:border-blue-700 px-4 py-3 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300 transition-all duration-200 hover:shadow-md hover:scale-105 transform"
                >
                  {loading && activeTab === 'analysis' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline animate-spin mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}{' '}
                  Analyze
                </button>

                <button
                  onClick={handleGetSuggestions}
                  disabled={loading}
                  className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 hover:from-green-100 hover:to-green-150 dark:hover:from-green-900/60 dark:hover:to-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed border border-green-200 dark:border-green-700 px-4 py-3 rounded-lg text-sm font-semibold text-green-700 dark:text-green-300 transition-all duration-200 hover:shadow-md hover:scale-105 transform"
                >
                  {loading && activeTab === 'suggestions' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline animate-spin mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.343-6.343l-.707-.707M5 12a7 7 0 1014 0 7 7 0 01-14 0z" />
                    </svg>
                  )}{' '}
                  Improve
                </button>

                <button
                  onClick={handleExplainCode}
                  disabled={loading}
                  className="group bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/40 hover:from-orange-100 hover:to-orange-150 dark:hover:from-orange-900/60 dark:hover:to-orange-800/60 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-200 dark:border-orange-700 px-4 py-3 rounded-lg text-sm font-semibold text-orange-700 dark:text-orange-300 transition-all duration-200 hover:shadow-md hover:scale-105 transform"
                >
                  {loading && activeTab === 'explanation' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline animate-spin mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
                    </svg>
                  )}{' '}
                  Explain
                </button>

                <button
                  onClick={handleFixErrors}
                  disabled={loading}
                  className="group bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/40 hover:from-red-100 hover:to-red-150 dark:hover:from-red-900/60 dark:hover:to-red-800/60 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 dark:border-red-700 px-4 py-3 rounded-lg text-sm font-semibold text-red-700 dark:text-red-300 transition-all duration-200 hover:shadow-md hover:scale-105 transform"
                >
                  {loading && activeTab === 'fix' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline animate-spin mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}{' '}
                  Fix
                </button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-400 dark:scrollbar-thumb-purple-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-600 text-red-800 dark:text-red-200 p-4 rounded-lg text-sm mb-3 animate-in fade-in shadow-sm">
                    <p className="font-semibold mb-1 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      Error:
                    </p>
                    <p>{error}</p>
                  </div>
                )}

                {loading && !analysis && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-500 animate-spin mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing...</p>
                  </div>
                )}

                {analysis && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-auto font-mono text-xs leading-relaxed shadow-sm">
                      {analysis}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(analysis)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-700 dark:to-pink-700 dark:hover:from-purple-800 dark:hover:to-pink-800 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all hover:shadow-md transform hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Result
                    </button>
                  </div>
                )}

                {!loading && !analysis && !error && (
                  <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click a tool button to get started</p>
                    <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">Analyze, improve, or fix your code</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
