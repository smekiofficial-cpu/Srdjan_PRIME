import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });

async function main() {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: 'Hello world',
    });
    console.log(JSON.stringify(response, null, 2));
  } catch (e) {
    console.error(e);
  }
}

main();
