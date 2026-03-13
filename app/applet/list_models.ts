import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });

async function main() {
  const response = await ai.models.list();
  for await (const model of response) {
    if (model.name.includes('embed')) {
      console.log(model.name);
    }
  }
}

main().catch(console.error);
