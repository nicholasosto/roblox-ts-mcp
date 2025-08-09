# Game Design Document (GDD) Manager Tool

## Overview

The GDD Manager tool provides comprehensive functionality for managing Game Design Documents with structured YAML frontmatter and Markdown content. It enables game developers to maintain organized project documentation with milestones, features, tasks, and acceptance criteria.

## Features

- **Structured Document Management**: Read, update, and validate GDD files with YAML frontmatter
- **Feature & Task Management**: Add, update, and query features and tasks
- **Milestone Tracking**: Organize features by development milestones
- **Content Management**: Update specific sections of document content
- **Validation**: Comprehensive structure and reference validation
- **Export & Reporting**: Generate summaries in multiple formats (Markdown, JSON, CSV)

## GDD File Structure

```markdown
---
project: Project Name
version: "1.0"
milestones:
  - id: M1
    title: Core Features
  - id: M2
    title: Polish & Launch
features:
  - id: F-FEATURE-001
    title: Feature Name
    milestone: M1
    priority: P1
    acceptance:
      - "Acceptance criteria 1"
      - "Acceptance criteria 2"
    tasks:
      - id: T-TASK-001
        title: Task description
        estimate: 5
---

# Document Content

Regular Markdown content follows...
```

## Available Actions

### 1. `read`
Read and parse the entire GDD structure.

**Parameters:**
- `file_path` (required): Path to the GDD file

**Example:**
```json
{
  "action": "read",
  "file_path": "game_design.md"
}
```

### 2. `update_frontmatter`
Update YAML frontmatter metadata.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `updates` (required): Object containing frontmatter fields to update

**Example:**
```json
{
  "action": "update_frontmatter",
  "file_path": "game_design.md",
  "updates": {
    "version": "1.1",
    "milestones": [
      {"id": "M1", "title": "Updated Milestone"}
    ]
  }
}
```

### 3. `update_content`
Update specific sections of the Markdown content.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `section` (required): Section header to update
- `content` (required): New content for the section
- `operation` (optional): How to modify content (`replace`, `append`, `prepend`)

**Example:**
```json
{
  "action": "update_content",
  "file_path": "game_design.md",
  "section": "Game Overview",
  "content": "Updated game description...",
  "operation": "replace"
}
```

### 4. `add_feature`
Add a new feature to the GDD.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `feature` (required): Feature object with required fields

**Example:**
```json
{
  "action": "add_feature",
  "file_path": "game_design.md",
  "feature": {
    "id": "F-NEW-FEATURE",
    "title": "New Feature",
    "milestone": "M1",
    "priority": "P2",
    "acceptance": ["Feature works correctly"],
    "tasks": [
      {
        "id": "T-NEW-001",
        "title": "Implement feature",
        "estimate": 8
      }
    ]
  }
}
```

### 5. `update_feature`
Modify an existing feature.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `feature_id` (required): ID of the feature to update
- `updates` (required): Fields to update

**Example:**
```json
{
  "action": "update_feature",
  "file_path": "game_design.md",
  "feature_id": "F-EXISTING-FEATURE",
  "updates": {
    "priority": "P1",
    "acceptance": ["Updated criteria"]
  }
}
```

### 6. `add_task`
Add a task to an existing feature.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `feature_id` (required): ID of the feature to add the task to
- `task` (required): Task object

**Example:**
```json
{
  "action": "add_task",
  "file_path": "game_design.md",
  "feature_id": "F-EXISTING-FEATURE",
  "task": {
    "id": "T-NEW-TASK",
    "title": "New task description",
    "estimate": 3
  }
}
```

### 7. `update_task`
Modify an existing task.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `task_id` (required): ID of the task to update
- `updates` (required): Fields to update

**Example:**
```json
{
  "action": "update_task",
  "file_path": "game_design.md",
  "task_id": "T-EXISTING-TASK",
  "updates": {
    "title": "Updated task description",
    "estimate": 5
  }
}
```

### 8. `query_milestones`
Get milestone information with optional filtering.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `milestone_id` (optional): Specific milestone ID to query
- `include_features` (optional): Include associated features in the response

