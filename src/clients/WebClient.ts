export class WebClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private getFullUrl(endpoint: string): string {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${path}`;
  }

  private urlEncodeData(data: Record<string, any>): string {
    return Object.entries(data)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  async get<T>(endpoint: string, responseType: 'buffer' | 'string' | 'json' = 'json'): Promise<T> {
    const response = await fetch(this.getFullUrl(endpoint));
    if (!response.ok) {
      throw new Error(await response.text());
    }

    if (responseType === 'buffer') {
      return response.arrayBuffer() as Promise<T>;
    } else if (responseType === 'string') {
      return response.text() as Promise<T>;
    } else {
      return response.json() as Promise<T>;
    }
  }

  async post<T extends Record<string, any>, V>(endpoint: string, data: T, asUrlEncoded: boolean = false): Promise<V> {
    const headers = {'Content-Type': asUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json'};
    const body: string = asUrlEncoded ? this.urlEncodeData(data) : JSON.stringify(data);
    const response = await fetch(this.getFullUrl(endpoint), {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (asUrlEncoded ? response.text() : response.json()) as V;
  }
}
