import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { getCodeShareById, updateCodeShare } from '../utils/api';
import { ThemeContext } from '../context/ThemeContext';
import { runCode, supportedLanguages, clientSideLanguages } from '../utils/codeRunner';
import AIAssistant from '../components/AIAssistant';

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      return parsed.origin;
    } catch {
      return apiUrl.replace(/\/api\/?$/, '');
    }
  }
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '3000') {
      return `http://${window.location.hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const CodeEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const [codeShare, setCodeShare] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [activeUsers, setActiveUsers] = useState(1);
  const [socketConnected, setSocketConnected] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [renderUrl, setRenderUrl] = useState(null);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    console.log('[Socket] Connecting to:', socketUrl);

    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected, ID:', socket.id);
      setSocketConnected(true);
      socket.emit('join-room', id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      setSocketConnected(false);
    });

    socket.on('receive-code-change', (receivedCode) => {
      console.log('[Socket] Received code change:', receivedCode?.length, 'characters');
      if (receivedCode === undefined || receivedCode === null) return;

      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model && model.getValue() !== receivedCode) {
          isRemoteUpdate.current = true;
          const viewState = editorRef.current.saveViewState();

          editorRef.current.setValue(receivedCode);

          if (viewState) {
            editorRef.current.restoreViewState(viewState);
          }

          setCode(receivedCode);
          setTimeout(() => {
            isRemoteUpdate.current = false;
          }, 50);
        }
      } else {
        setCode(receivedCode);
      }
    });

    socket.on('user-joined', (count) => {
      console.log('[Socket] User joined, total:', count);
      setActiveUsers(count);
    });

    socket.on('user-left', (count) => {
      console.log('[Socket] User left, total:', count);
      setActiveUsers(count);
    });

    const fetchCodeShare = async () => {
      try {
        setLoading(true);
        const data = await getCodeShareById(id);
        setCodeShare(data);
        setCode(data.code || '');
        setLanguage(data.language || 'javascript');
        setTitle(data.title || 'Untitled Code');

        if (data.customId && data.customId !== id) {
          window.history.replaceState(null, '', `/code/${data.customId}`);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load code share');
        setLoading(false);
      }
    };

    fetchCodeShare();

    return () => {
      if (socket) {
        socket.emit('leave-room', id);
        socket.disconnect();
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [id]);

  // Flush unsaved changes and disconnect cleanly on page refresh / unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', id);
        socketRef.current.disconnect();
      }
      if (editorRef.current) {
        const currentCode = editorRef.current.getValue();
        updateCodeShare(id, { code: currentCode, language, title }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id, language, title]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value) => {
    setCode(value);

    // Prevent echoing back changes received from websocket
    if (isRemoteUpdate.current) {
      return;
    }

    if (socketRef.current) {
      // 1. Emit to current URL room ID
      socketRef.current.emit('code-change', {
        roomId: id,
        code: value,
      });

      // 2. Also emit to custom ID if different from URL ID
      if (codeShare?.customId && codeShare.customId !== id) {
        socketRef.current.emit('code-change', {
          roomId: codeShare.customId,
          code: value,
        });
      }

      // 3. Also emit to Mongo _id if different from URL ID
      if (codeShare?._id && String(codeShare._id) !== id) {
        socketRef.current.emit('code-change', {
          roomId: String(codeShare._id),
          code: value,
        });
      }
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveCodeToDatabase(value);
    }, 1000);
  };

  const saveCodeToDatabase = async (codeToSave) => {
    try {
      setIsSaving(true);
      await updateCodeShare(id, { code: codeToSave, language, title });
      setIsSaving(false);
    } catch (err) {
      console.error('Error saving code:', err);
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    updateCodeShare(id, { language: newLanguage });
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (title !== codeShare?.title) {
      updateCodeShare(id, { title });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess('Link Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleSelectAll = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      const model = editorRef.current.getModel();
      if (model) {
        editorRef.current.setSelection(model.getFullModelRange());
      }
    }
  };

  const handleCopyCode = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      let textToCopy = '';
      if (selection && !selection.isEmpty()) {
        textToCopy = model.getValueInRange(selection);
      } else {
        textToCopy = code;
      }
      navigator.clipboard.writeText(textToCopy);
      setCopySuccess('Code Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const getDisplayId = () => {
    return codeShare?.customId || id;
  };

  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setShowOutput(true);
      setOutput(
        clientSideLanguages.includes(language)
          ? '🚀 Running code in the browser...'
          : '⚡ Submitting code to execution server...\nThis may take a few seconds...'
      );
      setRenderUrl(null);

      const currentCode = editorRef.current ? editorRef.current.getValue() : code;
      const result = await runCode(currentCode, language, stdin);

      if (result.success) {
        setOutput(result.output || '✅ Code executed successfully with no output.');
        if (result.renderUrl) setRenderUrl(result.renderUrl);
      } else {
        setOutput(result.output || '❌ An error occurred while running the code.');
      }
    } catch (err) {
      console.error('Error running code:', err);
      setOutput(`❌ Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const languages = supportedLanguages;

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white dark:bg-gray-900">
        <div className="text-center p-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mt-5 mb-1.5">
            Loading your code...
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Setting up the collaborative environment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen h-[100dvh] bg-white dark:bg-gray-900 overflow-hidden select-text">
      <AIAssistant code={code} language={language} output={output} onError={(err) => setError(err)} />

      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 select-none">
        <div className="w-full px-2.5 py-2 sm:px-4 sm:py-2.5">
          {/* Row 1 - Back, Title, Connection Indicator, Language, Run Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <button
              onClick={() => navigate('/')}
              aria-label="Back to home"
              title="Go to Home"
              className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                className="w-full min-w-0 text-xs sm:text-sm md:text-base font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-1 text-gray-900 dark:text-white placeholder-gray-400 transition-all truncate"
                placeholder="Untitled Code"
              />
              {/* WebSocket live status dot */}
              <span
                title={socketConnected ? 'Live synchronization active' : 'Connecting to live server...'}
                className={`w-2 h-2 rounded-full shrink-0 ${
                  socketConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-400 animate-pulse'
                }`}
              />
              {isSaving && (
                <span className="text-[10px] sm:text-xs text-blue-500 shrink-0 font-medium animate-pulse hidden sm:inline">
                  Saving...
                </span>
              )}
            </div>

            <div className="relative shrink-0">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1.5 pr-6 sm:pr-7 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm max-w-[100px] sm:max-w-none truncate font-medium cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-white dark:bg-gray-800">
                    {lang.label}
                  </option>
                ))}
              </select>
              <svg className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 text-white font-semibold py-1.5 px-2.5 sm:px-3.5 rounded-lg flex items-center gap-1 text-xs sm:text-sm disabled:cursor-not-allowed transition-all whitespace-nowrap shrink-0 shadow-sm"
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Running</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Run</span>
                </>
              )}
            </button>
          </div>

          {/* Row 2 - Collaborators, Code ID, Mobile Tools, Share Button */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                title="Active collaborators"
                className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/80 px-2 py-0.5 sm:py-1 rounded text-gray-700 dark:text-gray-300 shrink-0 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span>{activeUsers}</span>
              </div>

              <div
                title={`Code ID: ${getDisplayId()}`}
                className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/80 px-2 py-0.5 sm:py-1 rounded text-gray-700 dark:text-gray-300 min-w-0 font-mono text-[11px] sm:text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 005.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <span className="truncate max-w-[90px] sm:max-w-[140px] md:max-w-[200px]">{getDisplayId()}</span>
              </div>

              {/* Mobile Text Selection Quick Buttons */}
              <button
                onClick={handleSelectAll}
                title="Select all code"
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-medium text-[11px] transition-colors shrink-0"
              >
                Select All
              </button>

              <button
                onClick={handleCopyCode}
                title="Copy code to clipboard"
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-medium text-[11px] transition-colors shrink-0"
              >
                Copy
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {copySuccess && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] sm:text-xs animate-pulse">
                  {copySuccess}
                </span>
              )}
              <button
                onClick={copyShareLink}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium py-1 px-2.5 rounded-md flex items-center gap-1 transition-all shadow-sm"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-[11px] sm:text-xs">Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden h-full relative">
        {/* Editor Area with full mobile touch selection support */}
        <div className="flex-1 min-h-0 relative w-full overflow-hidden select-text">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={darkMode ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 20,
              wordWrap: 'on',
              automaticLayout: true,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              lineNumbersMinChars: 2,
              glyphMargin: false,
              folding: false, // Prevents folding margin from capturing mobile touch events
              selectOnLineNumbers: true, // Allows tapping line numbers to select lines
              selectionHighlight: true,
              contextmenu: true,
              accessibilitySupport: 'on', // Enables DOM textarea semantics for mobile touch & long-press selection
              readOnly: false,
              domReadOnly: false,
              links: false, // Prevents link clicks from canceling touch selection
              padding: { top: 8, bottom: 8 },
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
                alwaysConsumeMouseWheel: false,
              },
            }}
          />

          {isSaving && (
            <div className="absolute bottom-2 right-2 z-20 bg-blue-600 text-white px-2 py-0.5 rounded-md text-[11px] shadow-md flex items-center gap-1 font-medium pointer-events-none">
              <svg className="animate-spin h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2.5 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between gap-1.5 text-xs sm:text-sm z-10 select-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all font-medium whitespace-nowrap flex items-center gap-1 text-xs sm:text-sm active:scale-95 ${
                showStdin
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>{showStdin ? 'Hide Input' : 'Input'}</span>
            </button>

            <button
              onClick={() => setShowOutput(!showOutput)}
              className={`px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all font-medium whitespace-nowrap flex items-center gap-1 text-xs sm:text-sm active:scale-95 ${
                showOutput
                  ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{showOutput ? 'Hide Output' : 'Output'}</span>
              {output && !showOutput && (
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 text-[11px] sm:text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{clientSideLanguages.includes(language) ? 'Browser' : 'Server'}</span>
          </div>
        </div>

        {/* Input Panel */}
        {showStdin && (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 sm:p-3 max-h-36 overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">Input (stdin)</h3>
              <button
                onClick={() => setShowStdin(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                aria-label="Close input panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input for your program..."
              className="w-full h-16 sm:h-20 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200 font-mono text-xs resize-none"
            />
          </div>
        )}

        {/* Output Panel */}
        {showOutput && (
          <div
            className={`flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 sm:p-3 transition-all duration-200 overflow-y-auto z-10 ${
              isOutputExpanded ? 'max-h-[60vh] h-[50vh]' : 'max-h-48 sm:max-h-56'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">Output</h3>
                {isRunning && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {output && (
                  <button
                    onClick={() => setOutput('')}
                    className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsOutputExpanded(!isOutputExpanded)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={isOutputExpanded ? "Collapse" : "Expand"}
                  aria-label={isOutputExpanded ? "Collapse output" : "Expand output"}
                >
                  {isOutputExpanded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setShowOutput(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                  aria-label="Close output panel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {renderUrl ? (
              <iframe
                src={renderUrl}
                title="HTML Preview"
                className={`w-full border border-gray-200 dark:border-gray-600 rounded-lg ${
                  isOutputExpanded ? 'h-[40vh]' : 'h-32 sm:h-40'
                }`}
                sandbox="allow-scripts"
              ></iframe>
            ) : (
              <pre
                className={`whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/80 p-2.5 rounded-lg font-mono text-xs text-gray-800 dark:text-gray-200 overflow-auto ${
                  isOutputExpanded ? 'max-h-[42vh]' : 'max-h-36 sm:max-h-44'
                }`}
              >
                {output || 'No output yet. Run your code to see results.'}
              </pre>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CodeEditor;
