import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { getCodeShareById, updateCodeShare } from '../utils/api';
import { ThemeContext } from '../context/ThemeContext';
import { runCode, supportedLanguages, clientSideLanguages } from '../utils/codeRunner';

// Add custom styles for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

const CodeEditor = () => {
  // Add styles to document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
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
    socketRef.current = io('http://localhost:5000');

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
    setCopySuccess('Link copied!');

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
        setOutput('Running code in the browser...');
      } else {
        setOutput('Submitting code to execution server...\nThis may take a few seconds...');
      }

      setRenderUrl(null);

      // Get the current code from the editor
      const currentCode = editorRef.current.getValue();

      // Run the code with stdin if provided
      const result = await runCode(currentCode, language, stdin);

      if (result.success) {
        setOutput(result.output || 'Code executed successfully with no output.');

        // If there's a render URL (for HTML), set it
        if (result.renderUrl) {
          setRenderUrl(result.renderUrl);
        }
      } else {
        setOutput(result.output || 'An error occurred while running the code.');
      }
    } catch (err) {
      console.error('Error running code:', err);
      setOutput(`Error: ${err.message}`);
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
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-[#E9F5BE]/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#03A791] animate-spin"></div>
        </div>
        <p className="text-xl font-medium text-gray-700 dark:text-gray-300">Loading code...</p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-8 py-6 rounded-xl shadow-lg max-w-2xl w-full">
          <div className="flex items-start">
            <div className="bg-red-200 dark:bg-red-800/30 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">Error Loading Code Share</h2>
              <p className="mb-6 text-lg">{error}</p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="bg-[#03A791] hover:bg-[#03A791]/90 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Go Home
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 shadow-sm z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Section - Title and Language */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03A791] dark:focus:ring-[#81E7AF] dark:bg-dark-700 dark:text-white text-lg font-semibold transition-all duration-200"
                  placeholder="Enter title..."
                />
              </div>

              <div className="flex items-center bg-gray-50 dark:bg-dark-700 rounded-lg px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                <label htmlFor="language" className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                  Language:
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={handleLanguageChange}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-white font-medium"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Section - Stats and Actions */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Users Online */}
              <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 px-3 py-1.5 rounded-lg">
                <div className="relative mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#03A791] dark:text-[#81E7AF]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-[#F1BA88] text-[#03A791] text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">{activeUsers}</span>
                </div>
                <span className="text-sm font-medium">{activeUsers === 1 ? 'user' : 'users'} online</span>
              </div>

              {/* Code ID */}
              <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 px-3 py-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-[#03A791] dark:text-[#81E7AF]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">ID: {getDisplayId()}</span>
              </div>

              {/* Share Button */}
              <button
                onClick={copyShareLink}
                className="bg-[#F1BA88] hover:bg-[#F1BA88]/90 text-[#03A791] font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-200 shadow-sm hover:shadow"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                </svg>
                Share
              </button>
              {copySuccess && (
                <span className="text-[#03A791] dark:text-[#81E7AF] font-medium animate-pulse">{copySuccess}</span>
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
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              fontFamily: "'Fira Code', monospace",
              fontLigatures: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: true,
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              lineDecorationsWidth: 10,
              renderIndentGuides: true,
              renderWhitespace: 'selection'
            }}
          />

          {isSaving && (
            <div className="absolute bottom-4 right-4 bg-[#03A791]/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg flex items-center animate-pulse">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </div>
          )}
        </div>

        {/* Run Controls Panel */}
        <div className="bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="bg-[#03A791] hover:bg-[#03A791]/90 text-white font-bold py-2.5 px-5 rounded-lg flex items-center disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
              >
                {isRunning ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Code
                  </>
                )}
              </button>

              <button
                onClick={toggleStdin}
                className={`flex items-center px-3 py-2 rounded-lg border transition-all duration-200 ${
                  showStdin
                    ? 'bg-[#F1BA88]/20 text-[#03A791] border-[#F1BA88]/30 dark:text-[#F1BA88] hover:bg-[#F1BA88]/30'
                    : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-dark-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                {showStdin ? 'Hide Input' : 'Add Input'}
              </button>

              <button
                onClick={toggleOutput}
                className={`flex items-center px-3 py-2 rounded-lg border transition-all duration-200 ${
                  showOutput
                    ? 'bg-[#81E7AF]/20 text-[#03A791] border-[#81E7AF]/30 dark:text-[#81E7AF] hover:bg-[#81E7AF]/30'
                    : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-dark-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                </svg>
                {showOutput ? 'Hide Output' : 'Show Output'}
              </button>
            </div>

            <div className={`flex items-center px-3 py-1.5 rounded-lg ${!clientSideLanguages.includes(language) ? 'bg-[#E9F5BE]/30 text-[#03A791] dark:text-[#81E7AF]' : 'bg-[#81E7AF]/20 text-[#03A791] dark:text-[#81E7AF]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
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
          <div className="border-t border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 p-4 transition-all duration-300 animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-[#03A791] dark:text-[#81E7AF] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Input (stdin)
              </h3>
              <button
                onClick={toggleStdin}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
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
            className="border-t border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 transition-all duration-300 animate-fadeIn"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark-600">
              <h3 className="text-lg font-semibold text-[#03A791] dark:text-[#81E7AF] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                </svg>
                Output
              </h3>
              <div className="flex items-center gap-2">
                {isRunning && (
                  <span className="text-sm text-[#F1BA88] flex items-center animate-pulse">
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running...
                  </span>
                )}
                <button
                  onClick={toggleOutput}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {renderUrl ? (
              <div className="h-64 border-b border-gray-200 dark:border-dark-600">
                <iframe
                  src={renderUrl}
                  title="HTML Preview"
                  className="w-full h-full"
                  sandbox="allow-scripts"
                ></iframe>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-dark-700 p-4 overflow-auto max-h-64 font-mono text-sm text-gray-800 dark:text-gray-200 m-0">
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
