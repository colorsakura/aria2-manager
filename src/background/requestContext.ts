import type {
  RequestContextHeaders,
  RequestContextSettings
} from '../shared/types';

interface HeaderRecord {
  url: string;
  referer?: string;
  userAgent?: string;
  timestamp: number;
}

interface HeaderInput {
  url: string;
  requestHeaders?: Array<{ name: string; value?: string }>;
}

interface CookieLike {
  name: string;
  value: string;
}

export class RequestContextTracker {
  private records = new Map<string, HeaderRecord>();

  constructor(
    private readonly getCookies: (url: string) => Promise<CookieLike[]>,
    private readonly ttlMs = 30_000
  ) {}

  recordHeaders(details: HeaderInput): void {
    const referer = findHeader(details.requestHeaders, 'referer');
    const userAgent = findHeader(details.requestHeaders, 'user-agent');

    if (!referer && !userAgent) {
      return;
    }

    this.records.set(details.url, {
      url: details.url,
      referer,
      userAgent,
      timestamp: Date.now()
    });

    this.prune();
  }

  async collect(
    url: string,
    settings: RequestContextSettings
  ): Promise<RequestContextHeaders> {
    this.prune();

    const record = this.records.get(url);
    const headers: RequestContextHeaders = {};

    if (settings.sendReferer && record?.referer) {
      headers.referer = record.referer;
    }

    if (settings.sendUserAgent && record?.userAgent) {
      headers.userAgent = record.userAgent;
    }

    if (settings.sendCookies) {
      const cookies = await this.getCookies(url);
      if (cookies.length > 0) {
        headers.cookie = cookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join('; ');
      }
    }

    return headers;
  }

  private prune(): void {
    const cutoff = Date.now() - this.ttlMs;
    for (const [url, record] of this.records.entries()) {
      if (record.timestamp < cutoff) {
        this.records.delete(url);
      }
    }
  }
}

function findHeader(
  headers: HeaderInput['requestHeaders'],
  name: string
): string | undefined {
  return headers?.find(
    (header) => header.name.toLowerCase() === name.toLowerCase()
  )?.value;
}
