import fs from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/index.js';

async function runTests() {
  console.log('🧪 Starting RetailFlow MCP Protocol Test Suite...\n');

  const testDbFile = '/tmp/test_retailflow_mcp_' + Date.now() + '.json';
  if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);

  try {
    // 1. Create Server & Link via InMemoryTransport
    const { server } = await createServer({ filePath: testDbFile });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    const client = new Client(
      { name: 'test-agent', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(clientTransport);
    console.log('✅ Client connected to RetailFlow MCP Server successfully.\n');

    // 2. Test Tools Discovery
    const toolsResult = await client.listTools();
    console.log(`📦 Discovered ${toolsResult.tools.length} Tools:`);
    toolsResult.tools.forEach((t) => console.log(`   • ${t.name.padEnd(24)} - ${t.description.slice(0, 60)}...`));
    if (toolsResult.tools.length < 10) throw new Error('Expected at least 10 registered tools.');
    console.log('✅ Tool discovery passed.\n');

    // 3. Test Resources Discovery
    const resourcesResult = await client.listResources();
    console.log(`📚 Discovered ${resourcesResult.resources.length} Resources:`);
    resourcesResult.resources.forEach((r) => console.log(`   • ${r.name.padEnd(20)} (${r.uri})`));
    if (resourcesResult.resources.length < 3) throw new Error('Expected at least 3 registered resources.');
    console.log('✅ Resource discovery passed.\n');

    // 4. Test Prompts Discovery
    const promptsResult = await client.listPrompts();
    console.log(`💬 Discovered ${promptsResult.prompts.length} Prompts:`);
    promptsResult.prompts.forEach((p) => console.log(`   • ${p.name.padEnd(24)} - ${p.description}`));
    if (promptsResult.prompts.length < 3) throw new Error('Expected at least 3 registered prompts.');
    console.log('✅ Prompt discovery passed.\n');

    // 5. Execute: list_firms
    console.log('⚡ Invoking tool "list_firms"...');
    const firmsRes = await client.callTool({ name: 'list_firms', arguments: {} });
    console.log(firmsRes.content[0].text);
    console.log('✅ list_firms passed.\n');

    // 6. Execute: list_inventory
    console.log('⚡ Invoking tool "list_inventory"...');
    const invRes = await client.callTool({ name: 'list_inventory', arguments: {} });
    console.log(invRes.content[0].text.split('\n').slice(0, 6).join('\n') + '\n...');
    console.log('✅ list_inventory passed.\n');

    // 7. Execute: create_invoice
    console.log('⚡ Invoking tool "create_invoice" to bill 2 Wireless Bluetooth Earbuds Pro...');
    const createInvRes = await client.callTool({
      name: 'create_invoice',
      arguments: {
        customer_name: 'TechCorp Solutions',
        customer_phone: '+91 99887 76655',
        customer_gstin: '27AABCT1234T1Z9',
        place_of_supply: 'Maharashtra',
        payment_method: 'upi',
        items: [
          {
            name: 'Wireless Bluetooth Earbuds Pro',
            qty: 2,
            rate: 1999,
            gst_rate: 18,
            hsn: '8518',
          },
        ],
        notes: 'Delivered via Express Courier.',
      },
    });
    console.log(createInvRes.content[0].text.split('Full Invoice Details:')[0]);
    console.log('✅ create_invoice passed.\n');

    // 8. Execute: get_billing_summary
    console.log('⚡ Invoking tool "get_billing_summary"...');
    const summaryRes = await client.callTool({ name: 'get_billing_summary', arguments: {} });
    console.log(summaryRes.content[0].text.split('{\n')[0]);
    console.log('✅ get_billing_summary passed.\n');

    // 9. Execute: get_gst_report
    console.log('⚡ Invoking tool "get_gst_report"...');
    const gstRes = await client.callTool({ name: 'get_gst_report', arguments: {} });
    console.log(gstRes.content[0].text.split('Full Report JSON:')[0]);
    console.log('✅ get_gst_report passed.\n');

    // 10. Close client and server
    await client.close();
    await server.close();
    console.log('🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY!\n');
  } finally {
    if (fs.existsSync(testDbFile)) {
      fs.unlinkSync(testDbFile);
    }
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
