/**
 * @file attributes-catalog.ts
 * Attributes Catalog pattern example for Roblox-ts MCP.
 *
 * REQUIRED constructs (names/derivations MUST NOT change):
 * - export const CATALOG_KEYS = [...] as const
 * - export type CatalogKey = typeof CATALOG_KEYS[number]
 * - export interface CatalogMeta { ... }
 * - export const CATALOG_META = { ... } satisfies Record<CatalogKey, CatalogMeta>
 */

/* REQUIRED: KEYS */
export const CATALOG_KEYS = ["HEALTH", "STAMINA", "MANA", "IS_NPC"] as const;

/* REQUIRED: Key type */
export type CatalogKey = typeof CATALOG_KEYS[number];

// Supported types for attributes
export type AttributeType = 'number' | 'string' | 'boolean' | 'Vector3' | 'Color3';

/* REQUIRED: Meta interface */
export interface CatalogMeta {
  key: CatalogKey;
  attribute: string; // actual Instance attribute name
  description: string;
  type: AttributeType;
  default: number | string | boolean | Vector3 | Color3;
  min?: number; // only for number
  max?: number; // only for number
  replicate?: boolean;
}

/* REQUIRED: Catalog map */
export const CATALOG_META = {
  HEALTH: {
    key: "HEALTH",
    attribute: "Health",
    description: "Current health points for a character or entity.",
    type: 'number',
    default: 100,
    min: 0,
    max: 100,
    replicate: true,
  },
  STAMINA: {
    key: "STAMINA",
    attribute: "Stamina",
    description: "Energy used for sprinting and actions.",
    type: 'number',
    default: 50,
    min: 0,
    max: 100,
    replicate: true,
  },
  MANA: {
    key: "MANA",
    attribute: "Mana",
    description: "Resource for casting abilities.",
    type: 'number',
    default: 0,
    min: 0,
    max: 100,
    replicate: true,
  },
  IS_NPC: {
    key: "IS_NPC",
    attribute: "IsNPC",
    description: "Marks a character as an NPC.",
    type: 'boolean',
    default: false,
    replicate: true,
  },
} satisfies Record<CatalogKey, CatalogMeta>;
