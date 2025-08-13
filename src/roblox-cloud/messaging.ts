import { HttpClient } from './http.js';
import { OpenCloudConfig } from './config.js';

export async function publish(
  http: HttpClient,
  cfg: OpenCloudConfig,
  topic: string,
  message: unknown
): Promise<{ success: true; id?: string } | { success: false; error: string }> {
  if (!topic || topic.length > 128) {
    return { success: false, error: 'Invalid topic' };
  }
  // Enforce JSON and a reasonable size limit (Roblox limit is 1 MB; keep well under)
  let body: string;
  try {
    body = typeof message === 'string' ? message : JSON.stringify(message);
  } catch {
    return { success: false, error: 'Message must be JSON-serializable' };
  }
  if (Buffer.byteLength(body, 'utf8') > 512 * 1024) {
    return { success: false, error: 'Message too large (>512KB)' };
  }

  const url = `/messaging-service/v1/universes/${cfg.universeId}/topics/${encodeURIComponent(topic)}`;
  const res = await http.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });
  const id = (res.headers?.['x-request-id'] as string | undefined) || undefined;
  return { success: true, id };
}
