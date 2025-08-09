import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Type definitions for GDD structure
export interface GDDTask {
  id: string;
  title: string;
  estimate?: number;
}

export interface GDDFeature {
  id: string;
  title: string;
  milestone: string;
  priority: 'P1' | 'P2' | 'P3';
  acceptance: string[];
  tasks: GDDTask[];
}

export interface GDDMilestone {
  id: string;
  title: string;
}

export interface GDDFrontmatter {
  project: string;
  version: string;
  milestones: GDDMilestone[];
  features: GDDFeature[];
  [key: string]: any; // Allow additional properties
}

export interface ParsedGDD {
  frontmatter: GDDFrontmatter;
  content: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GDDResponse {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
  metadata?: {
    fileSize: number;
    lastModified: string;
    featureCount: number;
    taskCount: number;
  };
}

// Zod schemas for validation
export const GDDTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  estimate: z.number().optional(),
});

export const GDDFeatureSchema = z.object({
  id: z.string(),
  title: z.string(),
  milestone: z.string(),
  priority: z.enum(['P1', 'P2', 'P3']),
  acceptance: z.array(z.string()),
  tasks: z.array(GDDTaskSchema),
});

export const GDDMilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export const GDDFrontmatterSchema = z.object({
  project: z.string(),
  version: z.string(),
  milestones: z.array(GDDMilestoneSchema),
  features: z.array(GDDFeatureSchema),
});

// Main GDD Manager input schema
export const GDDManagerSchema = z.object({
  action: z.enum([
    'read',
    'update_frontmatter',
    'update_content',
    'add_feature',
    'update_feature',
    'add_task',
    'update_task',
    'query_milestones',
    'query_features',
    'query_tasks',
    'validate_structure',
    'export_summary'
  ]),
  file_path: z.string(),
  // Action-specific parameters
  updates: z.object({}).passthrough().optional(),
  section: z.string().optional(),
  content: z.string().optional(),
  operation: z.enum(['replace', 'append', 'prepend']).optional(),
  feature: GDDFeatureSchema.partial().optional(),
  feature_id: z.string().optional(),
  task: GDDTaskSchema.optional(),
  task_id: z.string().optional(),
  milestone_id: z.string().optional(),
  include_features: z.boolean().optional(),
  milestone: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3']).optional(),
  include_tasks: z.boolean().optional(),
  check_type: z.enum(['all', 'frontmatter', 'content', 'references']).optional(),
  format: z.enum(['markdown', 'json', 'csv']).optional(),
  include: z.array(z.enum(['milestones', 'features', 'tasks', 'progress', 'estimates'])).optional(),
});

/**
 * Parse frontmatter and markdown content from a GDD file
 */
function parseFrontmatter(content: string): ParsedGDD {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('Invalid GDD format: Missing frontmatter');
  }
  
  const [, frontmatterYaml, markdownContent] = match;
  
  try {
    const frontmatter = yaml.load(frontmatterYaml) as GDDFrontmatter;
    return { frontmatter, content: markdownContent };
  } catch (error) {
    throw new Error(`Invalid YAML frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Serialize GDD back to file format
 */
function serializeGDD(gdd: ParsedGDD): string {
  const frontmatterYaml = yaml.dump(gdd.frontmatter, { 
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });
  
  return `---\n${frontmatterYaml}---\n\n${gdd.content}`;
}

/**
 * Parse markdown sections
 */
function parseMarkdownSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const headerMatch = line.match(/^#+\s+(.+)$/);
    if (headerMatch) {
      if (currentSection) {
        sections.set(currentSection, currentContent.join('\n').trim());
      }
      currentSection = headerMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  
  if (currentSection) {
    sections.set(currentSection, currentContent.join('\n').trim());
  }
  
  return sections;
}

/**
 * Update content section in markdown
 */
function updateContentSection(content: string, section: string, newContent: string, operation: 'replace' | 'append' | 'prepend' = 'replace'): string {
  const sections = parseMarkdownSections(content);
  
  if (!sections.has(section)) {
    // Add new section if it doesn't exist
    return `${content}\n\n# ${section}\n\n${newContent}`;
  }
  
  const existingContent = sections.get(section) || '';
  let updatedContent: string;
  
  switch (operation) {
    case 'append':
      updatedContent = `${existingContent}\n\n${newContent}`;
      break;
    case 'prepend':
      updatedContent = `${newContent}\n\n${existingContent}`;
      break;
    default:
      updatedContent = newContent;
  }
  
  sections.set(section, updatedContent);
  
  // Rebuild content
  const rebuiltContent: string[] = [];
  for (const [sectionName, sectionContent] of sections) {
    rebuiltContent.push(`# ${sectionName}\n\n${sectionContent}`);
  }
  
  return rebuiltContent.join('\n\n');
}

