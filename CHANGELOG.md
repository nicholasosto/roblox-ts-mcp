# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-09

### Added
- **Game Design Document (GDD) Manager Tool**: Comprehensive tool for managing structured game design documents
  - Read and parse GDD files with YAML frontmatter and Markdown content
  - Feature management with milestones, priorities, and acceptance criteria
  - Task management with estimates and feature association
  - Content section updates with append/prepend/replace operations
  - Comprehensive validation for structure and references
  - Export functionality in Markdown, JSON, and CSV formats
  - Query operations for milestones, features, and tasks with filtering
- Documentation search and summarization tools for official Roblox docs
- Enhanced package assistance tools for @rbxts ecosystem
- Comprehensive test suites for all new functionality

### Enhanced
- Improved tool organization with modular architecture
- Updated documentation with detailed usage guides
- Enhanced error handling and validation across all tools

### Dependencies
- Added `js-yaml` for YAML parsing in GDD manager
- Added `@types/js-yaml` for TypeScript support

## [1.0.3] - Previous Release
- Core Roblox-ts development tools
- Syntax validation and pattern generation
- Build simulation and basic package assistance
