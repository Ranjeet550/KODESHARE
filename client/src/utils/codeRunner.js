// Code runner utility for different languages

// Configuration for Judge0 API (a code execution API)
const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = 'fc13dd4152msha5b22fbb1f44813p1f5205jsn1d2bfe05a220'; // Replace with your actual RapidAPI key if using Judge0

// Language IDs for Judge0 API
const LANGUAGE_IDS = {
  'c': 50,
  'cpp': 54,
  'java': 62,
  'python': 71,
  'python3': 71,
  'ruby': 72,
  'go': 60,
  'rust': 73,
  'csharp': 51,
  'php': 68,
  'typescript': 74,
  'swift': 83,
  'kotlin': 78,
  'r': 80
};

// JavaScript code runner (client-side execution)
const runJavaScript = (code) => {
  try {
    // Create a safe environment for evaluation
    const originalConsoleLog = console.log;
    const logs = [];

    // Override console.log to capture output
    console.log = (...args) => {
      logs.push(args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    // Create a function from the code and execute it
    const result = new Function(`
      "use strict";
      try {
        ${code}
      } catch (error) {
        return { error: error.message };
      }
      return { logs: [] };
    `)();

    // Restore original console.log
    console.log = originalConsoleLog;

    if (result && result.error) {
      return { success: false, output: `Error: ${result.error}` };
    }

    return { success: true, output: logs.join('\n') };
  } catch (error) {
    return { success: false, output: `Error: ${error.message}` };
  }
};

// TypeScript code runner (client-side execution)
const runTypeScript = (code) => {
  try {
    // For demo purposes, we'll just run it as JavaScript
    // In a real implementation, you would transpile TypeScript to JavaScript first
    return runJavaScript(code);
  } catch (error) {
    return { success: false, output: `Error: ${error.message}` };
  }
};

// Python code runner (using Pyodide)
const runPython = async (code, stdin = '') => {
  try {
    // Check if Pyodide is loaded, if not, load it
    if (!window.pyodide) {
      try {
        // Show loading message
        console.log("Loading Python runtime (Pyodide)...");

        // Create a script element to load Pyodide
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
        document.head.appendChild(script);

        // Wait for the script to load
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });

        // Initialize Pyodide
        window.pyodide = await window.loadPyodide();
        console.log("Python runtime loaded successfully!");
      } catch (loadError) {
        console.error("Failed to load Python runtime:", loadError);
        return {
          success: false,
          output: "Failed to load Python runtime. Please try again or use another language."
        };
      }
    }

    // Prepare stdin if provided
    if (stdin) {
      // Create a Python function to simulate input
      await window.pyodide.runPythonAsync(`
        import sys
        import io
        from js import stdin_data

        class StdinReader:
            def __init__(self, data):
                self.data = data.split('\\n')
                self.position = 0

            def readline(self):
                if self.position < len(self.data):
                    line = self.data[self.position] + '\\n'
                    self.position += 1
                    return line
                return ''

        # Replace sys.stdin with our custom reader
        sys.stdin = StdinReader(stdin_data)
      `);

      // Set the stdin data in the JavaScript context
      window.stdin_data = stdin;
    }

    // Capture stdout
    let output = '';
    const stdout = new window.pyodide.FS.streams[1];
    const originalWrite = stdout.write;

    stdout.write = function(buffer, offset, length) {
      output += new TextDecoder().decode(buffer.slice(offset, offset + length));
      return originalWrite.apply(this, arguments);
    };

    // Run the code
    await window.pyodide.runPythonAsync(code);

    // Restore stdout
    stdout.write = originalWrite;

    return { success: true, output };
  } catch (error) {
    return { success: false, output: `Error: ${error.message}` };
  }
};

// HTML/CSS runner
const runHTML = (code) => {
  try {
    // Create a data URL from the HTML code
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;

    return {
      success: true,
      output: '',
      renderUrl: dataUrl
    };
  } catch (error) {
    return { success: false, output: `Error: ${error.message}` };
  }
};

