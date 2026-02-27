import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { getCodeShareById, updateCodeShare } from '../utils/api';
import { ThemeContext } from '../context/ThemeContext';
import { runCode, supportedLanguages, clientSideLanguages } from '../utils/codeRunner';

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

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [renderUrl, setRenderUrl] = useState(null);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  const socketRef = useRef();
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(socketUrl);
    socketRef.current.emit('join-room', id);

    socketRef.current.on('receive-code-change', (receivedCode) => {
      setCode(receivedCode);
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model && model.getValue() !== receivedCode) {
          editorRef.current.setValue(receivedCode);
        }
      }
    });

    socketRef.current.on('user-joined', (count) => setActiveUsers(count));
    socketRef.current.on('user-left', (count) => setActiveUsers(count));

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
      if (socketRef.current) socketRef.current.disconnect();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [id]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value) => {
    setCode(value);
    socketRef.current.emit('code-change', { roomId: id, code: value });

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
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const getDisplayId = () => {
    return codeShare?.customId || id;
  };

  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setShowOutput(true);
      setOutput(clientSideLanguages.includes(language) ? '🚀 Running code in the browser...' : '⚡ Submitting code to execution server...\nThis may take a few seconds...');
      setRenderUrl(null);

      const currentCode = editorRef.current.getValue();
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
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-6 mb-2">Loading your code...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Setting up the collaborative environment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate('/')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">Go Home</button>
            <button onClick={() => window.location.reload()} className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="w-full px-3 py-2 md:px-4 md:py-3">
          {/* Row 1 - Title, Language, Run Button */}
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              className="flex-1 min-w-0 text-sm md:text-base font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded px-2 py-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              placeholder="Untitled Code"
            />
            
            <div className="relative">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 pr-7 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-white dark:bg-gray-800">
                    {lang.label}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-1 px-3 rounded flex items-center gap-1 text-xs md:text-sm disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Run</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Run</span>
                </>
              )}
            </button>
          </div>

          {/* Row 2 - Stats and Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <span className="text-gray-600 dark:text-gray-300">{activeUsers}</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{getDisplayId()}</span>
            </div>

            <button
              onClick={copyShareLink}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-2 rounded flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
            {copySuccess && <span className="text-green-600 dark:text-green-400 font-medium text-xs">{copySuccess}</span>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 min-h-0 relative">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={darkMode ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              wordWrap: 'on',
              automaticLayout: true,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              renderIndentGuides: true,
              renderWhitespace: 'selection',
              padding: { top: 8, bottom: 8 }
            }}
          />
          {isSaving && (
            <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs shadow-lg flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-2 flex flex-wrap items-center gap-2 text-xs md:text-sm">
          <button
            onClick={() => setShowStdin(!showStdin)}
            className={`px-2 py-1 rounded border transition-colors whitespace-nowrap ${
              showStdin
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
                : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {showStdin ? 'Hide Input' : 'Input'}
          </button>

          <button
            onClick={() => setShowOutput(!showOutput)}
            className={`px-2 py-1 rounded border transition-colors whitespace-nowrap ${
              showOutput
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {showOutput ? 'Hide Output' : 'Output'}
          </button>

          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">{clientSideLanguages.includes(language) ? 'Browser' : 'Server'}</span>
          </div>
        </div>

        {/* Input Panel */}
        {showStdin && (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 md:p-3 max-h-24 overflow-y-auto">
            <h3 className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Input (stdin)</h3>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input for your program..."
              className="w-full h-16 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200 font-mono text-xs resize-none"
            />
          </div>
        )}

        {/* Output Panel */}
        {showOutput && (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 md:p-3 max-h-32 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs md:text-sm font-semibold text-green-600 dark:text-green-400">Output</h3>
              {isRunning && <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running
              </span>}
            </div>
            {renderUrl ? (
              <iframe src={renderUrl} title="HTML Preview" className="w-full h-24 border border-gray-200 dark:border-gray-600 rounded" sandbox="allow-scripts"></iframe>
            ) : (
              <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-2 rounded font-mono text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-24">
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
