import fs from 'fs';
import path from 'path';

async function validateAgents() {
  console.log('🔍 Validating 16 agents...\n');

  const catalogPath = path.join(process.cwd(), 'agents', 'agents-catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  let valid = true;

  for (const agent of catalog.agents) {
    const checks = {
      name: agent.name ? '✅' : '❌',
      role: agent.role ? '✅' : '❌',
      displayName: agent.displayName ? '✅' : '❌',
      description: agent.description ? '✅' : '❌',
      systemPrompt: agent.systemPrompt ? '✅' : '❌',
      capabilities: Array.isArray(agent.capabilities) && agent.capabilities.length > 0 ? '✅' : '❌'
    };

    const allValid = Object.values(checks).every(c => c === '✅');
    if (!allValid) valid = false;

    console.log(`${allValid ? '✅' : '❌'} ${agent.displayName} (${agent.name})`);
    console.log(`   ${Object.entries(checks).map(([k, v]) => `${v} ${k}`).join(' | ')}`);
  }

  console.log(`\n✅ Total agents: ${catalog.agents.length}`);
  console.log(`✅ Premium agents: ${catalog.agents.filter((a: any) => a.isPremium).length}`);
  console.log(`✅ Free agents: ${catalog.agents.filter((a: any) => !a.isPremium).length}`);

  if (valid) {
    console.log('\n🎉 All agents validated successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Some agents failed validation');
    process.exit(1);
  }
}

validateAgents().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
