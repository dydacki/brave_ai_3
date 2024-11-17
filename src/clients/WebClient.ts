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

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(this.getFullUrl(endpoint));
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json();
  }

  async post<T extends Record<string, any>, V>(endpoint: string, data: T, asUrlEncoded: boolean = false): Promise<V> {
    const headers: Record<string, string> = {};
    let body: string;

    headers['Content-Type'] = asUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json';
    body = asUrlEncoded ? this.urlEncodeData(data) : JSON.stringify(data);

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
