import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testGDDManagerTool() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/server.js']
  });

  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0'
    },
    {
      capabilities: {}
    }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // List available tools to confirm GDD manager is there
    const tools = await client.listTools();
    console.log('\n📋 Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description.substring(0, 60)}...`);
    });

    // Check if GDD manager tool is available
    const gddTool = tools.tools.find(tool => tool.name === 'gdd-manager');
    if (!gddTool) {
      console.log('❌ GDD manager tool not found!');
      return;
    }
    console.log('✅ GDD manager tool found');

    // Test the GDD manager tool
    console.log('\n🧪 Testing GDD manager tool...');

    // Test read action
    const readResult = await client.callTool({
      name: 'gdd-manager',
      arguments: {
        action: 'read',
        file_path: 'test-gdd.md'
      }
    });

    if (readResult.content && readResult.content[0] && readResult.content[0].type === 'text') {
      console.log('✅ Read action successful');
      console.log('Response preview:', readResult.content[0].text.substring(0, 200) + '...');
    } else {
      console.log('❌ Read action failed');
      console.log('Response:', readResult);
    }

    // Test query features action
    const queryResult = await client.callTool({
      name: 'gdd-manager',
      arguments: {
        action: 'query_features',
        file_path: 'test-gdd.md',
        milestone: 'M1',
        include_tasks: true
      }
    });

    if (queryResult.content && queryResult.content[0] && queryResult.content[0].type === 'text') {
      console.log('✅ Query features action successful');
      console.log('Response preview:', queryResult.content[0].text.substring(0, 200) + '...');
    } else {
      console.log('❌ Query features action failed');
      console.log('Response:', queryResult);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Test completed');
  }
}

testGDDManagerTool().catch(console.error);
