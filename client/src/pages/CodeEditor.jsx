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
  const [activeUsers, setActiveUsers] = useState(1); // Start with 1 (self)

  // Code execution states
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [renderUrl, setRenderUrl] = useState(null);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  const socketRef = useRef();
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const outputRef = useRef(null);

  // Connect to socket and fetch code share
  useEffect(() => {
    // Connect to socket.io server
    socketRef.current = io('http://localhost:5001');

    // Join the room for this code share
    socketRef.current.emit('join-room', id);

    // Listen for code changes from other users
    socketRef.current.on('receive-code-change', (receivedCode) => {
      setCode(receivedCode);

      // Update editor content if editor is ready
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model && model.getValue() !== receivedCode) {
          editorRef.current.setValue(receivedCode);
        }
      }
    });

    // Listen for user joined events
    socketRef.current.on('user-joined', (count) => {
      setActiveUsers(count);
    });

    // Listen for user left events
    socketRef.current.on('user-left', (count) => {
      setActiveUsers(count);
    });

    // Fetch the code share data
    const fetchCodeShare = async () => {
      try {
        setLoading(true);
        const data = await getCodeShareById(id);

        setCodeShare(data);
        setCode(data.code || '');
        setLanguage(data.language || 'javascript');
        setTitle(data.title || 'Untitled Code');

        // If this is a custom ID, update the browser URL to show the custom ID
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

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id]);

  // Handle editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Handle code change
  const handleCodeChange = (value) => {
    setCode(value);

    // Emit code change to other users
    socketRef.current.emit('code-change', {
      roomId: id,
      code: value
    });

    // Debounce saving to database
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCodeToDatabase(value);
    }, 1000); // Save after 1 second of inactivity
  };

  // Save code to database
  const saveCodeToDatabase = async (codeToSave) => {
    try {
      setIsSaving(true);

      await updateCodeShare(id, {
        code: codeToSave,
        language,
        title
      });

      setIsSaving(false);
    } catch (err) {
      console.error('Error saving code:', err);
      setIsSaving(false);
    }
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);

    // Save to database
    updateCodeShare(id, { language: newLanguage });
  };

  // Handle title change
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  // Save title when input loses focus
  const handleTitleBlur = () => {
    if (title !== codeShare.title) {
      updateCodeShare(id, { title });
    }
  };

  // Copy share link to clipboard
  const copyShareLink = () => {
    const shareLink = window.location.href;
    navigator.clipboard.writeText(shareLink);
    setCopySuccess('Copied!');

    // Clear the success message after 2 seconds
    setTimeout(() => {
      setCopySuccess('');
    }, 2000);
  };

  // Get display ID (custom ID or MongoDB ID)
  const getDisplayId = () => {
    if (codeShare && codeShare.customId) {
      return codeShare.customId;
    }
    return id;
  };

  // Toggle stdin visibility
  const toggleStdin = () => {
    setShowStdin(!showStdin);
  };

  // Handle code execution
  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setShowOutput(true);

      // Show different loading messages based on execution environment
      if (clientSideLanguages.includes(language)) {
        setOutput('🚀 Running code in the browser...');
      } else {
        setOutput('⚡ Submitting code to execution server...\nThis may take a few seconds...');
      }

      setRenderUrl(null);

      // Get the current code from the editor
      const currentCode = editorRef.current.getValue();

      // Run the code with stdin if provided
      const result = await runCode(currentCode, language, stdin);

      if (result.success) {
        setOutput(result.output || '✅ Code executed successfully with no output.');

        // If there's a render URL (for HTML), set it
        if (result.renderUrl) {
          setRenderUrl(result.renderUrl);
        }
      } else {
        setOutput(result.output || '❌ An error occurred while running the code.');
      }
    } catch (err) {
      console.error('Error running code:', err);
      setOutput(`❌ Error: ${err.message}`);
    } finally {
      setIsRunning(false);

      // Scroll to output
      if (outputRef.current) {
        outputRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Toggle output visibility
  const toggleOutput = () => {
    setShowOutput(!showOutput);

    // If showing output, scroll to it
    if (!showOutput && outputRef.current) {
      setTimeout(() => {
        outputRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Use the supported languages from codeRunner.js
  const languages = supportedLanguages;

  // Calculate viewport height for full-screen editor
  useEffect(() => {
    const setEditorHeight = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial height
    setEditorHeight();

    // Update on resize
    window.addEventListener('resize', setEditorHeight);

    return () => {
      window.removeEventListener('resize', setEditorHeight);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-3 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        <div className="mt-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Loading your code...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Setting up the collaborative environment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900 p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200"
            >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2.5 px-4 rounded-md transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Section - Title and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded-md px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 min-w-0"
                  placeholder="Untitled Code"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Language Selector */}
                <div className="relative">
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="appearance-none bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 pr-8 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {languages.map((lang) => (
                      <option 
                        key={lang.value} 
                        value={lang.value}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                      >
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md flex items-center disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isRunning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Section - Stats and Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Users Online */}
              <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                <div className="relative mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-medium rounded-full h-4 w-4 flex items-center justify-center">{activeUsers}</span>
                </div>
                <span className="text-sm font-medium">{activeUsers === 1 ? 'user' : 'users'} online</span>
              </div>

              {/* Code ID */}
              <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">ID: {getDisplayId()}</span>
              </div>

              {/* Share Button */}
              <button
                onClick={copyShareLink}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              {copySuccess && (
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">{copySuccess}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Editor Container */}
        <div className="relative flex-1 overflow-hidden" style={{ height: 'calc(var(--vh, 100vh) - 150px)' }}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={darkMode ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: true,
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              lineDecorationsWidth: 10,
              renderIndentGuides: true,
              renderWhitespace: 'selection',
              padding: { top: 16, bottom: 16 }
            }}
          />

          {isSaving && (
            <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-md text-sm shadow-lg flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleStdin}
                className={`flex items-center px-3 py-2 rounded-md border transition-colors duration-200 ${
                  showStdin
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
                    : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                {showStdin ? 'Hide Input' : 'Add Input'}
              </button>

              <button
                onClick={toggleOutput}
                className={`flex items-center px-3 py-2 rounded-md border transition-colors duration-200 ${
                  showOutput
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                    : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {showOutput ? 'Hide Output' : 'Show Output'}
              </button>
            </div>

            <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {clientSideLanguages.includes(language)
                  ? `${languages.find(lang => lang.value === language)?.label || language} runs in browser`
                  : `${languages.find(lang => lang.value === language)?.label || language} runs on server`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Stdin Input Panel */}
        {showStdin && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all duration-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Input (stdin)
              </h3>
              <button
                onClick={toggleStdin}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden">
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input for your program here..."
                className="w-full h-24 p-3 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-200 font-mono text-sm resize-none"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Each line will be passed as input to your program when it requests it.
            </p>
          </div>
        )}

        {/* Output Display Panel */}
        {showOutput && (
          <div
            ref={outputRef}
            className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Output
              </h3>
              <div className="flex items-center gap-2">
                {isRunning && (
                  <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running...
                  </span>
                )}
                <button
                  onClick={toggleOutput}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {renderUrl ? (
              <div className="h-64 border-b border-gray-200 dark:border-gray-700">
                <iframe
                  src={renderUrl}
                  title="HTML Preview"
                  className="w-full h-full"
                  sandbox="allow-scripts"
                ></iframe>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 overflow-auto max-h-64 font-mono text-sm text-gray-800 dark:text-gray-200 m-0 border-0">
                {output || 'No output yet. Run your code to see results.'}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
