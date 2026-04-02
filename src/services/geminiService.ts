import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedMCQ {
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic?: string;
  book?: string;
}

export async function extractMCQsFromText(text: string, retryCount = 0): Promise<ExtractedMCQ[]> {
  const apiKey = process.env.GEMINI_API_KEY1;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY1") {
    console.error("GEMINI_API_KEY1 is missing or is a placeholder in process.env");
    throw new Error("GEMINI_API_KEY1 is not configured. Please set your Gemini API key in the AI Studio Secrets panel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview"; 
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `EXTRACT EVERY SINGLE Multiple Choice Question (MCQ) from the provided text. 
              
              This is for a high-stakes medical exam preparation app. MISSING EVEN ONE QUESTION IS UNACCEPTABLE.
              
              The text may contain:
              - Standard MCQs (Question + Options A-E).
              - Clinical Case Studies followed by one or more questions.
              - Questions with images referenced (just extract the text).
              - Questions where the answer is in a separate "Answer Key" section.
              - Questions with detailed "Explanations" or "Rationales".
              
              YOUR TASK:
              1. Identify every question-like structure.
              2. For Case Studies: Ensure the clinical stem (the story) is included in the 'text' of the question. If one stem applies to multiple questions, repeat the stem for each question.
              3. Extract the full question text, all available options, and the correct answer.
              4. If the correct answer is not explicitly stated in the text, use your medical expertise to determine the most likely correct answer from the options.
              5. Provide a detailed medical explanation for why that answer is correct, even if you have to write it yourself.
              6. Categorize the question into a specific medical sub-topic (e.g., Cardiology, Neurology, Pediatrics, Anatomy, Biochemistry, Pathology, Pharmacology, Microbiology, Psychiatry, Obstetrics & Gynecology).
              7. Identify the source book if mentioned, otherwise use "General Medical Reference".
              
              Text to process:
              ${text}
              `
            }
          ]
        }
      ],
      config: {
        systemInstruction: `You are an expert medical educator and data extraction specialist. 
        Your goal is to perform a high-recall extraction of all MCQs from the provided text. 
        
        CRITICAL RULES:
        - DO NOT SKIP ANY QUESTIONS. 
        - DO NOT SUMMARIZE. 
        - DO NOT STOP UNTIL EVERY QUESTION IN THE TEXT IS EXTRACTED.
        - RECONSTRUCT jumbled text: If the PDF extraction jumbled the options or question text, use your medical knowledge to fix the grammar and structure.
        - CASE STUDIES: If a clinical vignette is followed by multiple questions, prepend the vignette to each question's text so each MCQ is self-contained.
        - Always return a valid JSON array of objects.
        - Each object must have: text, options (array), correctAnswer (string), explanation (string), topic (string), book (string).
        - Ensure the 'correctAnswer' matches one of the strings in the 'options' array exactly.
        - If you find 0 questions, return an empty array [].`,
        responseMimeType: "application/json",
        maxOutputTokens: 8192, // Increased for more questions per chunk
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The full question text" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of all available options"
              },
              correctAnswer: { type: Type.STRING, description: "The full text of the correct option (must match one of the options)" },
              explanation: { type: Type.STRING, description: "Detailed medical explanation" },
              topic: { type: Type.STRING, description: "Medical sub-topic" },
              book: { type: Type.STRING, description: "Source book title" }
            },
            required: ["text", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (e: any) {
    console.error(`Gemini extraction attempt ${retryCount + 1} failed:`, e);
    
    // Retry up to 2 times for transient errors
    if (retryCount < 2) {
      const waitTime = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return extractMCQsFromText(text, retryCount + 1);
    }
    
    return [];
  }
}

export async function analyzeWeakAreas(
  examResult: { 
    score: number; 
    total: number; 
    subjects: string[]; 
    wrongQuestions: { text: string; topic: string; explanation: string }[] 
  }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY1;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY1") {
    return "Analysis unavailable: API key not configured.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    As a medical education expert, analyze this mock exam result and provide a concise, encouraging, and actionable feedback.
    
    Score: ${examResult.score}% (${examResult.total} questions)
    Subjects covered: ${examResult.subjects.join(', ')}
    
    Wrong Questions & Topics:
    ${examResult.wrongQuestions.map((q, i) => `${i+1}. Topic: ${q.topic}\nQuestion: ${q.text}\nExplanation: ${q.explanation}`).join('\n\n')}
    
    Please provide:
    1. A summary of the overall performance.
    2. Identification of 2-3 specific weak areas based on the wrong questions.
    3. Actionable study recommendations for those weak areas.
    
    Keep the response professional, supportive, and formatted in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Could not generate analysis at this time.";
  } catch (error) {
    console.error("Error analyzing weak areas:", error);
    return "Analysis unavailable due to a technical error.";
  }
}