/**
 * Add a feature to the frontmatter
 */
function addFeature(frontmatter: GDDFrontmatter, feature: GDDFeature): GDDFrontmatter {
  // Check for duplicate IDs
  const existingFeature = frontmatter.features.find(f => f.id === feature.id);
  if (existingFeature) {
    throw new Error(`Feature with ID '${feature.id}' already exists`);
  }
  
  // Validate milestone reference
  const milestoneExists = frontmatter.milestones.some(m => m.id === feature.milestone);
  if (!milestoneExists) {
    throw new Error(`Referenced milestone '${feature.milestone}' does not exist`);
  }
  
  // Check for duplicate task IDs within the feature
  const taskIds = new Set<string>();
  for (const task of feature.tasks) {
    if (taskIds.has(task.id)) {
      throw new Error(`Duplicate task ID '${task.id}' in feature '${feature.id}'`);
    }
    taskIds.add(task.id);
  }
  
  return {
    ...frontmatter,
    features: [...frontmatter.features, feature]
  };
}

/**
 * Update an existing feature
 */
function updateFeature(frontmatter: GDDFrontmatter, featureId: string, updates: Partial<GDDFeature>): GDDFrontmatter {
  const featureIndex = frontmatter.features.findIndex(f => f.id === featureId);
  if (featureIndex === -1) {
    throw new Error(`Feature with ID '${featureId}' not found`);
  }
  
  const existingFeature = frontmatter.features[featureIndex];
  const updatedFeature = { ...existingFeature, ...updates };
  
  // Validate milestone reference if being updated
  if (updates.milestone) {
    const milestoneExists = frontmatter.milestones.some(m => m.id === updates.milestone);
    if (!milestoneExists) {
      throw new Error(`Referenced milestone '${updates.milestone}' does not exist`);
    }
  }
  
  const updatedFeatures = [...frontmatter.features];
  updatedFeatures[featureIndex] = updatedFeature;
  
  return {
    ...frontmatter,
    features: updatedFeatures
  };
}

/**
 * Add a task to an existing feature
 */
function addTaskToFeature(frontmatter: GDDFrontmatter, featureId: string, task: GDDTask): GDDFrontmatter {
  const featureIndex = frontmatter.features.findIndex(f => f.id === featureId);
  if (featureIndex === -1) {
    throw new Error(`Feature with ID '${featureId}' not found`);
  }
  
  const feature = frontmatter.features[featureIndex];
  
  // Check for duplicate task ID within the feature
  const existingTask = feature.tasks.find(t => t.id === task.id);
  if (existingTask) {
    throw new Error(`Task with ID '${task.id}' already exists in feature '${featureId}'`);
  }
  
  const updatedFeature = {
    ...feature,
    tasks: [...feature.tasks, task]
  };
  
  const updatedFeatures = [...frontmatter.features];
  updatedFeatures[featureIndex] = updatedFeature;
  
  return {
    ...frontmatter,
    features: updatedFeatures
  };
}

/**
 * Update an existing task
 */
function updateTask(frontmatter: GDDFrontmatter, taskId: string, updates: Partial<GDDTask>): GDDFrontmatter {
  for (let i = 0; i < frontmatter.features.length; i++) {
    const feature = frontmatter.features[i];
    const taskIndex = feature.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      const updatedTask = { ...feature.tasks[taskIndex], ...updates };
      const updatedTasks = [...feature.tasks];
      updatedTasks[taskIndex] = updatedTask;
      
      const updatedFeature = { ...feature, tasks: updatedTasks };
      const updatedFeatures = [...frontmatter.features];
      updatedFeatures[i] = updatedFeature;
      
      return {
        ...frontmatter,
        features: updatedFeatures
      };
    }
  }
  
  throw new Error(`Task with ID '${taskId}' not found`);
}

/**
 * Query milestones with optional filtering
 */
