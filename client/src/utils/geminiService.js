/**
 * Gemini AI Service
 * Handles communication with Google Gemini API for code analysis and suggestions
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Model options to try in order of preference
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

let GEMINI_MODEL = GEMINI_MODELS[0];
let GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

/**
 * Validates if the API key is configured
 */
export const isGeminiConfigured = () => {
  return !!GEMINI_API_KEY;
};

/**
 * Helper function to make Gemini API calls with fallback model support
 */
const makeGeminiCall = async (prompt, temperature = 0.7, maxTokens = 2048) => {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment.');
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  // Try each model
  for (const model of GEMINI_MODELS) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
      const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Update the model if this one worked
        GEMINI_MODEL = model;
        GEMINI_API_URL = apiUrl;
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else if (response.status === 404) {
        // Model not found, try next
        continue;
      } else {
        // Other error, throw it
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
      }
    } catch (error) {
      // If this is the last model, throw the error
      if (model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
        throw error;
      }
      // Otherwise continue to next model
      continue;
    }
  }

  throw new Error('No available Gemini models found');
};

/**
 * Analyzes code for issues using Gemini API
 */
export const analyzeCodeIssues = async (code, language) => {
  const prompt = `You are an expert code reviewer. Analyze the following ${language} code and identify:
1. Any bugs or errors
2. Performance issues
3. Code quality improvements
4. Security concerns
5. Best practices violations

Be concise and specific with suggestions.

Code:
\`\`\`${language}
${code}
\`\`\`

Provide the analysis in a structured format with sections for each category.`;

  try {
    const result = await makeGeminiCall(prompt, 0.7, 2048);
    if (!result) {
      throw new Error('No analysis received from Gemini API');
    }
    return result;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

/**
 * Gets code suggestions and improvements using Gemini API
 */
export const getCodeSuggestions = async (code, language) => {
  const prompt = `You are an expert ${language} developer. Provide specific suggestions to improve this code:

\`\`\`${language}
${code}
\`\`\`

Focus on:
1. Refactoring opportunities
2. Simplification
3. Better algorithms
4. Code readability
5. Following ${language} best practices

For each suggestion, explain why it's better and provide a code example if applicable.`;

  try {
    const result = await makeGeminiCall(prompt, 0.7, 2048);
    if (!result) {
      throw new Error('No suggestions received from Gemini API');
    }
    return result;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

/**
 * Gets explanation for code using Gemini API
 */
export const explainCode = async (code, language) => {
  const prompt = `Explain this ${language} code in simple terms. Break it down line by line and explain what it does:

\`\`\`${language}
${code}
\`\`\`

Assume the reader has basic programming knowledge but may not be familiar with this specific code or language features used.`;

  try {
    const result = await makeGeminiCall(prompt, 0.5, 1024);
    if (!result) {
      throw new Error('No explanation received from Gemini API');
    }
    return result;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

/**
 * Fixes common errors in code
 */
export const fixCodeErrors = async (code, language, errorMessage) => {
  const prompt = `You are an expert ${language} developer. The following code is producing an error:

Error: ${errorMessage}

Code:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. The root cause of the error
2. The corrected code
3. An explanation of what was wrong and why this fix works

Provide the corrected code in a code block for easy copying.`;

  try {
    const result = await makeGeminiCall(prompt, 0.3, 1024);
    if (!result) {
      throw new Error('No fix received from Gemini API');
    }
    return result;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

/**
 * Ask a custom question about code
 */
export const askAboutCode = async (code, language, question) => {
  const prompt = `You are an expert ${language} developer and code consultant. A developer is asking you a question about their code.

Code:
\`\`\`${language}
${code}
\`\`\`

Question: ${question}

Please provide a helpful, detailed answer to their question. Be specific and provide code examples if relevant.`;

  try {
    const result = await makeGeminiCall(prompt, 0.7, 2048);
    if (!result) {
      throw new Error('No response received from Gemini API');
    }
    return result;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};
