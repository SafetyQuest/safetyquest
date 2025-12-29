// ============================================
// SEED SCRIPT FOR 3-TABLE PERMISSION SYSTEM
// Azure SQL Compatible
// ============================================
// File: packages/database/seed-permissions-3table.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPermissionsSystem() {
  console.log('🌱 Seeding 3-table permission system...');

  // ============================================
  // STEP 1: Create all permissions
  // ============================================
  console.log('\n📋 Creating permissions...');
  
  const permissions = [
    // User Management
    { name: 'users.view', resource: 'users', action: 'view', description: 'View users list' },
    { name: 'users.create', resource: 'users', action: 'create', description: 'Create new users' },
    { name: 'users.edit', resource: 'users', action: 'edit', description: 'Edit user details' },
    { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
    { name: 'users.bulk', resource: 'users', action: 'bulk', description: 'Bulk user actions' },
    
    // Programs
    { name: 'programs.view', resource: 'programs', action: 'view', description: 'View programs' },
    { name: 'programs.create', resource: 'programs', action: 'create', description: 'Create programs' },
    { name: 'programs.edit', resource: 'programs', action: 'edit', description: 'Edit programs' },
    { name: 'programs.delete', resource: 'programs', action: 'delete', description: 'Delete programs' },
    
    // Courses
    { name: 'courses.view', resource: 'courses', action: 'view', description: 'View courses' },
    { name: 'courses.create', resource: 'courses', action: 'create', description: 'Create courses' },
    { name: 'courses.edit', resource: 'courses', action: 'edit', description: 'Edit courses' },
    { name: 'courses.delete', resource: 'courses', action: 'delete', description: 'Delete courses' },
    
    // Lessons
    { name: 'lessons.view', resource: 'lessons', action: 'view', description: 'View lessons' },
    { name: 'lessons.create', resource: 'lessons', action: 'create', description: 'Create lessons' },
    { name: 'lessons.edit', resource: 'lessons', action: 'edit', description: 'Edit lessons' },
    { name: 'lessons.delete', resource: 'lessons', action: 'delete', description: 'Delete lessons' },
    
    // Quizzes
    { name: 'quizzes.view', resource: 'quizzes', action: 'view', description: 'View quizzes' },
    { name: 'quizzes.create', resource: 'quizzes', action: 'create', description: 'Create quizzes' },
    { name: 'quizzes.edit', resource: 'quizzes', action: 'edit', description: 'Edit quizzes' },
    { name: 'quizzes.delete', resource: 'quizzes', action: 'delete', description: 'Delete quizzes' },
    
    // Media
    { name: 'media.view', resource: 'media', action: 'view', description: 'View media library' },
    { name: 'media.upload', resource: 'media', action: 'upload', description: 'Upload media' },
    { name: 'media.delete', resource: 'media', action: 'delete', description: 'Delete media' },
    
    // Badges
    { name: 'badges.view', resource: 'badges', action: 'view', description: 'View badges' },
    { name: 'badges.create', resource: 'badges', action: 'create', description: 'Create badges' },
    { name: 'badges.edit', resource: 'badges', action: 'edit', description: 'Edit badges' },
    { name: 'badges.delete', resource: 'badges', action: 'delete', description: 'Delete badges' },
    
    // Settings - User Types
    { name: 'settings.user-types.view', resource: 'settings', action: 'view', description: 'View user types' },
    { name: 'settings.user-types.create', resource: 'settings', action: 'create', description: 'Create user types' },
    { name: 'settings.user-types.edit', resource: 'settings', action: 'edit', description: 'Edit user types' },
    { name: 'settings.user-types.delete', resource: 'settings', action: 'delete', description: 'Delete user types' },
    
    // Settings - Roles
    { name: 'settings.roles.view', resource: 'settings', action: 'view', description: 'View roles' },
    { name: 'settings.roles.create', resource: 'settings', action: 'create', description: 'Create roles' },
    { name: 'settings.roles.edit', resource: 'settings', action: 'edit', description: 'Edit roles' },
    { name: 'settings.roles.delete', resource: 'settings', action: 'delete', description: 'Delete roles' },
    
    // Settings - Tags
    { name: 'settings.tags.view', resource: 'settings', action: 'view', description: 'View tags' },
    { name: 'settings.tags.create', resource: 'settings', action: 'create', description: 'Create tags' },
    { name: 'settings.tags.edit', resource: 'settings', action: 'edit', description: 'Edit tags' },
    { name: 'settings.tags.delete', resource: 'settings', action: 'delete', description: 'Delete tags' },

    // Dashboard
    { name: 'dashboard.view', resource: 'dashboard', action: 'view' },

    // Permissions (also part of settings)
    { name: 'permissions.view', resource: 'permissions', action: 'view' },
    
    // Reports
    { name: 'reports.view', resource: 'reports', action: 'view', description: 'View reports' },
    { name: 'reports.export', resource: 'reports', action: 'export', description: 'Export reports' },
  ];

  let createdCount = 0;
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm
    });
    createdCount++;
  }
  console.log(`✅ Created/Updated ${createdCount} permissions`);

  // ============================================
  // STEP 2: Create roles
  // ============================================
  console.log('\n👥 Creating roles...');
  
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'ADMIN',
      slug: 'admin',
      description: 'Full system access with all permissions',
      isSystem: true
    }
  });
  console.log('✅ Created ADMIN role');

  const instructorRole = await prisma.role.upsert({
    where: { slug: 'instructor' },
    update: {},
    create: {
      name: 'INSTRUCTOR',
      slug: 'instructor',
      description: 'Can create and manage content but not users or settings',
      isSystem: true
    }
  });
  console.log('✅ Created INSTRUCTOR role');

  const learnerRole = await prisma.role.upsert({
    where: { slug: 'learner' },
    update: {},
    create: {
      name: 'LEARNER',
      slug: 'learner',
      description: 'Can only access assigned learning content',
      isSystem: true
    }
  });
  console.log('✅ Created LEARNER role');

  // ============================================
  // STEP 3: Assign permissions to ADMIN (all)
  // ============================================
  console.log('\n🔑 Assigning permissions to ADMIN...');
  
  const allPermissions = await prisma.permission.findMany();
  let adminPermCount = 0;
  
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id
      }
    });
    adminPermCount++;
  }
  console.log(`✅ Assigned ${adminPermCount} permissions to ADMIN`);

  // ============================================
  // STEP 4: Assign permissions to INSTRUCTOR
  // ============================================
  console.log('\n🎓 Assigning permissions to INSTRUCTOR...');
  
  const instructorPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        // Can view users
        { name: 'users.view' },
        
        // Can manage programs (view, create, edit)
        { resource: 'programs', action: { in: ['view', 'create', 'edit'] } },
        
        // Can manage courses (view, create, edit)
        { resource: 'courses', action: { in: ['view', 'create', 'edit'] } },
        
        // Can manage lessons (view, create, edit)
        { resource: 'lessons', action: { in: ['view', 'create', 'edit'] } },
        
        // Can manage quizzes (view, create, edit)
        { resource: 'quizzes', action: { in: ['view', 'create', 'edit'] } },
        
        // Can view and upload media
        { resource: 'media', action: { in: ['view', 'upload'] } },
        
        // Can view badges
        { resource: 'badges', action: 'view' },
        
        // Can view and manage tags
        { name: { in: ['settings.tags.view', 'settings.tags.create', 'settings.tags.edit'] } },
        
        // Can view reports
        { name: 'reports.view' }
      ]
    }
  });

  let instructorPermCount = 0;
  for (const perm of instructorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: instructorRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: instructorRole.id,
        permissionId: perm.id
      }
    });
    instructorPermCount++;
  }
  console.log(`✅ Assigned ${instructorPermCount} permissions to INSTRUCTOR`);

  // ============================================
  // STEP 5: Assign permissions to LEARNER
  // ============================================
  console.log('\n📚 Assigning permissions to LEARNER...');
  
  const learnerPermissions = await prisma.permission.findMany({
    where: {
      resource: { in: ['programs', 'courses', 'lessons', 'quizzes', 'badges'] },
      action: 'view'
    }
  });

  let learnerPermCount = 0;
  for (const perm of learnerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: learnerRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: learnerRole.id,
        permissionId: perm.id
      }
    });
    learnerPermCount++;
  }
  console.log(`✅ Assigned ${learnerPermCount} permissions to LEARNER`);

  // ============================================
  // STEP 6: Migrate existing users to new system
  // ============================================
  console.log('\n🔄 Migrating existing users to new role system...');
  
  // Note: Only run this if you have a 'role' string field in User model
  // If you don't have existing users, skip this section
  
  try {
    // Migrate ADMIN users
    const adminCount = await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: { roleId: adminRole.id }
    });
    console.log(`✅ Migrated ${adminCount.count} ADMIN users`);

    // Migrate INSTRUCTOR users
    const instructorCount = await prisma.user.updateMany({
      where: { role: 'INSTRUCTOR' },
      data: { roleId: instructorRole.id }
    });
    console.log(`✅ Migrated ${instructorCount.count} INSTRUCTOR users`);

    // Migrate LEARNER users
    const learnerCount = await prisma.user.updateMany({
      where: { role: 'LEARNER' },
      data: { roleId: learnerRole.id }
    });
    console.log(`✅ Migrated ${learnerCount.count} LEARNER users`);
  } catch (error) {
    console.log('⚠️  User migration skipped (no existing role field or no users yet)');
  }

  console.log('\n✨ Permission system seeding complete!');
  console.log('\n📊 Summary:');
  console.log(`   - ${createdCount} permissions created`);
  console.log(`   - 3 roles created (ADMIN, INSTRUCTOR, LEARNER)`);
  console.log(`   - ADMIN: ${adminPermCount} permissions`);
  console.log(`   - INSTRUCTOR: ${instructorPermCount} permissions`);
  console.log(`   - LEARNER: ${learnerPermCount} permissions`);
}

seedPermissionsSystem()
  .catch((e) => {
    console.error('❌ Error seeding permission system:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ============================================
// HOW TO RUN THIS SCRIPT
// ============================================

// Option 1: Direct run
// npx tsx packages/database/seed-permissions-3table.ts

// Option 2: Add to package.json
// {
//   "scripts": {
//     "seed:permissions": "tsx packages/database/seed-permissions-3table.ts"
//   }
// }
// Then run: npm run seed:permissions