function queryMilestones(frontmatter: GDDFrontmatter, milestoneId?: string, includeFeatures?: boolean): GDDMilestone[] | (GDDMilestone & { features?: GDDFeature[] })[] {
  let milestones = frontmatter.milestones;
  
  if (milestoneId) {
    milestones = milestones.filter(m => m.id === milestoneId);
  }
  
  if (includeFeatures) {
    return milestones.map(milestone => ({
      ...milestone,
      features: frontmatter.features.filter(f => f.milestone === milestone.id)
    }));
  }
  
  return milestones;
}

/**
 * Query features with filtering options
 */
function queryFeatures(frontmatter: GDDFrontmatter, options: {
  milestone?: string;
  priority?: 'P1' | 'P2' | 'P3';
  featureId?: string;
  includeTasks?: boolean;
}): GDDFeature[] {
  let features = frontmatter.features;
  
  if (options.featureId) {
    features = features.filter(f => f.id === options.featureId);
  }
  
  if (options.milestone) {
    features = features.filter(f => f.milestone === options.milestone);
  }
  
  if (options.priority) {
    features = features.filter(f => f.priority === options.priority);
  }
  
  if (!options.includeTasks) {
    features = features.map(f => ({ ...f, tasks: [] }));
  }
  
  return features;
}

/**
 * Query tasks with filtering
 */
function queryTasks(frontmatter: GDDFrontmatter, featureId?: string, taskId?: string): (GDDTask & { featureId: string })[] {
  const tasks: (GDDTask & { featureId: string })[] = [];
  
  for (const feature of frontmatter.features) {
    if (featureId && feature.id !== featureId) {
      continue;
    }
    
    for (const task of feature.tasks) {
      if (taskId && task.id !== taskId) {
        continue;
      }
      
      tasks.push({ ...task, featureId: feature.id });
    }
  }
  
  return tasks;
}

/**
 * Validate GDD structure
 */
