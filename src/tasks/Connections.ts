import {Task} from './Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import {Neo4jClient} from '@clients/Neo4jClient';
import type {Response, User, Connection} from '@model/tasks/Connections';
import type {Query} from '@model/tasks/Database';
import type {Json, JsonResponse} from '@model/tasks/Task';

export class Connections extends Task {
  private readonly openAiClient: OpenAiClient;
  private readonly neo4jClient: Neo4jClient;

  private readonly apiKey: string = process.env.AI_DEVS_API_KEY as string;

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
    this.neo4jClient = new Neo4jClient(
      process.env.NEO4J_URI as string,
      process.env.NEO4J_USERNAME as string,
      process.env.NEO4J_PASSWORD as string,
      this.openAiClient,
    );
  }

  async perform(): Promise<void> {
    try {
      const [users, connections] = await this.getDatabaseUsers();
      await this.setupGraphDatabase(users, connections);
      const path = await this.findShortestPath('Rafał', 'Barbara');
      await this.sendResponse(path);
    } catch (error) {
      console.error(error);
    }
  }

  async getDatabaseUsers(): Promise<[User[], Connection[]]> {
    const users = await this.getDatabaseContent<User>('SELECT * FROM users');
    const connections = await this.getDatabaseContent<Connection>('SELECT * FROM connections');
    return [users, connections];
  }

  private async setupGraphDatabase(users: User[], connections: Connection[]): Promise<void> {
    await this.neo4jClient.createVectorIndex('user_embedding_index', 'User', 'embedding', 3072);
    await this.neo4jClient.waitForIndexToBeOnline('user_embedding_index');

    for (const user of users) {
      await this.neo4jClient.addNode('User', user);
    }

    for (const connection of connections) {
      const fromUser = await this.neo4jClient.findNodeByProperty('User', 'id', connection.user1_id);
      const toUser = await this.neo4jClient.findNodeByProperty('User', 'id', connection.user2_id);

      if (fromUser && toUser) {
        await this.neo4jClient.connectNodes(fromUser.id, toUser.id, 'KNOWS');
        console.log(
          `Connected ${fromUser.id} (${fromUser.properties.username}) to ${toUser.id} (${toUser.properties.username})`,
        );
      }
    }
  }

  private async getDatabaseContent<T>(query: string): Promise<T[]> {
    const restResponse = await this.getQueryResult(query);
    const response = restResponse as Response<T>;
    return response.reply;
  }

  private async sendResponse(path: string[]): Promise<void> {
    console.log('Found path:', path);
    const json = this.createJson(path.join(', '), 'connections');
    const taskResponse = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
    console.log(taskResponse);
  }

  private async getQueryResult(query: string): Promise<any> {
    const url = '/apidb';
    const payload: Query = {task: 'database', apikey: this.apiKey, query};
    const response = await this.webClient.post<Query, any>(url, payload);
    return response;
  }

  private async findShortestPath(fromUsername: string, toUsername: string): Promise<string[]> {
    const result = await this.neo4jClient.runQuery(
      `
      MATCH (start:User {username: $fromUsername}),
            (end:User {username: $toUsername}),
            path = shortestPath((start)-[:KNOWS*]-(end))
      RETURN [node IN nodes(path) | node.username] as usernames
    `,
      {fromUsername, toUsername},
    );

    return result.records[0]?.get('usernames') || [];
  }
}
