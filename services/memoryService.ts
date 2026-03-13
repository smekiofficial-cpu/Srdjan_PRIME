import { GoogleGenAI, EmbedContentResponse } from '@google/genai';
import { openDB, IDBPDatabase } from 'idb';
import { MemoryEntry, SearchResult } from '../types';

const DB_NAME = 'srdjan_memory_db';
const STORE_NAME = 'memories';

class MemoryService {
  private db: Promise<IDBPDatabase>;
  private ai: GoogleGenAI;

  constructor() {
    // Note: process.env.API_KEY is injected by Vite config
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.API_KEY || ''
    });
    this.db = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  async addMemory(text: string, type: MemoryEntry['metadata']['type'] = 'interaction', context?: string) {
    try {
      const response = await this.ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      }) as any;
      
      const embedding = response.embedding?.values || response.embeddings?.[0]?.values;
      
      if (!embedding) {
        throw new Error('Failed to generate embedding');
      }

      const id = crypto.randomUUID();
      const entry: MemoryEntry = {
        id,
        text,
        embedding,
        metadata: {
          timestamp: Date.now(),
          type,
          context,
        },
      };

      const db = await this.db;
      await db.put(STORE_NAME, entry);
      return entry;
    } catch (error) {
      console.error('Error adding memory:', error);
      throw error;
    }
  }

  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: 'text-embedding-004',
        contents: query,
      }) as any;
      
      const queryEmbedding = response.embedding?.values || response.embeddings?.[0]?.values;

      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      const db = await this.db;
      const allEntries: MemoryEntry[] = await db.getAll(STORE_NAME);

      const results: SearchResult[] = allEntries.map(entry => ({
        entry,
        similarity: this.cosineSimilarity(queryEmbedding, entry.embedding),
      }));

      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching memory:', error);
      return [];
    }
  }

  async clearAll() {
    const db = await this.db;
    await db.clear(STORE_NAME);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const memoryService = new MemoryService();