// CSS runner (with HTML preview)
const runCSS = (code) => {
  try {
    // Create a simple HTML document with the CSS
    const htmlWithCSS = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${code}</style>
      </head>
      <body>
        <div class="container">
          <h1>CSS Preview</h1>
          <p>This is a preview of your CSS. Add your own HTML elements in the code to see more effects.</p>
          <div class="box">A styled box</div>
          <button class="button">A Button</button>
          <div class="flex-container">
            <div class="flex-item">Item 1</div>
            <div class="flex-item">Item 2</div>
            <div class="flex-item">Item 3</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a data URL from the HTML code
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlWithCSS)}`;

    return {
      success: true,
      output: '',
      renderUrl: dataUrl
    };
  } catch (error) {
    return { success: false, output: `Error: ${error.message}` };
  }
};

// Run code using Judge0 API
const runWithJudge0 = async (code, languageId, stdin = '') => {
  try {
    // Show a loading message
    console.log(`Executing code with Judge0 API (Language ID: ${languageId})`);

    // Create the submission
    const response = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: stdin,
        redirect_stderr_to_stdout: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Judge0 API error:', errorData);
      return {
        success: false,
        output: `Error submitting code: ${response.status} ${response.statusText}`
      };
    }

    const submission = await response.json();
    const token = submission.token;

    if (!token) {
      return {
        success: false,
        output: 'Failed to get submission token from Judge0 API'
      };
    }

    console.log(`Code submitted successfully. Token: ${token}`);

    // Poll for results
    let result;
    let attempts = 0;

    while (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      if (!resultResponse.ok) {
        const errorData = await resultResponse.json();
        console.error('Judge0 API error when fetching results:', errorData);
        return {
          success: false,
          output: `Error fetching results: ${resultResponse.status} ${resultResponse.statusText}`
        };
      }

      result = await resultResponse.json();

      // Status 1: In Queue, Status 2: Processing
      if (result.status.id !== 1 && result.status.id !== 2) {
        break;
      }

      attempts++;
    }

    // Process the result
    if (result.status.id === 3) {
      // Status 3: Accepted (success)
      return {
        success: true,
        output: result.stdout || 'Code executed successfully with no output.'
      };
    } else if (result.status.id === 4) {
      // Status 4: Wrong Answer
      return {
        success: true,
        output: result.stdout || 'Code executed but produced wrong answer.'
      };
    } else if (result.status.id === 5) {
      // Status 5: Time Limit Exceeded
      return {
        success: false,
        output: 'Time limit exceeded. Your code took too long to execute.'
      };
    } else if (result.status.id === 6) {
      // Status 6: Compilation Error
      return {
        success: false,
        output: `Compilation error:\n${result.compile_output || 'Unknown compilation error'}`
      };
    } else if (result.status.id === 7 || result.status.id === 8) {
      // Status 7: Runtime Error (SIGSEGV), Status 8: Runtime Error (SIGXFSZ)
      return {
        success: false,
        output: `Runtime error:\n${result.stderr || result.message || 'Unknown runtime error'}`
      };
    } else if (result.status.id === 9) {
      // Status 9: Runtime Error (SIGABRT)
      return {
        success: false,
        output: `Runtime error (SIGABRT):\n${result.stderr || 'Program aborted'}`
      };
    } else if (result.status.id === 10) {
      // Status 10: Runtime Error (NZEC)
      return {
        success: false,
        output: `Runtime error (Non-zero exit code):\n${result.stderr || 'Program exited with non-zero code'}`
      };
    } else if (result.status.id === 11) {
      // Status 11: Runtime Error (Other)
      return {
        success: false,
        output: `Runtime error:\n${result.stderr || 'Unknown error during execution'}`
      };
    } else if (result.status.id === 12) {
      // Status 12: Internal Error
      return {
        success: false,
        output: 'Internal server error. Please try again later.'
      };
    } else {
      // Other status
      return {
        success: false,
        output: `Execution failed with status: ${result.status.description}\n${result.stderr || result.compile_output || 'No additional information available'}`
      };
    }
  } catch (error) {
    console.error('Error in runWithJudge0:', error);
    return {
      success: false,
      output: `Error: ${error.message}`
    };
  }
};

// Main code runner function
export const runCode = async (code, language, stdin = '') => {
  // Client-side execution for supported languages
  switch (language) {
    case 'javascript':
      // For JavaScript, we can simulate stdin by adding console input handling
      if (stdin) {
        const stdinCode = `
          // Simulated stdin
          const lines = ${JSON.stringify(stdin.split('\n'))};
          let lineIndex = 0;

          // Override prompt to use our simulated stdin
          const originalPrompt = prompt;
          window.prompt = function() {
            if (lineIndex < lines.length) {
              return lines[lineIndex++];
            }
            return '';
          };

          // Your code starts here
          ${code}
        `;
        return runJavaScript(stdinCode);
      }
      return runJavaScript(code);

    case 'typescript':
      return runTypeScript(code);

    case 'html':
      return runHTML(code);

    case 'css':
      return runCSS(code);

    case 'python':
      // Try to use Pyodide first, but fall back to Judge0 if it fails
      try {
        return await runPython(code, stdin);
      } catch (error) {
        console.log('Pyodide failed, falling back to Judge0:', error);
        return await runWithJudge0(code, LANGUAGE_IDS['python'], stdin);
      }
  }

  // For all other languages, use Judge0 API
  if (LANGUAGE_IDS[language]) {
    return await runWithJudge0(code, LANGUAGE_IDS[language], stdin);
  }

  // Language not supported
  return {
    success: false,
    output: `Running ${language} code is not supported. Try JavaScript, HTML, CSS, or Python instead.`
  };
};

// List of languages that can be run in the browser
export const clientSideLanguages = ['javascript', 'typescript', 'html', 'css', 'python'];

// List of all supported languages
export const supportedLanguages = [
  { value: 'javascript', label: 'JavaScript', clientSide: true },
  { value: 'typescript', label: 'TypeScript', clientSide: true },
  { value: 'html', label: 'HTML', clientSide: true },
  { value: 'css', label: 'CSS', clientSide: true },
  { value: 'python', label: 'Python', clientSide: true },
  { value: 'java', label: 'Java', clientSide: false },
  { value: 'c', label: 'C', clientSide: false },
  { value: 'cpp', label: 'C++', clientSide: false },
  { value: 'csharp', label: 'C#', clientSide: false },
  { value: 'php', label: 'PHP', clientSide: false },
  { value: 'ruby', label: 'Ruby', clientSide: false },
  { value: 'go', label: 'Go', clientSide: false },
  { value: 'rust', label: 'Rust', clientSide: false },
  { value: 'swift', label: 'Swift', clientSide: false },
  { value: 'kotlin', label: 'Kotlin', clientSide: false }
];
