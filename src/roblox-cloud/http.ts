import axios, { AxiosError, AxiosInstance } from 'axios';
import { OpenCloudConfig, redact } from './config.js';

export type HttpClient = AxiosInstance;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeDelay(attempt: number, base = 300): number {
  const jitter = Math.floor(Math.random() * 100);
  return Math.min(5000, base * Math.pow(2, attempt)) + jitter;
}

export function createHttpClient(cfg: OpenCloudConfig): HttpClient {
  const instance = axios.create({
    baseURL: 'https://apis.roblox.com',
    timeout: cfg.timeoutMs,
    headers: {
      'x-api-key': cfg.apiKey,
      'content-type': 'application/json',
      'user-agent': 'roblox-ts-mcp/1.0 (+OpenCloud)'
    },
    validateStatus: () => true, // we handle non-2xx manually
  });

  instance.interceptors.request.use((req) => {
    // Never log secrets; redact if needed
    if (req.headers) {
      const key = req.headers['x-api-key'] as string | undefined;
      if (key) req.headers['x-api-key'] = key; // ensure header present, but don't log
    }
    return req;
  });

  instance.interceptors.response.use(
    async (res) => {
      // Handle 429/5xx retries here for idempotent GET/PUT
  const method = (res.config.method || 'get').toUpperCase();
  const idempotent = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  const shouldRetry = (status: number) => status === 429 || (status >= 500 && status <= 599);
  if (idempotent && shouldRetry(res.status)) {
        const attempt = ((res.config as any).__retryCount || 0) as number;
        if (attempt < cfg.maxRetries) {
          (res.config as any).__retryCount = attempt + 1;
          const retryAfterHeader = res.headers['retry-after'];
          const retryAfter = retryAfterHeader ? Number(retryAfterHeader) * 1000 : computeDelay(attempt);
          await sleep(retryAfter);
          return instance.request(res.config);
        }
      }

      if (res.status < 200 || res.status >= 300) {
        const requestId = res.headers['x-request-id'] || res.headers['roblox-id'] || undefined;
        const safeMsg = `Open Cloud error ${res.status}${requestId ? ` (req ${requestId})` : ''}`;
        const error = new Error(safeMsg) as AxiosError & { status?: number; data?: any };
        (error as any).status = res.status;
        (error as any).data = res.data;
        throw error;
      }

      return res;
    },
    (error: AxiosError) => {
      // Network/timeouts
      const msg = `Open Cloud network error: ${error.message}`;
      const e = new Error(msg) as AxiosError & { status?: number };
      e.code = error.code;
      e.status = error.response?.status;
      throw e;
    }
  );

  return instance;
}