function validateGDD(frontmatter: GDDFrontmatter, content: string, checkType: 'all' | 'frontmatter' | 'content' | 'references' = 'all'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (checkType === 'all' || checkType === 'frontmatter') {
    // Validate frontmatter structure
    try {
      GDDFrontmatterSchema.parse(frontmatter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`Frontmatter validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
    }
    
    // Check for duplicate milestone IDs
    const milestoneIds = new Set<string>();
    for (const milestone of frontmatter.milestones) {
      if (milestoneIds.has(milestone.id)) {
        errors.push(`Duplicate milestone ID: ${milestone.id}`);
      }
      milestoneIds.add(milestone.id);
    }
    
    // Check for duplicate feature IDs
    const featureIds = new Set<string>();
    for (const feature of frontmatter.features) {
      if (featureIds.has(feature.id)) {
        errors.push(`Duplicate feature ID: ${feature.id}`);
      }
      featureIds.add(feature.id);
    }
  }
  
  if (checkType === 'all' || checkType === 'references') {
    // Validate milestone references
    const milestoneIds = new Set(frontmatter.milestones.map(m => m.id));
    for (const feature of frontmatter.features) {
      if (!milestoneIds.has(feature.milestone)) {
        errors.push(`Feature '${feature.id}' references non-existent milestone '${feature.milestone}'`);
      }
    }
    
    // Check for duplicate task IDs within features
    for (const feature of frontmatter.features) {
      const taskIds = new Set<string>();
      for (const task of feature.tasks) {
        if (taskIds.has(task.id)) {
          errors.push(`Duplicate task ID '${task.id}' in feature '${feature.id}'`);
        }
        taskIds.add(task.id);
      }
    }
  }
  
  if (checkType === 'all' || checkType === 'content') {
    // Basic content validation
    if (!content.trim()) {
      warnings.push('Document content is empty');
    }
    
    // Check for common sections
    const sections = parseMarkdownSections(content);
    const commonSections = ['Game Overview', 'Core Pillars', 'Features', 'Technical Requirements'];
    for (const expectedSection of commonSections) {
      if (!sections.has(expectedSection)) {
        warnings.push(`Missing common section: ${expectedSection}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export summary in various formats
 */
function exportSummary(frontmatter: GDDFrontmatter, format: 'markdown' | 'json' | 'csv' = 'markdown', include: string[] = ['milestones', 'features', 'tasks']): string {
  const data = {
    milestones: frontmatter.milestones,
    features: frontmatter.features,
    tasks: queryTasks(frontmatter),
    progress: {
      totalFeatures: frontmatter.features.length,
      totalTasks: queryTasks(frontmatter).length,
      priorityBreakdown: {
        P1: frontmatter.features.filter(f => f.priority === 'P1').length,
        P2: frontmatter.features.filter(f => f.priority === 'P2').length,
        P3: frontmatter.features.filter(f => f.priority === 'P3').length,
      }
    },
    estimates: {
      totalEstimate: queryTasks(frontmatter).reduce((sum, task) => sum + (task.estimate || 0), 0),
      averageTaskEstimate: queryTasks(frontmatter).reduce((sum, task) => sum + (task.estimate || 0), 0) / queryTasks(frontmatter).length || 0
    }
  };
  
  switch (format) {
    case 'json':
      const filteredData: any = {};
      for (const key of include) {
        if (key in data) {
          filteredData[key] = (data as any)[key];
        }
      }
      return JSON.stringify(filteredData, null, 2);
      
    case 'csv':
      // Simple CSV export for features
      const headers = ['ID', 'Title', 'Milestone', 'Priority', 'Task Count', 'Total Estimate'];
      const rows = [headers.join(',')];
      
      for (const feature of frontmatter.features) {
        const taskCount = feature.tasks.length;
        const totalEstimate = feature.tasks.reduce((sum, task) => sum + (task.estimate || 0), 0);
        rows.push([
          feature.id,
          `"${feature.title}"`,
          feature.milestone,
          feature.priority,
          taskCount.toString(),
          totalEstimate.toString()
        ].join(','));
      }
      
      return rows.join('\n');
      
    default: // markdown
      const output: string[] = [];
      
      if (include.includes('milestones')) {
        output.push('# Milestones\n');
        for (const milestone of frontmatter.milestones) {
          const milestoneFeatures = frontmatter.features.filter(f => f.milestone === milestone.id);
          output.push(`## ${milestone.title} (${milestone.id})`);
          output.push(`Features: ${milestoneFeatures.length}\n`);
        }
      }
      
      if (include.includes('features')) {
        output.push('# Features\n');
        for (const feature of frontmatter.features) {
          output.push(`## ${feature.title} (${feature.id})`);
          output.push(`- **Milestone**: ${feature.milestone}`);
          output.push(`- **Priority**: ${feature.priority}`);
          output.push(`- **Tasks**: ${feature.tasks.length}`);
          output.push(`- **Estimate**: ${feature.tasks.reduce((sum, task) => sum + (task.estimate || 0), 0)} points\n`);
        }
      }
      
      if (include.includes('progress')) {
        output.push('# Progress Summary\n');
        output.push(`- **Total Features**: ${data.progress.totalFeatures}`);
        output.push(`- **Total Tasks**: ${data.progress.totalTasks}`);
        output.push(`- **Priority Breakdown**:`);
        output.push(`  - P1: ${data.progress.priorityBreakdown.P1} features`);
        output.push(`  - P2: ${data.progress.priorityBreakdown.P2} features`);
        output.push(`  - P3: ${data.progress.priorityBreakdown.P3} features\n`);
      }
      
      if (include.includes('estimates')) {
        output.push('# Estimates\n');
        output.push(`- **Total Estimate**: ${data.estimates.totalEstimate} points`);
        output.push(`- **Average Task Estimate**: ${data.estimates.averageTaskEstimate.toFixed(1)} points\n`);
      }
      
      return output.join('\n');
  }
}

/**
 * Get file metadata
 */
async function getFileMetadata(filePath: string, frontmatter: GDDFrontmatter): Promise<GDDResponse['metadata']> {
  try {
    const stats = await fs.stat(filePath);
    const taskCount = queryTasks(frontmatter).length;
    
    return {
      fileSize: stats.size,
      lastModified: stats.mtime.toISOString(),
      featureCount: frontmatter.features.length,
      taskCount
    };
  } catch (error) {
    return undefined;
  }
}

/**
 * Main GDD Manager function
 */
export async function manageGDD(params: z.infer<typeof GDDManagerSchema>): Promise<GDDResponse> {
  try {
    // Validate input
    const validatedParams = GDDManagerSchema.parse(params);
    const { action, file_path } = validatedParams;
    
    // Check if file exists for read operations
    try {
      await fs.access(file_path);
    } catch (error) {
      if (action === 'read' || action.startsWith('query') || action === 'validate_structure' || action === 'export_summary') {
        return {
          success: false,
          error: `File not found: ${file_path}`
        };
      }
    }
    
    let gdd: ParsedGDD;
    let fileContent = '';
    
    // Read and parse existing file
    try {
      fileContent = await fs.readFile(file_path, 'utf-8');
      gdd = parseFrontmatter(fileContent);
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse GDD file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    
    let result: any = null;
    let updatedGDD = gdd!;
    let shouldWriteFile = false;
    
    switch (action) {
      case 'read':
        result = gdd!;
        break;
        
      case 'update_frontmatter':
        if (!validatedParams.updates) {
          throw new Error('Updates parameter is required for update_frontmatter action');
        }
        updatedGDD = {
          ...gdd!,
          frontmatter: { ...gdd!.frontmatter, ...validatedParams.updates }
        };
        shouldWriteFile = true;
        result = updatedGDD.frontmatter;
        break;
        
      case 'update_content':
        if (!validatedParams.section || !validatedParams.content) {
          throw new Error('Section and content parameters are required for update_content action');
        }
        const updatedContent = updateContentSection(
          gdd!.content,
          validatedParams.section,
          validatedParams.content,
          validatedParams.operation
        );
        updatedGDD = { ...gdd!, content: updatedContent };
        shouldWriteFile = true;
        result = { section: validatedParams.section, updated: true };
        break;
        
      case 'add_feature':
        if (!validatedParams.feature) {
          throw new Error('Feature parameter is required for add_feature action');
        }
        const featureToAdd = validatedParams.feature as GDDFeature;
        updatedGDD = {
          ...gdd!,
          frontmatter: addFeature(gdd!.frontmatter, featureToAdd)
        };
        shouldWriteFile = true;
        result = featureToAdd;
        break;
        
      case 'update_feature':
        if (!validatedParams.feature_id || !validatedParams.updates) {
          throw new Error('Feature ID and updates parameters are required for update_feature action');
        }
        updatedGDD = {
          ...gdd!,
          frontmatter: updateFeature(gdd!.frontmatter, validatedParams.feature_id, validatedParams.updates)
        };
        shouldWriteFile = true;
        result = updatedGDD.frontmatter.features.find(f => f.id === validatedParams.feature_id);
        break;
        
      case 'add_task':
        if (!validatedParams.feature_id || !validatedParams.task) {
          throw new Error('Feature ID and task parameters are required for add_task action');
        }
        updatedGDD = {
          ...gdd!,
          frontmatter: addTaskToFeature(gdd!.frontmatter, validatedParams.feature_id, validatedParams.task)
        };
        shouldWriteFile = true;
        result = validatedParams.task;
        break;
        
      case 'update_task':
        if (!validatedParams.task_id || !validatedParams.updates) {
          throw new Error('Task ID and updates parameters are required for update_task action');
        }
        updatedGDD = {
          ...gdd!,
          frontmatter: updateTask(gdd!.frontmatter, validatedParams.task_id, validatedParams.updates)
        };
        shouldWriteFile = true;
        result = queryTasks(updatedGDD.frontmatter, undefined, validatedParams.task_id)[0];
        break;
        
      case 'query_milestones':
        result = queryMilestones(
          gdd!.frontmatter,
          validatedParams.milestone_id,
          validatedParams.include_features
        );
        break;
        
      case 'query_features':
        result = queryFeatures(gdd!.frontmatter, {
          milestone: validatedParams.milestone,
          priority: validatedParams.priority,
          featureId: validatedParams.feature_id,
          includeTasks: validatedParams.include_tasks
        });
        break;
        
      case 'query_tasks':
        result = queryTasks(gdd!.frontmatter, validatedParams.feature_id, validatedParams.task_id);
        break;
        
      case 'validate_structure':
        const validation = validateGDD(
          gdd!.frontmatter,
          gdd!.content,
          validatedParams.check_type
        );
        result = validation;
        break;
        
      case 'export_summary':
        result = exportSummary(
          gdd!.frontmatter,
          validatedParams.format,
          validatedParams.include
        );
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Write file if needed
    if (shouldWriteFile) {
      const serializedContent = serializeGDD(updatedGDD);
      await fs.writeFile(file_path, serializedContent, 'utf-8');
    }
    
    // Get metadata for the response
    const metadata = await getFileMetadata(file_path, (shouldWriteFile ? updatedGDD : gdd!).frontmatter);
    
    return {
      success: true,
      data: result,
      metadata
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
