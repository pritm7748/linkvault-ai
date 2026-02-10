import { GoogleGenerativeAI, Schema } from '@google/generative-ai';

// 1. Load Keys
const keys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter((k): k is string => !!k && k.length > 0);

if (keys.length === 0) {
  throw new Error("No GEMINI_API_KEY found in environment variables.");
}

// 2. Helper: Generate Content with Failover
export async function generateContentWithFallback(
  modelName: string,
  config: any,
  promptParts: any[]
) {
  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const model = genAI.getGenerativeModel({ 
        model: modelName, 
        generationConfig: config 
      });

      // Try generating
      const result = await model.generateContent(promptParts);
      return result; // Success!

    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('overloaded');
      
      if (isRateLimit) {
        console.warn(`Gemini Key ${i + 1} hit rate limit. Switching to Key ${i + 2}...`);
      } else {
        console.error(`Gemini Key ${i + 1} error:`, error.message);
      }
      
      lastError = error;
      // If not rate limited, maybe we shouldn't retry? 
      // But for robustness, we'll continue to the next key anyway.
    }
  }

  throw lastError || new Error("All Gemini API keys failed.");
}

// 3. Helper: Embed Content with Failover
export async function embedContentWithFallback(
  text: string
) {
  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-005" });
      
      const result = await embeddingModel.embedContent(text);
      return result;

    } catch (error: any) {
      console.warn(`Gemini Embedding Key ${i + 1} failed. Switching...`);
      lastError = error;
    }
  }

  throw lastError || new Error("All Gemini API keys failed for embedding.");
}