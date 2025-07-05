const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleTest() {
  console.log('Starting simple database test...');
  
  try {
    // Test connection
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check existing data
    const userCount = await prisma.users.count();
    console.log(`Current users: ${userCount}`);
    
    // Try to create a simple faculty
    const testFaculty = await prisma.faculties.create({
      data: {
        name: 'Test Faculty ' + Date.now()
      }
    });
    console.log('✅ Created test faculty:', testFaculty);
    
    // Check updated count
    const facultyCount = await prisma.faculties.count();
    console.log(`Total faculties after test: ${facultyCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleTest();
