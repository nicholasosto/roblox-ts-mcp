# Test: attributes-catalog pattern

This test ensures the MCP `generate-pattern` tool can produce an Attributes Catalog pattern.

Expected output highlights:
- Generated Pattern header for `attributes-catalog`
- Dependencies section present (likely none)
- Code block containing:
  - `export const CATALOG_KEYS` with keys like HEALTH, STAMINA, MANA, IS_NPC
  - `export type CatalogKey = typeof CATALOG_KEYS[number];`
  - `export interface CatalogMeta { ... }`
  - `export const CATALOG_META = { ... } satisfies Record<CatalogKey, CatalogMeta>;`
