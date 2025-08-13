import { z } from 'zod';

// Zod schema for environment configuration
const EnvSchema = z.object({
  ROBLOX_API_KEY: z.string().min(1, 'ROBLOX_API_KEY is required'),
  ROBLOX_UNIVERSE_ID: z.string().min(1, 'ROBLOX_UNIVERSE_ID is required'),
  ROBLOX_SCOPE: z.string().optional(),
  ROBLOX_HTTP_TIMEOUT_MS: z
    .string()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().positive().optional())
    .optional(),
  ROBLOX_MAX_RETRIES: z
    .string()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(0).max(8).optional())
    .optional(),
});

export type OpenCloudConfig = {
  apiKey: string;
  universeId: string;
  defaultScope?: string;
  timeoutMs: number;
  maxRetries: number;
};

export function loadConfigFromEnv(env = process.env): OpenCloudConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid Open Cloud configuration: ${message}`);
  }

  const { ROBLOX_API_KEY, ROBLOX_UNIVERSE_ID, ROBLOX_SCOPE, ROBLOX_HTTP_TIMEOUT_MS, ROBLOX_MAX_RETRIES } =
    parsed.data as any;

  return {
    apiKey: ROBLOX_API_KEY,
    universeId: ROBLOX_UNIVERSE_ID,
    defaultScope: ROBLOX_SCOPE,
    timeoutMs: ROBLOX_HTTP_TIMEOUT_MS ?? 15000,
    maxRetries: ROBLOX_MAX_RETRIES ?? 3,
  };
}

export function redact(value: string | undefined): string {
  if (!value) return '';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}
