import {QdrantClient} from '@qdrant/js-client-rest';
import {OpenAiClient} from './OpenAiClient';
import {type Point} from '@model/tasks/Vectors';

export class QuadrantClient {
  private qdrant: QdrantClient;
  private openAiClient: OpenAiClient;

  constructor(url: string) {
    this.qdrant = new QdrantClient({url: url});
    this.openAiClient = new OpenAiClient();
  }

  async ensureCollection(collectionName: string): Promise<{name: string} | undefined> {
    try {
      let collection = await this.findCollection(collectionName);
      if (!collection) {
        await this.qdrant.createCollection(collectionName, {
          vectors: {size: 3072, distance: 'Cosine'},
        });
      }

      return collection;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  async upsert(collectionName: string, data: Point[]): Promise<void> {
    const pointsToUpsert = await Promise.all(
      data.map(async point => {
        const embedding = await this.openAiClient.createEmbedding(point.text);
        return {
          id: point.id,
          vector: embedding,
          payload: {text: point.text, fileName: point.fileName},
        };
      }),
    );

    for (const point of pointsToUpsert) {
      try {
        await this.qdrant.upsert(collectionName, {wait: true, points: [point]});
      } catch (error) {
        console.error('Error upserting point:', error);
        throw error;
      }
    }
  }

  async ensureDeleted(collectionName: string): Promise<void> {
    const collection = await this.findCollection(collectionName);
    if (collection) {
      await this.qdrant.deleteCollection(collectionName);
    }
  }

  private async findCollection(collectionName: string): Promise<{name: string} | undefined> {
    const result = await this.qdrant.getCollections();
    return result.collections.find(collection => collection.name === collectionName);
  }

  async performSearch(collectionName: string, queryEmbedding: number[], limit: number = 1): Promise<any[]> {
    return this.qdrant.search(collectionName, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    });
  }
}
