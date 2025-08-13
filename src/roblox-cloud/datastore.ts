import { HttpClient } from './http.js';
import { OpenCloudConfig } from './config.js';

// Minimal types resembling Open Cloud responses
export interface ListDatastoresResponse {
  datastores: { name: string }[];
  nextPageToken?: string;
}

export async function listDatastores(
  http: HttpClient,
  cfg: OpenCloudConfig,
  opts?: { prefix?: string; limit?: number }
): Promise<{ success: true; datastores: string[] } | { success: false; error: string }> {
  const params: Record<string, string | number> = {};
  if (opts?.prefix) params.prefix = opts.prefix;
  if (opts?.limit) params.limit = Math.min(Math.max(opts.limit, 1), 100);

  const url = `/datastores/v1/universes/${cfg.universeId}/standard-datastores`; // GET
  const res = await http.get<ListDatastoresResponse>(url, { params });
  return { success: true, datastores: (res.data.datastores || []).map((d) => d.name) };
}

export interface EntryResponse<T = unknown> {
  value: T;
  etag?: string;
}

export async function getEntry<T = unknown>(
  http: HttpClient,
  cfg: OpenCloudConfig,
  datastoreName: string,
  key: string,
  scope?: string
): Promise<{ success: true; data: EntryResponse<T> } | { success: false; error: string }> {
  const url = `/datastores/v1/universes/${cfg.universeId}/standard-datastores/datastore/${encodeURIComponent(
    datastoreName
  )}/entries/entry`;

  const res = await http.get(url, {
    params: { key, scope: scope ?? cfg.defaultScope ?? 'global' },
    headers: { Accept: 'application/json' },
  });

  const etag = (res.headers?.etag as string | undefined) || undefined;
  let value: any = res.data;
  // Axios parses JSON by default; in case of string body, try to JSON.parse
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      // keep as string
    }
  }
  return { success: true, data: { value, etag } };
}

export interface SetOptions {
  scope?: string;
  ifMatch?: string; // ETag precondition
  ifNoneMatch?: '*' | string; // typically '*'
}

export async function setEntry(
  http: HttpClient,
  cfg: OpenCloudConfig,
  datastoreName: string,
  key: string,
  value: unknown,
  options?: SetOptions
): Promise<{ success: true; etag?: string } | { success: false; error: string }> {
  const url = `/datastores/v1/universes/${cfg.universeId}/standard-datastores/datastore/${encodeURIComponent(
    datastoreName
  )}/entries/entry`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (options?.ifMatch) headers['If-Match'] = options.ifMatch;
  if (options?.ifNoneMatch) headers['If-None-Match'] = options.ifNoneMatch;

  const body = typeof value === 'string' ? value : JSON.stringify(value);
  const res = await http.post(url, body, {
    params: { key, scope: options?.scope ?? cfg.defaultScope ?? 'global' },
    headers,
  });
  const etag = (res.headers?.etag as string | undefined) || undefined;
  return { success: true, etag };
}
