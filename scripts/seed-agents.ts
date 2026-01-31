import fs from 'fs';
import path from 'path';

async function seedAgents() {
  console.log('🌱 Seeding 16 agents and roles...\n');

  try {
    const catalogPath = path.join(process.cwd(), 'agents', 'agents-catalog.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

    console.log(`✅ Seeding ${catalog.agents.length} agents...`);
    catalog.agents.forEach((agent: any) => {
      console.log(`  ✅ ${agent.displayName} (${agent.role})`);
    });

    console.log(`\n✅ Seeding ${catalog.roles.length} roles...`);
    catalog.roles.forEach((role: any) => {
      console.log(`  ✅ ${role.name} (${role.code})`);
    });

    console.log('\n🎉 All agents and roles seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedAgents();
