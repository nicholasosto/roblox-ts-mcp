---
project: Soul Steel
version: '1.0'
milestones:
  - id: M1
    title: Core Gameplay Foundation
  - id: M2
    title: Advanced Features
features:
  - id: F-ABILITY-CORE
    title: Core Ability System
    milestone: M1
    priority: P1
    acceptance:
      - Players can equip up to 4 abilities
      - Abilities have cooldowns and mana costs
      - Visual feedback for ability activation
    tasks:
      - id: T-ABILITY-001
        title: Create ability base class
        estimate: 5
      - id: T-ABILITY-002
        title: Implement cooldown system
        estimate: 3
      - id: T-ABILITY-003
        title: Add ability visual effects
        estimate: 5
  - id: F-INVENTORY-BASIC
    title: Basic Inventory System
    milestone: M1
    priority: P2
    acceptance:
      - Players can store and manage items
      - Drag and drop functionality
    tasks:
      - id: T-INVENTORY-001
        title: Create inventory UI
        estimate: 8
  - id: F-COMBAT-SYSTEM
    title: Advanced Combat System
    milestone: M2
    priority: P1
    acceptance:
      - Players can perform combo attacks
      - Damage calculation is balanced
      - Visual effects are polished
    tasks:
      - id: T-COMBAT-001
        title: Design combat mechanics
        estimate: 13
      - id: T-COMBAT-002
        title: Implement damage system
        estimate: 8
---

# Game Overview

Soul Steel is an action RPG that combines fast-paced combat with strategic ability management.

## Core Pillars

1. **Strategic Combat**: Players must carefully manage abilities and resources
2. **Character Progression**: Meaningful choices in character development
3. **Social Interaction**: Cooperative gameplay elements

## Features

### Ability System
The core ability system allows players to customize their playstyle through various magical and combat abilities.

### Inventory Management
A comprehensive inventory system for managing equipment, consumables, and quest items.

## Technical Requirements

- Built with Roblox-ts for type safety
- Uses @rbxts/fusion for reactive UI
- @rbxts/profile-store for data persistence


# Features

### Combat System
The advanced combat system will feature combo attacks, special abilities, and strategic resource management.

### Inventory System  
Players will have access to a comprehensive inventory system for managing equipment and consumables.