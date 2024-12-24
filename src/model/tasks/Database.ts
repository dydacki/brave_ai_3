export interface Query {
  task: 'database';
  apikey: string;
  query: string;
}

export interface QueryResult<T> {
  reply: T;
  error: string;
}

interface User {
  id: string;
  username: string;
  access_level: string;
  is_active: string;
  lastlog: string;
}
