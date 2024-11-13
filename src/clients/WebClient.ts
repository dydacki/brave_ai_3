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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async post<TData extends Record<string, any>, TResponse = string>(
    endpoint: string,
    data: TData,
    asUrlEncoded: boolean = false,
  ): Promise<TResponse> {
    const headers: Record<string, string> = {};
    let body: string;

    if (asUrlEncoded) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = this.urlEncodeData(data);
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const response = await fetch(this.getFullUrl(endpoint), {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return asUrlEncoded ? (response.text() as TResponse) : response.json();
  }
}
