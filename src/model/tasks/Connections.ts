export interface User {
  id: string;
  username: string;
  access_level: string;
  is_active: string;
  lastlog: string;
}

export interface Connection {
  user1_id: string;
  user2_id: string;
}

export interface Response<T> {
  reply: T[];
  error: string;
}
