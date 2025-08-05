import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Test database connection first
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Create Faculties
    console.log('📚 Creating faculties...');
    const facultyEngineering = await prisma.faculties.upsert({
      where: { name: 'Faculty of Engineering' },
      update: {},
      create: {
        name: 'Faculty of Engineering',
      },
    });

    const facultyBusiness = await prisma.faculties.upsert({
      where: { name: 'Faculty of Business' },
      update: {},
      create: {
        name: 'Faculty of Business',
      },
    });

    const facultyArts = await prisma.faculties.upsert({
      where: { name: 'Faculty of Arts & Sciences' },
      update: {},
      create: {
        name: 'Faculty of Arts & Sciences',
      },
    });

    // Create Departments
    console.log('🏢 Creating departments...');
    const deptComputerScience = await prisma.departments.upsert({
      where: { name: 'Computer Science' },
      update: {},
      create: {
        name: 'Computer Science',
        faculty_id: facultyEngineering.id,
      },
    });

    const deptMechanical = await prisma.departments.upsert({
      where: { name: 'Mechanical Engineering' },
      update: {},
      create: {
        name: 'Mechanical Engineering',
        faculty_id: facultyEngineering.id,
      },
    });

    const deptElectrical = await prisma.departments.upsert({
      where: { name: 'Electrical Engineering' },
      update: {},
      create: {
        name: 'Electrical Engineering',
        faculty_id: facultyEngineering.id,
      },
    });

    const deptMarketing = await prisma.departments.upsert({
      where: { name: 'Marketing' },
      update: {},
      create: {
        name: 'Marketing',
        faculty_id: facultyBusiness.id,
      },
    });

    const deptAccounting = await prisma.departments.upsert({
      where: { name: 'Accounting' },
      update: {},
      create: {
        name: 'Accounting',
        faculty_id: facultyBusiness.id,
      },
    });

    const deptPsychology = await prisma.departments.upsert({
      where: { name: 'Psychology' },
      update: {},
      create: {
        name: 'Psychology',
        faculty_id: facultyArts.id,
      },
    });

    // Create Admin User
    console.log('👤 Creating admin user...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.users.upsert({
      where: { email: 'admin@htu.edu.gh' },
      update: {},
      create: {
        email: 'admin@htu.edu.gh',
        password: hashedAdminPassword,
        role: 'admin',
        first_name: 'System',
        last_name: 'Administrator',
        phone_number: '+233123456789',
        is_active: true,
      },
    });

    // Create Lecturer Users
    console.log('🎓 Creating lecturer users...');
    const hashedLecturerPassword = await bcrypt.hash('lecturer123', 10);

    const lecturerUser1 = await prisma.users.upsert({
      where: { email: 'dr.smith@htu.edu.gh' },
      update: {},
      create: {
        email: 'dr.smith@htu.edu.gh',
        password: hashedLecturerPassword,
        role: 'lecturer',
        first_name: 'John',
        last_name: 'Smith',
        phone_number: '+233123456780',
        is_active: true,
      },
    });

    const lecturerUser2 = await prisma.users.upsert({
      where: { email: 'prof.johnson@htu.edu.gh' },
      update: {},
      create: {
        email: 'prof.johnson@htu.edu.gh',
        password: hashedLecturerPassword,
        role: 'lecturer',
        first_name: 'Sarah',
        last_name: 'Johnson',
        phone_number: '+233123456781',
        is_active: true,
      },
    });

    // Create Lecturer profiles
    await prisma.lecturers.upsert({
      where: { staff_id_number: 'LEC001' },
      update: {},
      create: {
        user_id: lecturerUser1.id,
        staff_id_number: 'LEC001',
        faculty_id: facultyEngineering.id,
        department_id: deptComputerScience.id,
        region: 'Greater Accra',
      },
    });

    await prisma.lecturers.upsert({
      where: { staff_id_number: 'LEC002' },
      update: {},
      create: {
        user_id: lecturerUser2.id,
        staff_id_number: 'LEC002',
        faculty_id: facultyBusiness.id,
        department_id: deptMarketing.id,
        region: 'Ashanti',
      },
    });

    // Create Companies
    console.log('🏭 Creating companies...');
    const techCorp = await prisma.companies.upsert({
      where: { name: 'TechCorp Ghana' },
      update: {},
      create: {
        name: 'TechCorp Ghana',
        address: '123 Oxford Street, Osu',
        city: 'Accra',
        region: 'Greater Accra',
        industry: 'Software Development',
        contact_email: 'hr@techcorp.com.gh',
        contact_phone: '+233302123456',
        latitude: 5.56,
        longitude: -0.2057,
        geofence_radius_meters: 100,
      },
    });

    const marketingPro = await prisma.companies.upsert({
      where: { name: 'Marketing Pro Ltd' },
      update: {},
      create: {
        name: 'Marketing Pro Ltd',
        address: '45 Ring Road East, North Labone',
        city: 'Accra',
        region: 'Greater Accra',
        industry: 'Marketing & Advertising',
        contact_email: 'info@marketingpro.gh',
        contact_phone: '+233302654321',
        latitude: 5.5692,
        longitude: -0.1778,
        geofence_radius_meters: 150,
      },
    });

    // Create Company Supervisors
    console.log('👨‍💼 Creating company supervisors...');
    const hashedSupervisorPassword = await bcrypt.hash('supervisor123', 10);

    const supervisorUser1 = await prisma.users.upsert({
      where: { email: 'michael.brown@techcorp.com.gh' },
      update: {},
      create: {
        email: 'michael.brown@techcorp.com.gh',
        password: hashedSupervisorPassword,
        role: 'company_supervisor',
        first_name: 'Michael',
        last_name: 'Brown',
        phone_number: '+233244123456',
        is_active: true,
      },
    });

    const supervisorUser2 = await prisma.users.upsert({
      where: { email: 'jane.wilson@marketingpro.gh' },
      update: {},
      create: {
        email: 'jane.wilson@marketingpro.gh',
        password: hashedSupervisorPassword,
        role: 'company_supervisor',
        first_name: 'Jane',
        last_name: 'Wilson',
        phone_number: '+233244654321',
        is_active: true,
      },
    });

    // Create Company Supervisor profiles
    await prisma.company_supervisors.upsert({
      where: { user_id: supervisorUser1.id },
      update: {},
      create: {
        user_id: supervisorUser1.id,
        company_id: techCorp.id,
        job_title: 'Senior Software Engineer',
      },
    });

    await prisma.company_supervisors.upsert({
      where: { user_id: supervisorUser2.id },
      update: {},
      create: {
        user_id: supervisorUser2.id,
        company_id: marketingPro.id,
        job_title: 'Marketing Manager',
      },
    });

    // Create Pending Students for Testing
    console.log('📝 Creating pending students...');
    const pendingStudents = [
      {
        student_id_number: 'STU2024001',
        email: 'alice.wonderland@htu.edu.gh',
        first_name: 'Alice',
        last_name: 'Wonderland',
        faculty_id: facultyEngineering.id,
        department_id: deptComputerScience.id,
        program_of_study: 'Bachelor of Science in Computer Science',
        added_by_admin_id: adminUser.id,
      },
      {
        student_id_number: 'STU2024002',
        email: 'bob.builder@htu.edu.gh',
        first_name: 'Bob',
        last_name: 'Builder',
        faculty_id: facultyEngineering.id,
        department_id: deptMechanical.id,
        program_of_study: 'Bachelor of Engineering in Mechanical Engineering',
        added_by_admin_id: adminUser.id,
      },
      {
        student_id_number: 'STU2024003',
        email: 'charlie.marketing@htu.edu.gh',
        first_name: 'Charlie',
        last_name: 'Marketing',
        faculty_id: facultyBusiness.id,
        department_id: deptMarketing.id,
        program_of_study: 'Bachelor of Business Administration in Marketing',
        added_by_admin_id: adminUser.id,
      },
      {
        student_id_number: 'STU2024004',
        email: 'diana.prince@htu.edu.gh',
        first_name: 'Diana',
        last_name: 'Prince',
        faculty_id: facultyArts.id,
        department_id: deptPsychology.id,
        program_of_study: 'Bachelor of Arts in Psychology',
        added_by_admin_id: adminUser.id,
      },
      {
        student_id_number: 'STU2024005',
        email: 'eve.electrical@htu.edu.gh',
        first_name: 'Eve',
        last_name: 'Electrical',
        faculty_id: facultyEngineering.id,
        department_id: deptElectrical.id,
        program_of_study: 'Bachelor of Engineering in Electrical Engineering',
        added_by_admin_id: adminUser.id,
      },
    ];

    for (const student of pendingStudents) {
      await prisma.pending_students.upsert({
        where: { email: student.email },
        update: {},
        create: student,
      });
    }

    // Create one verified student for testing internship features
    console.log('👨‍🎓 Creating verified student...');
    const hashedStudentPassword = await bcrypt.hash('student123', 10);

    const verifiedStudentUser = await prisma.users.upsert({
      where: { email: 'john.doe@htu.edu.gh' },
      update: {},
      create: {
        email: 'john.doe@htu.edu.gh',
        password: hashedStudentPassword,
        role: 'student',
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+233244999888',
        is_active: true,
      },
    });

    const verifiedStudent = await prisma.students.upsert({
      where: { user_id: verifiedStudentUser.id },
      update: {},
      create: {
        user_id: verifiedStudentUser.id,
        student_id_number: 'STU2023999',
        faculty_id: facultyEngineering.id,
        department_id: deptComputerScience.id,
        program_of_study: 'Bachelor of Science in Computer Science',
        is_verified: true,
        profile_complete: true,
      },
    });

    // Create an internship for the verified student
    console.log('🏢 Creating sample internship...');
    await prisma.internships.upsert({
      where: { student_id: verifiedStudent.id },
      update: {},
      create: {
        student_id: verifiedStudent.id,
        company_id: techCorp.id,
        company_supervisor_id: 1, // Will be updated with actual supervisor ID
        lecturer_id: 1, // Will be updated with actual lecturer ID
        start_date: new Date('2024-06-01'),
        end_date: new Date('2024-08-31'),
        status: 'active',
      },
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded Data Summary:');
    console.log('- 3 Faculties');
    console.log('- 6 Departments');
    console.log('- 1 Admin user');
    console.log('- 2 Lecturers');
    console.log('- 2 Companies');
    console.log('- 2 Company Supervisors');
    console.log('- 5 Pending Students');
    console.log('- 1 Verified Student with active internship');

    console.log('\n🔐 Test Credentials:');
    console.log('Admin: admin@htu.edu.gh / admin123');
    console.log('Lecturer: dr.smith@htu.edu.gh / lecturer123');
    console.log('Lecturer: prof.johnson@htu.edu.gh / lecturer123');
    console.log('Supervisor: michael.brown@techcorp.com.gh / supervisor123');
    console.log('Supervisor: jane.wilson@marketingpro.gh / supervisor123');
    console.log('Student: john.doe@htu.edu.gh / student123');

    console.log('\n📧 Pending Students for Testing:');
    console.log('- alice.wonderland@htu.edu.gh (Computer Science)');
    console.log('- bob.builder@htu.edu.gh (Mechanical Engineering)');
    console.log('- charlie.marketing@htu.edu.gh (Marketing)');
    console.log('- diana.prince@htu.edu.gh (Psychology)');
    console.log('- eve.electrical@htu.edu.gh (Electrical Engineering)');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
