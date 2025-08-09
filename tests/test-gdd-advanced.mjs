import { manageGDD } from '../dist/tool/gdd-manager.js';

async function testAdvancedGDDOperations() {
  console.log('🧪 Testing Advanced GDD Manager Operations...\n');

  // Test adding a new feature
  console.log('1. Testing add_feature...');
  const addFeatureResult = await manageGDD({
    action: 'add_feature',
    file_path: 'test-gdd.md',
    feature: {
      id: 'F-COMBAT-SYSTEM',
      title: 'Advanced Combat System',
      milestone: 'M2',
      priority: 'P1',
      acceptance: [
        'Players can perform combo attacks',
        'Damage calculation is balanced',
        'Visual effects are polished'
      ],
      tasks: [
        {
          id: 'T-COMBAT-001',
          title: 'Design combat mechanics',
          estimate: 13
        },
        {
          id: 'T-COMBAT-002',
          title: 'Implement damage system',
          estimate: 8
        }
      ]
    }
  });

  if (addFeatureResult.success) {
    console.log('✅ Feature added successfully');
    console.log(`Added: ${addFeatureResult.data.title} with ${addFeatureResult.data.tasks.length} tasks`);
  } else {
    console.log('❌ Failed to add feature:', addFeatureResult.error);
  }

  // Test adding a task to existing feature
  console.log('\n2. Testing add_task...');
  const addTaskResult = await manageGDD({
    action: 'add_task',
    file_path: 'test-gdd.md',
    feature_id: 'F-ABILITY-CORE',
    task: {
      id: 'T-ABILITY-003',
      title: 'Add ability visual effects',
      estimate: 5
    }
  });

  if (addTaskResult.success) {
    console.log('✅ Task added successfully');
    console.log(`Added task: ${addTaskResult.data.title}`);
  } else {
    console.log('❌ Failed to add task:', addTaskResult.error);
  }

  // Test updating content section
  console.log('\n3. Testing update_content...');
  const updateContentResult = await manageGDD({
    action: 'update_content',
    file_path: 'test-gdd.md',
    section: 'Features',
    content: `### Combat System
The advanced combat system will feature combo attacks, special abilities, and strategic resource management.

### Inventory System  
Players will have access to a comprehensive inventory system for managing equipment and consumables.`,
    operation: 'append'
  });

  if (updateContentResult.success) {
    console.log('✅ Content updated successfully');
  } else {
    console.log('❌ Failed to update content:', updateContentResult.error);
  }

  // Test export summary in JSON format
  console.log('\n4. Testing export_summary (JSON)...');
  const exportResult = await manageGDD({
    action: 'export_summary',
    file_path: 'test-gdd.md',
    format: 'json',
    include: ['features', 'progress', 'estimates']
  });

  if (exportResult.success) {
    console.log('✅ Export successful');
    const data = JSON.parse(exportResult.data);
    console.log(`Features: ${data.features.length}`);
    console.log(`Total estimate: ${data.estimates.totalEstimate} points`);
  } else {
    console.log('❌ Export failed:', exportResult.error);
  }

  // Test validation after changes
  console.log('\n5. Testing validation after changes...');
  const validateResult = await manageGDD({
    action: 'validate_structure',
    file_path: 'test-gdd.md'
  });

  if (validateResult.success) {
    console.log('✅ Validation completed');
    console.log(`Document is valid: ${validateResult.data.valid}`);
    if (validateResult.data.errors.length > 0) {
      console.log(`Errors found: ${validateResult.data.errors.length}`);
    }
    if (validateResult.data.warnings.length > 0) {
      console.log(`Warnings: ${validateResult.data.warnings.length}`);
    }
  } else {
    console.log('❌ Validation failed:', validateResult.error);
  }

  // Test querying tasks across all features
  console.log('\n6. Testing query_tasks (all tasks)...');
  const queryTasksResult = await manageGDD({
    action: 'query_tasks',
    file_path: 'test-gdd.md'
  });

  if (queryTasksResult.success) {
    console.log('✅ Task query successful');
    console.log(`Total tasks found: ${queryTasksResult.data.length}`);
    
    let totalEstimate = 0;
    queryTasksResult.data.forEach(task => {
      console.log(`  - ${task.title} (${task.featureId}) - ${task.estimate || 0} points`);
      totalEstimate += task.estimate || 0;
    });
    console.log(`Total project estimate: ${totalEstimate} points`);
  } else {
    console.log('❌ Task query failed:', queryTasksResult.error);
  }

  console.log('\n🎉 Advanced operations test completed!');
}

testAdvancedGDDOperations().catch(console.error);
