import { manageGDD } from '../dist/tool/gdd-manager.js';

async function testGDDManager() {
  console.log('Testing GDD Manager...');
  
  // Test reading the GDD file
  console.log('\n1. Testing read action...');
  const readResult = await manageGDD({
    action: 'read',
    file_path: 'test-gdd.md'
  });
  
  if (readResult.success) {
    console.log('✅ Read successful');
    console.log(`Project: ${readResult.data.frontmatter.project}`);
    console.log(`Features: ${readResult.data.frontmatter.features.length}`);
    console.log(`Content length: ${readResult.data.content.length} characters`);
  } else {
    console.log('❌ Read failed:', readResult.error);
    return;
  }
  
  // Test querying features
  console.log('\n2. Testing query features...');
  const queryResult = await manageGDD({
    action: 'query_features',
    file_path: 'test-gdd.md',
    milestone: 'M1',
    include_tasks: true
  });
  
  if (queryResult.success) {
    console.log('✅ Query successful');
    console.log(`Found ${queryResult.data.length} features for milestone M1`);
    queryResult.data.forEach(feature => {
      console.log(`  - ${feature.title} (${feature.priority}) - ${feature.tasks.length} tasks`);
    });
  } else {
    console.log('❌ Query failed:', queryResult.error);
  }
  
  // Test validation
  console.log('\n3. Testing validation...');
  const validateResult = await manageGDD({
    action: 'validate_structure',
    file_path: 'test-gdd.md',
    check_type: 'all'
  });
  
  if (validateResult.success) {
    console.log('✅ Validation completed');
    console.log(`Valid: ${validateResult.data.valid}`);
    console.log(`Errors: ${validateResult.data.errors.length}`);
    console.log(`Warnings: ${validateResult.data.warnings.length}`);
    
    if (validateResult.data.errors.length > 0) {
      console.log('Errors:', validateResult.data.errors);
    }
    if (validateResult.data.warnings.length > 0) {
      console.log('Warnings:', validateResult.data.warnings);
    }
  } else {
    console.log('❌ Validation failed:', validateResult.error);
  }
  
  // Test export summary
  console.log('\n4. Testing export summary...');
  const exportResult = await manageGDD({
    action: 'export_summary',
    file_path: 'test-gdd.md',
    format: 'markdown',
    include: ['milestones', 'features', 'progress']
  });
  
  if (exportResult.success) {
    console.log('✅ Export successful');
    console.log('Summary:\n', exportResult.data);
  } else {
    console.log('❌ Export failed:', exportResult.error);
  }
  
  console.log('\nAll tests completed!');
}

// Run the test
testGDDManager().catch(console.error);
