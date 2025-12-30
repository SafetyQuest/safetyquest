// ======================================================================================
// SEED 1: SETUP - Permissions, Roles, Users, Programs, Tags, User Types
// Run this FIRST
// ======================================================================================

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@safetyquest/shared';

const prisma = new PrismaClient();

let operationCount = 0;
const logOp = (message: string) => {
  operationCount++;
  console.log(`  [${operationCount.toString().padStart(3, ' ')}] ${message}`);
};

async function main() {
  console.log('🌱 SEED 1: Setup - Permissions, Roles, Users, Programs\n');

  // === 1. CLEAR ALL DATA ===
  console.log('🧹 Deleting existing data...');
  const models = [
    'userBadge', 'lessonProgress', 'lessonAttempt', 'courseAttempt', 'quizAttempt',
    'programAssignment', 'userTypeProgramAssignment',
    'quizQuestion', 'quiz',
    'lessonStep', 'lessonTag', 'courseLesson', 'courseTag', 'programCourse',
    'lesson', 'course', 'program',
    'tag', 'badge',
    'rolePermission', 'user', 'userType', 'role', 'permission'
  ] as const;

  for (const model of models) {
    await (prisma[model] as any).deleteMany({});
    logOp(`Cleared ${model}`);
  }
  console.log('✅ Cleared all data\n');

  // === 2. PERMISSIONS & ROLES ===
  console.log('🔐 Creating permissions & roles...');

  const perms = [
    { name: 'users.view', resource: 'users', action: 'view' },
    { name: 'users.create', resource: 'users', action: 'create' },
    { name: 'users.edit', resource: 'users', action: 'edit' },
    { name: 'users.delete', resource: 'users', action: 'delete' },
    { name: 'users.bulk', resource: 'users', action: 'bulk' },
    { name: 'programs.view', resource: 'programs', action: 'view' },
    { name: 'programs.create', resource: 'programs', action: 'create' },
    { name: 'programs.edit', resource: 'programs', action: 'edit' },
    { name: 'programs.delete', resource: 'programs', action: 'delete' },
    { name: 'courses.view', resource: 'courses', action: 'view' },
    { name: 'courses.create', resource: 'courses', action: 'create' },
    { name: 'courses.edit', resource: 'courses', action: 'edit' },
    { name: 'courses.delete', resource: 'courses', action: 'delete' },
    { name: 'lessons.view', resource: 'lessons', action: 'view' },
    { name: 'lessons.create', resource: 'lessons', action: 'create' },
    { name: 'lessons.edit', resource: 'lessons', action: 'edit' },
    { name: 'lessons.delete', resource: 'lessons', action: 'delete' },
    { name: 'quizzes.view', resource: 'quizzes', action: 'view' },
    { name: 'quizzes.create', resource: 'quizzes', action: 'create' },
    { name: 'quizzes.edit', resource: 'quizzes', action: 'edit' },
    { name: 'quizzes.delete', resource: 'quizzes', action: 'delete' },
    { name: 'media.view', resource: 'media', action: 'view' },
    { name: 'media.upload', resource: 'media', action: 'upload' },
    { name: 'media.delete', resource: 'media', action: 'delete' },
    { name: 'badges.view', resource: 'badges', action: 'view' },
    { name: 'badges.create', resource: 'badges', action: 'create' },
    { name: 'badges.edit', resource: 'badges', action: 'edit' },
    { name: 'badges.delete', resource: 'badges', action: 'delete' },
    { name: 'settings.user-types.view', resource: 'settings', action: 'view' },
    { name: 'settings.user-types.create', resource: 'settings', action: 'create' },
    { name: 'settings.user-types.edit', resource: 'settings', action: 'edit' },
    { name: 'settings.user-types.delete', resource: 'settings', action: 'delete' },
    { name: 'settings.roles.view', resource: 'settings', action: 'view' },
    { name: 'settings.roles.create', resource: 'settings', action: 'create' },
    { name: 'settings.roles.edit', resource: 'settings', action: 'edit' },
    { name: 'settings.roles.delete', resource: 'settings', action: 'delete' },
    { name: 'settings.tags.view', resource: 'settings', action: 'view' },
    { name: 'settings.tags.create', resource: 'settings', action: 'create' },
    { name: 'settings.tags.edit', resource: 'settings', action: 'edit' },
    { name: 'settings.tags.delete', resource: 'settings', action: 'delete' },
    { name: 'dashboard.view', resource: 'dashboard', action: 'view' },
    { name: 'permissions.view', resource: 'permissions', action: 'view' },
    { name: 'reports.view', resource: 'reports', action: 'view' },
    { name: 'reports.export', resource: 'reports', action: 'export' },
  ];

  const createdPerms = [];
  for (const p of perms) {
    const created = await prisma.permission.create({ data: p });
    createdPerms.push(created);
    logOp(`Permission: ${p.name}`);
  }

  const admin = await prisma.role.create({ data: { name: 'ADMIN', slug: 'admin', description: 'Full access', isSystem: true } });
  const instructor = await prisma.role.create({ data: { name: 'INSTRUCTOR', slug: 'instructor', description: 'Content management', isSystem: true } });
  const learner = await prisma.role.create({ data: { name: 'LEARNER', slug: 'learner', description: 'Learning access', isSystem: true } });
  const safety = await prisma.role.create({ data: { name: 'Safety Officer', slug: 'safety-officer', description: 'View & report access', isSystem: false } });
  const reviewer = await prisma.role.create({ data: { name: 'Content Reviewer', slug: 'content-reviewer', description: 'Review & edit content', isSystem: false } });
  logOp('Roles created');

  const assignPerms = async (roleId: string, permNames: string[], roleName: string) => {
    const permsToAssign = createdPerms.filter(p => permNames.includes(p.name));
    for (const p of permsToAssign) {
      await prisma.rolePermission.create({ data: { roleId, permissionId: p.id } });
    }
    logOp(`${roleName}: ${permsToAssign.length} permissions`);
  };

  await assignPerms(admin.id, perms.map(p => p.name), 'ADMIN');
  await assignPerms(instructor.id, [
    'users.view',
    'programs.view', 'programs.create', 'programs.edit',
    'courses.view', 'courses.create', 'courses.edit',
    'lessons.view', 'lessons.create', 'lessons.edit',
    'quizzes.view', 'quizzes.create', 'quizzes.edit',
    'media.view', 'media.upload',
    'badges.view',
    'settings.tags.view', 'settings.tags.create', 'settings.tags.edit',
    'reports.view'
  ], 'INSTRUCTOR');

  await assignPerms(learner.id, [
    'programs.view',
    'courses.view',
    'lessons.view',
    'quizzes.view',
    'badges.view'
  ], 'LEARNER');

  await assignPerms(safety.id, [
    'users.view',
    'programs.view',
    'courses.view',
    'lessons.view',
    'quizzes.view',
    'media.view',
    'badges.view',
    'settings.user-types.view',
    'settings.roles.view',
    'settings.tags.view',
    'dashboard.view',
    'permissions.view',
    'reports.view',
    'reports.export'
  ], 'SAFETY OFFICER');

  await assignPerms(reviewer.id, [
    'programs.view', 'programs.edit',
    'courses.view', 'courses.edit',
    'lessons.view', 'lessons.edit',
    'quizzes.view', 'quizzes.edit',
    'media.view'
  ], 'CONTENT REVIEWER');
  console.log('');

  // === 3. USER TYPES & TAGS ===
  console.log('👥 Creating user types & tags...');

  const userTypes = {
    newHire: await prisma.userType.create({ data: { name: 'New Hire', slug: 'new-hire', description: 'First 90 days' } }),
    permanent: await prisma.userType.create({ data: { name: 'Permanent', slug: 'permanent', description: 'Full-time' } }),
    contractor: await prisma.userType.create({ data: { name: 'Contractor', slug: 'contractor', description: 'External' } }),
    supervisor: await prisma.userType.create({ data: { name: 'Supervisor', slug: 'supervisor', description: 'Leaders' } })
  };
  logOp('User types created');

  const tags = {
    fire: await prisma.tag.create({ data: { name: 'Fire Safety', slug: 'fire-safety' } }),
    emergency: await prisma.tag.create({ data: { name: 'Emergency', slug: 'emergency' } }),
    ppe: await prisma.tag.create({ data: { name: 'PPE', slug: 'ppe' } }),
    hazmat: await prisma.tag.create({ data: { name: 'Hazmat', slug: 'hazmat' } }),
    ergo: await prisma.tag.create({ data: { name: 'Ergonomics', slug: 'ergonomics' } }),
    firstAid: await prisma.tag.create({ data: { name: 'First Aid', slug: 'first-aid' } })
  };
  logOp('Tags created');
  console.log('✅ User types & 6 tags\n');

  // === 4. PROGRAMS ===
  console.log('📚 Creating 3 Programs...');

  const programs = {
    core: await prisma.program.create({
      data: {
        title: 'Core Safety Procedures',
        slug: 'core-safety',
        description: 'Essential safety protocols for all personnel',
        isActive: true
      }
    }),
    hazard: await prisma.program.create({
      data: {
        title: 'Hazard & Risk Management',
        slug: 'hazard-risk-mgmt',
        description: 'Identify, assess, and control workplace hazards',
        isActive: true
      }
    }),
    jobHealth: await prisma.program.create({
      data: {
        title: 'Job-Specific & Health Topics',
        slug: 'job-health',
        description: 'Role-specific safety and wellness practices',
        isActive: true
      }
    })
  };
  logOp('Programs created');
  console.log('✅ 3 Programs created\n');

  // === 5. USERS ===
  console.log('👤 Creating 10 users with full organizational data...');

  const usersData = [
    {
      email: 'admin@safetyquest.com',
      name: 'Alex Rivera',
      password: 'admin123',
      role: 'ADMIN',
      roleId: admin.id,
      userTypeId: userTypes.permanent.id,
      section: 'Executive Leadership',
      department: 'Corporate Safety',
      designation: 'Chief Safety Officer',
      supervisor: null,
      manager: null
    },
    {
      email: 'maria.chen@safetyquest.com',
      name: 'Maria Chen',
      password: 'instr123',
      role: 'INSTRUCTOR',
      roleId: instructor.id,
      userTypeId: userTypes.permanent.id,
      section: 'Training Division',
      department: 'Learning & Development',
      designation: 'Senior Safety Trainer',
      supervisor: 'Alex Rivera',
      manager: 'Alex Rivera'
    },
    {
      email: 'david.kim@safetyquest.com',
      name: 'David Kim',
      password: 'instr456',
      role: 'INSTRUCTOR',
      roleId: instructor.id,
      userTypeId: userTypes.permanent.id,
      section: 'Field Operations',
      department: 'Operations',
      designation: 'Field Safety Coordinator',
      supervisor: 'Maria Chen',
      manager: 'Alex Rivera'
    },
    {
      email: 'jamie.taylor@safetyquest.com',
      name: 'Jamie Taylor',
      password: 'safety123',
      role: 'Safety Officer',
      roleId: safety.id,
      userTypeId: userTypes.supervisor.id,
      section: 'Plant Safety',
      department: 'EHS',
      designation: 'Plant Safety Officer',
      supervisor: 'Alex Rivera',
      manager: 'Alex Rivera'
    },
    {
      email: 'sam.wilson@safetyquest.com',
      name: 'Sam Wilson',
      password: 'review123',
      role: 'Content Reviewer',
      roleId: reviewer.id,
      userTypeId: userTypes.permanent.id,
      section: 'Content Quality',
      department: 'Learning & Development',
      designation: 'Instructional Designer',
      supervisor: 'Maria Chen',
      manager: 'Alex Rivera'
    },
    {
      email: 'john.learner@safetyquest.com',
      name: 'John Learner',
      password: 'learner123',
      role: 'LEARNER',
      roleId: learner.id,
      userTypeId: userTypes.newHire.id,
      section: 'Assembly Line A',
      department: 'Manufacturing',
      designation: 'Production Operator',
      supervisor: 'Lisa Rodriguez',
      manager: 'Robert Zhang'
    },
    {
      email: 'sarah.johnson@safetyquest.com',
      name: 'Sarah Johnson',
      password: 'learner456',
      role: 'LEARNER',
      roleId: learner.id,
      userTypeId: userTypes.permanent.id,
      section: 'Warehouse',
      department: 'Logistics',
      designation: 'Material Handler',
      supervisor: 'Tom Harris',
      manager: 'Patricia Wong'
    },
    {
      email: 'mike.peterson@safetyquest.com',
      name: 'Mike Peterson',
      password: 'learner789',
      role: 'LEARNER',
      roleId: learner.id,
      userTypeId: userTypes.contractor.id,
      section: 'Maintenance',
      department: 'Facilities',
      designation: 'HVAC Technician',
      supervisor: 'Elena Martinez',
      manager: 'David Kim'
    },
    {
      email: 'lisa.rodriguez@safetyquest.com',
      name: 'Lisa Rodriguez',
      password: 'superv123',
      role: 'LEARNER',
      roleId: learner.id,
      userTypeId: userTypes.supervisor.id,
      section: 'Assembly Line A',
      department: 'Manufacturing',
      designation: 'Shift Supervisor',
      supervisor: 'Robert Zhang',
      manager: 'Robert Zhang'
    },
    {
      email: 'robert.zhang@safetyquest.com',
      name: 'Robert Zhang',
      password: 'mgr123',
      role: 'LEARNER',
      roleId: learner.id,
      userTypeId: userTypes.supervisor.id,
      section: 'Manufacturing Ops',
      department: 'Operations',
      designation: 'Operations Manager',
      supervisor: 'Alex Rivera',
      manager: 'Alex Rivera'
    }
  ];

  const createdUsers: { id: string; name: string; userTypeId: string }[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash: await hashPassword(u.password),
        role: u.role,
        roleId: u.roleId,
        userTypeId: u.userTypeId,
        section: u.section,
        department: u.department,
        designation: u.designation,
        supervisor: u.supervisor,
        manager: u.manager,
        xp: Math.floor(Math.random() * 500),
        level: 1 + Math.floor(Math.random() * 4),
        streak: Math.floor(Math.random() * 7)
      }
    });
    createdUsers.push({ id: user.id, name: u.name, userTypeId: u.userTypeId });
    logOp(`User: ${u.name} (${u.role})`);
  }
  console.log('✅ 10 users created\n');

  // === 6. USER TYPE → PROGRAM ASSIGNMENTS ===
  console.log('🔗 Creating user-type program assignments...');

  const userTypeProgramAssignments = [
    { userTypeId: userTypes.newHire.id, programId: programs.core.id },
    { userTypeId: userTypes.permanent.id, programId: programs.core.id },
    { userTypeId: userTypes.permanent.id, programId: programs.hazard.id },
    { userTypeId: userTypes.contractor.id, programId: programs.core.id },
    { userTypeId: userTypes.contractor.id, programId: programs.jobHealth.id },
    { userTypeId: userTypes.supervisor.id, programId: programs.core.id },
    { userTypeId: userTypes.supervisor.id, programId: programs.hazard.id },
    { userTypeId: userTypes.supervisor.id, programId: programs.jobHealth.id }
  ];

  await prisma.userTypeProgramAssignment.createMany({ data: userTypeProgramAssignments });
  logOp(`UserTypeProgramAssignments: ${userTypeProgramAssignments.length}`);
  console.log('✅ User type → program assignments\n');

  // === 7. INHERITED PROGRAM ASSIGNMENTS ===
  console.log('🔗 Generating inherited program assignments for users...');

  for (const { id: userTypeId } of Object.values(userTypes)) {
    const userTypePrograms = userTypeProgramAssignments
      .filter(utp => utp.userTypeId === userTypeId)
      .map(utp => utp.programId);

    if (userTypePrograms.length === 0) continue;

    const usersInType = createdUsers.filter(u => u.userTypeId === userTypeId);
    for (const user of usersInType) {
      const assignments = userTypePrograms.map(programId => ({
        userId: user.id,
        programId,
        source: 'usertype' as const,
        assignedBy: null
      }));
      await prisma.programAssignment.createMany({ data: assignments });
      logOp(`Assigned ${assignments.length} programs to ${user.name}`);
    }
  }
  console.log('✅ Program assignments created\n');

  // === VALIDATION ===
  console.log('🔍 Validating Seed 1...');
  const [
    permCount, roleCount, userTypeCount, tagCount, 
    programCount, userCount, progAssignCount
  ] = await Promise.all([
    prisma.permission.count(),
    prisma.role.count(),
    prisma.userType.count(),
    prisma.tag.count(),
    prisma.program.count(),
    prisma.user.count(),
    prisma.programAssignment.count()
  ]);

  console.log(`  ✅ Permissions: ${permCount}`);
  console.log(`  ✅ Roles: ${roleCount}`);
  console.log(`  ✅ User Types: ${userTypeCount}`);
  console.log(`  ✅ Tags: ${tagCount}`);
  console.log(`  ✅ Programs: ${programCount}`);
  console.log(`  ✅ Users: ${userCount}`);
  console.log(`  ✅ Program Assignments: ${progAssignCount}`);

  console.log('\n🎉 SEED 1 COMPLETE! Run seed-2-core-courses.ts next\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed 1 failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });