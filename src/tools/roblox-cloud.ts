import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { loadConfigFromEnv } from '../roblox-cloud/config.js';
import { createHttpClient } from '../roblox-cloud/http.js';
import { listDatastores, getEntry, setEntry } from '../roblox-cloud/datastore.js';
import { publish } from '../roblox-cloud/messaging.js';

const DsListSchema = z.object({
  prefix: z.string().min(1).max(100).optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
});

const DsGetSchema = z.object({
  datastoreName: z.string().min(1),
  key: z.string().min(1),
  scope: z.string().min(1).optional(),
});

const DsSetSchema = z.object({
  datastoreName: z.string().min(1),
  key: z.string().min(1),
  value: z.any(),
  scope: z.string().min(1).optional(),
  ifMatch: z.string().min(1).optional(),
  ifNoneMatch: z.union([z.literal('*'), z.string().min(1)]).optional(),
});

const MsgPublishSchema = z.object({
  topic: z.string().min(1).max(128),
  message: z.any(),
});

export function registerRobloxCloudTools(server: Server) {
  // Note: Using SDK setRequestHandler in tools.ts, so here we expose a helper to register tools via ListTools/CallTool.
  // For convenience, we can also register using addTool if available; but current pattern relies on tools.ts.
}

// Helper exports for tools.ts registration
export const RobloxCloudToolDefinitions = [
  {
    name: 'robloxcloud-ds-list',
    description: 'List DataStores in the configured Roblox universe (Open Cloud)',
    inputSchema: {
      type: 'object',
      properties: {
        prefix: { type: 'string', description: 'Optional prefix filter' },
        limit: { type: 'number', description: 'Max items, 1-100' },
      },
    },
  },
  {
    name: 'robloxcloud-ds-get',
    description: 'Get a DataStore entry value',
    inputSchema: {
      type: 'object',
      properties: {
        datastoreName: { type: 'string', description: 'DataStore name' },
        key: { type: 'string', description: 'Entry key' },
        scope: { type: 'string', description: 'Optional scope (default: global or ROBLOX_SCOPE)' },
      },
      required: ['datastoreName', 'key'],
    },
  },
  {
    name: 'robloxcloud-ds-set',
    description: 'Set a DataStore entry value (JSON)',
    inputSchema: {
      type: 'object',
      properties: {
        datastoreName: { type: 'string', description: 'DataStore name' },
        key: { type: 'string', description: 'Entry key' },
        value: { type: 'object', description: 'JSON-serializable value' },
        scope: { type: 'string', description: 'Optional scope' },
        ifMatch: { type: 'string', description: 'Optional ETag precondition (If-Match)' },
        ifNoneMatch: { type: 'string', description: "Optional If-None-Match ('*' or ETag)" },
      },
      required: ['datastoreName', 'key', 'value'],
    },
  },
  {
    name: 'robloxcloud-msg-publish',
    description: 'Publish a message to a topic via MessagingService',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic name' },
        message: { type: 'object', description: 'JSON-serializable payload' },
      },
      required: ['topic', 'message'],
    },
  },
] as const;

export async function handleRobloxCloudTool(name: string, args: unknown) {
  switch (name) {
    case 'robloxcloud-ds-list': {
      const parsed = DsListSchema.parse(args);
      const cfg = loadConfigFromEnv();
      const http = createHttpClient(cfg);
      const result = await listDatastores(http, cfg, parsed);
      if (result.success) {
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      throw new McpError(ErrorCode.InternalError, result.error);
    }
    case 'robloxcloud-ds-get': {
      const parsed = DsGetSchema.parse(args);
      const cfg = loadConfigFromEnv();
      const http = createHttpClient(cfg);
      const result = await getEntry(http, cfg, parsed.datastoreName, parsed.key, parsed.scope);
      if (result.success) {
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      throw new McpError(ErrorCode.InternalError, result.error);
    }
    case 'robloxcloud-ds-set': {
      const parsed = DsSetSchema.parse(args);
      const cfg = loadConfigFromEnv();
      const http = createHttpClient(cfg);
      const result = await setEntry(http, cfg, parsed.datastoreName, parsed.key, parsed.value, {
        scope: parsed.scope,
        ifMatch: parsed.ifMatch,
        ifNoneMatch: parsed.ifNoneMatch as any,
      });
      if (result.success) {
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      throw new McpError(ErrorCode.InternalError, result.error);
    }
    case 'robloxcloud-msg-publish': {
      const parsed = MsgPublishSchema.parse(args);
      const cfg = loadConfigFromEnv();
      const http = createHttpClient(cfg);
      const result = await publish(http, cfg, parsed.topic, parsed.message);
      if (result.success) {
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      throw new McpError(ErrorCode.InternalError, result.error);
    }
    default:
      return undefined;
  }
}
