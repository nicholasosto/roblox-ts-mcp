/**
 * @file key-meta-catalog.ts
 *
 * This document provides context and TypeScript examples for LLM-driven pattern generation in Roblox-ts MCP projects.
 *
 * ## Purpose
 * - Serves as a reference for Model Context Protocol (MCP) pattern generation.
 * - Contains key metadata and catalog entries to guide LLMs in producing accurate, idiomatic Roblox-ts code.
 * - Demonstrates best practices for type safety, modularity, and integration with @rbxts libraries.
 *
 * ## Usage
 * - Used by the MCP server and LLMs to generate, validate, and suggest code patterns.
 * - Reference for developers seeking examples of key catalog structures and metadata annotation.
 *
 * ## Pattern Requirements (non‑negotiable)
 * The following constructs are required for this pattern and MUST NOT be renamed or structurally altered.
 * Generators and validators expect this exact shape:
 *
 * 1) KEYS: `export const CATALOG_KEYS = [...] as const;`
 *    - Readonly array literal with `as const` for literal types.
 * 2) Key Type: `export type CatalogKey = typeof CATALOG_KEYS[number];`
 *    - Derived union from the KEYS constant (no alternate derivations).
 * 3) Meta Interface: `export interface CatalogMeta { key: CatalogKey; description: string; icon: string; maxValue: number; minValue: number; }`
 *    - Core fields above are required. Additional fields are allowed but MUST NOT remove or rename core fields.
 * 4) Catalog Map: `export const CATALOG_META = { ... } satisfies Record<CatalogKey, CatalogMeta>;`
 *    - Must include all keys from `CATALOG_KEYS`.
 *    - The `satisfies Record<CatalogKey, CatalogMeta>` clause is REQUIRED to enforce exhaustiveness and type safety.
 *
 * Any architectural deviation (renaming, moving to different sources, or changing the derivation) will break LLM and tool assumptions.
 *
 * @see https://modelcontextprotocol.io/llms-full.txt
 */

// Key catalog entry: Provides a canonical example for LLMs to understand metadata structure and usage in Roblox-ts pattern generation.

/* REQUIRED: KEYS — Do NOT rename this constant or remove `as const`. */
export const CATALOG_KEYS = ["EXAMPLE_KEY_1", "EXAMPLE_KEY_2", "EXAMPLE_KEY_3"] as const;
/* REQUIRED: Key type — must be derived from CATALOG_KEYS; do NOT change derivation style. */
export type CatalogKey = typeof CATALOG_KEYS[number];

/* REQUIRED: Meta interface — core fields are mandatory; add fields only in an additive, backward-compatible way. */
export interface CatalogMeta {
    key: CatalogKey;
    description: string;
    icon: string; // URL or asset ID for an icon representing the key
    maxValue: number; // Maximum value for the key example
    minValue: number; // Minimum value for the key example
}

/* REQUIRED: Catalog map — must cover ALL keys and MUST use `satisfies Record<CatalogKey, CatalogMeta>`. */
export const CATALOG_META: Record<CatalogKey, CatalogMeta> = {
    EXAMPLE_KEY_1: {
        key: "EXAMPLE_KEY_1",
        description: "An example key for demonstration purposes.",
        icon: "rbxassetid://123456789",
        maxValue: 100,
        minValue: 0,
    },
    EXAMPLE_KEY_2: {
        key: "EXAMPLE_KEY_2",
        description: "Another example key for demonstration purposes.",
        icon: "rbxassetid://987654321",
        maxValue: 200,
        minValue: 50,
    },
    EXAMPLE_KEY_3: {
        key: "EXAMPLE_KEY_3",
        description: "Yet another example key for demonstration purposes.",
        icon: "rbxassetid://456789123",
        maxValue: 300,
        minValue: 100,
    },
} satisfies Record<CatalogKey, CatalogMeta>;