**Example:**
```json
{
  "action": "query_milestones",
  "file_path": "game_design.md",
  "milestone_id": "M1",
  "include_features": true
}
```

### 9. `query_features`
Query features with filtering options.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `milestone` (optional): Filter by milestone ID
- `priority` (optional): Filter by priority level (P1, P2, P3)
- `feature_id` (optional): Get specific feature by ID
- `include_tasks` (optional): Include associated tasks

**Example:**
```json
{
  "action": "query_features",
  "file_path": "game_design.md",
  "milestone": "M1",
  "priority": "P1",
  "include_tasks": true
}
```

### 10. `query_tasks`
Query tasks with filtering.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `feature_id` (optional): Filter tasks by feature
- `task_id` (optional): Get specific task by ID

**Example:**
```json
{
  "action": "query_tasks",
  "file_path": "game_design.md",
  "feature_id": "F-SPECIFIC-FEATURE"
}
```

### 11. `validate_structure`
Validate GDD structure and content.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `check_type` (optional): Type of validation (`all`, `frontmatter`, `content`, `references`)

**Example:**
```json
{
  "action": "validate_structure",
  "file_path": "game_design.md",
  "check_type": "all"
}
```

### 12. `export_summary`
Generate structured summaries.

**Parameters:**
- `file_path` (required): Path to the GDD file
- `format` (optional): Output format (`markdown`, `json`, `csv`)
- `include` (optional): Elements to include (`milestones`, `features`, `tasks`, `progress`, `estimates`)

**Example:**
```json
{
  "action": "export_summary",
  "file_path": "game_design.md",
  "format": "markdown",
  "include": ["milestones", "features", "progress"]
}
```

## Response Format

All responses include:
- `success`: Boolean indicating operation success
- `data`: Action-specific result data
- `error`: Error message if operation failed
- `warnings`: Array of warning messages
- `metadata`: File information (size, last modified, feature count, task count)

## Error Handling

The tool provides comprehensive error handling for:
- Invalid YAML frontmatter
- Missing required fields
- Duplicate IDs
- Invalid references (e.g., feature referencing non-existent milestone)
- File read/write errors
- Invalid input parameters

## Best Practices

1. **ID Conventions**: Use consistent naming patterns for IDs:
   - Milestones: `M1`, `M2`, etc.
   - Features: `F-CATEGORY-NAME`
   - Tasks: `T-FEATURE-XXX`

2. **Priority Levels**:
   - `P1`: Critical features that must be completed
   - `P2`: Important features for the target release
   - `P3`: Nice-to-have features that can be deferred

3. **Acceptance Criteria**: Write clear, testable acceptance criteria for each feature

4. **Task Estimates**: Use consistent units (story points or hours) for task estimates

5. **Regular Validation**: Use the `validate_structure` action regularly to catch issues early

## Integration with Development Workflow

The GDD Manager tool integrates seamlessly with development workflows:

1. **Planning Phase**: Use `add_feature` and `add_task` to break down project requirements
2. **Development Phase**: Query features and tasks to understand current priorities
3. **Review Phase**: Use validation to ensure document consistency
4. **Reporting Phase**: Export summaries for stakeholder updates

## Example Workflow

```bash
# 1. Read current GDD
gdd-manager read game_design.md

# 2. Add a new feature for the current milestone
gdd-manager add_feature game_design.md F-INVENTORY-SYSTEM "Inventory Management" M1 P2

# 3. Add tasks to the feature
gdd-manager add_task game_design.md F-INVENTORY-SYSTEM T-INV-001 "Create inventory UI"

# 4. Query all P1 features for current milestone
gdd-manager query_features game_design.md --milestone M1 --priority P1 --include-tasks

# 5. Validate the document structure
gdd-manager validate_structure game_design.md

# 6. Export progress summary
gdd-manager export_summary game_design.md --format markdown --include milestones features progress
```

This tool provides a comprehensive solution for managing game design documents with structured data, enabling better project organization and tracking throughout the development process.
