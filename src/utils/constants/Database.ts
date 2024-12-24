import type {ChatCompletionMessageParam, ChatCompletionTool} from 'openai/resources/chat/completions';

export const messages: ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content:
      'You are a SQL database expert creating database queries. ' +
      'You are given a set of functions returning table schemas and contents and a question. ' +
      'You need to create a SQL query that answers the question. ' +
      'You then need use this query to return the data from the database. ' +
      'Return the first response from the query to a user. Return it a FORMAT OF JSON ARRAY OF IDS, WITHOUT ADDING ANYTHING ELSE.',
  },
  {
    role: 'user',
    content: 'Które aktywne datacenter (DC_ID) są zarządzane przez pracowników, którzy są na urlopie (is_active=0)?',
  },
];

export const functions: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getTables',
      description: 'Get the json array containing name of all tables in the database',
      strict: true,
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTableSchema',
      parameters: {
        type: 'object',
        properties: {
          tableName: {
            type: 'string',
            enum: ['users', 'connections', 'datacenters', 'correct_order'],
          },
        },
        required: ['tableName'],
        additionalProperties: false,
      },
      description:
        'Get the json object containing the name and the "CREATE TABLE" statement of the table, containing all columns, their types and their constraints and null values',
      strict: true,
    },
  },
  {
    type: 'function',
    function: {
      name: 'getQueryResult',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      description: 'gets the contents of the table',
      strict: true,
    },
  },
];
