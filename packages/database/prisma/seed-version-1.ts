// ======================================================================================
// SAFETYQUEST LMS - COMPLETE WORKING SEED (Fixed Permissions)
// ======================================================================================

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@safetyquest/shared';

const prisma = new PrismaClient();

// Helper functions
const h = (i: string, im: string, s: any[]) => JSON.stringify({ instruction: i, imageUrl: im, hotspots: s.map((x, idx) => ({ x: 20+(idx*15), y: 30+(idx*12), radius: 8, label: x.l, xp: x.x })) });
const d = (i: string, items: string[], t: any[]) => JSON.stringify({ instruction: i, items: items.map((x, idx) => ({ id: `i${idx}`, text: x })), targets: t.map((x, idx) => ({ id: `t${idx}`, text: x.t, correctItems: x.c, xp: x.x })) });
const m = (i: string, p: string[], x: number = 2) => JSON.stringify({ instruction: i, pairs: p.flatMap((t, idx) => idx % 2 === 0 && p[idx+1] ? [{ id: Math.floor(idx/2)+1, text: t, xp: x }, { id: Math.floor(idx/2)+1, text: p[idx+1], xp: x }] : []) });
const ps = (i: string, im: any[]) => JSON.stringify({ instruction: i, images: im.map((x, idx) => ({ url: `/images/s${idx}.jpg`, isCorrect: x.c, label: x.l, xp: x.x })) });
const sc = (q: string, o: any[]) => JSON.stringify({ question: q, options: o.map((x, idx) => ({ id: String.fromCharCode(97+idx), text: x.t, correct: x.c, points: x.p || (x.c ? 5 : 0) })) });
const mat = (q: string, p: any[]) => JSON.stringify({ question: q, pairs: p });
const seq = (q: string, items: string[], ppi: number) => JSON.stringify({ question: q, items, correctOrder: items.map((_, i) => i), points: ppi });
const tf = (q: string, c: boolean, e: string, p: number) => JSON.stringify({ question: q, correctAnswer: c, explanation: e, points: p });
const mc = (q: string, o: any[], p: number) => JSON.stringify({ question: q, options: o.map((x, idx) => ({ id: String.fromCharCode(97+idx), text: x.t, correct: x.c })), points: p });
const ta = (q: string, it: any[], cats: string[], time: number) => JSON.stringify({ question: q, timeLimit: time, items: it.map((x, idx) => ({ id: `i${idx}`, text: x.t, category: x.c, points: x.p })), categories: cats });

async function main() {
  console.log('🌱 Starting Complete Seed\n');

  // DELETE ALL
  console.log('🧹 Deleting data...');
  await prisma.userBadge.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lessonAttempt.deleteMany();
  await prisma.courseAttempt.deleteMany();
  await prisma.programAssignment.deleteMany();
  await prisma.userTypeProgramAssignment.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonStep.deleteMany();
  await prisma.lessonTag.deleteMany();
  await prisma.courseLesson.deleteMany();
  await prisma.courseTag.deleteMany();
  await prisma.programCourse.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.program.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.userType.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  console.log('✅ Cleared\n');

  // PERMISSIONS
  console.log('🔐 Creating permissions...');
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
  
  const cp = [];
  for (const p of perms) {
    const created = await prisma.permission.create({ data: p });
    cp.push(created);
  }
  console.log(`✅ ${cp.length} permissions`);
  
  const admin = await prisma.role.create({ data: { name: 'ADMIN', slug: 'admin', description: 'Full access', isSystem: true } });
  const instructor = await prisma.role.create({ data: { name: 'INSTRUCTOR', slug: 'instructor', description: 'Content management', isSystem: true } });
  const learner = await prisma.role.create({ data: { name: 'LEARNER', slug: 'learner', description: 'Learning access', isSystem: true } });
  const safety = await prisma.role.create({ data: { name: 'Safety Officer', slug: 'safety-officer', description: 'View & report access', isSystem: false } });
  const reviewer = await prisma.role.create({ data: { name: 'Content Reviewer', slug: 'content-reviewer', description: 'Review & edit content', isSystem: false } });
  console.log('✅ 5 roles');
  
  // Assign all permissions to ADMIN
  for (const p of cp) {
    await prisma.rolePermission.create({ data: { roleId: admin.id, permissionId: p.id } });
  }
  console.log('✅ ADMIN: All permissions');

  // Assign permissions to INSTRUCTOR
  const instructorPermNames = [
    'users.view',
    'programs.view', 'programs.create', 'programs.edit',
    'courses.view', 'courses.create', 'courses.edit',
    'lessons.view', 'lessons.create', 'lessons.edit',
    'quizzes.view', 'quizzes.create', 'quizzes.edit',
    'media.view', 'media.upload',
    'badges.view',
    'settings.tags.view', 'settings.tags.create', 'settings.tags.edit',
    'reports.view'
  ];
  const instructorPerms = cp.filter(p => instructorPermNames.includes(p.name));
  for (const p of instructorPerms) {
    await prisma.rolePermission.create({ data: { roleId: instructor.id, permissionId: p.id } });
  }
  console.log(`✅ INSTRUCTOR: ${instructorPerms.length} permissions`);

  // Assign permissions to LEARNER
  const learnerPermNames = [
    'programs.view',
    'courses.view',
    'lessons.view',
    'quizzes.view',
    'badges.view'
  ];
  const learnerPerms = cp.filter(p => learnerPermNames.includes(p.name));
  for (const p of learnerPerms) {
    await prisma.rolePermission.create({ data: { roleId: learner.id, permissionId: p.id } });
  }
  console.log(`✅ LEARNER: ${learnerPerms.length} permissions`);

  // Assign permissions to SAFETY OFFICER (view all + export reports)
  const safetyPermNames = [
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
  ];
  const safetyPerms = cp.filter(p => safetyPermNames.includes(p.name));
  for (const p of safetyPerms) {
    await prisma.rolePermission.create({ data: { roleId: safety.id, permissionId: p.id } });
  }
  console.log(`✅ SAFETY OFFICER: ${safetyPerms.length} permissions`);

  // Assign permissions to CONTENT REVIEWER (view and edit content only)
  const reviewerPermNames = [
    'programs.view', 'programs.edit',
    'courses.view', 'courses.edit',
    'lessons.view', 'lessons.edit',
    'quizzes.view', 'quizzes.edit',
    'media.view'
  ];
  const reviewerPerms = cp.filter(p => reviewerPermNames.includes(p.name));
  for (const p of reviewerPerms) {
    await prisma.rolePermission.create({ data: { roleId: reviewer.id, permissionId: p.id } });
  }
  console.log(`✅ CONTENT REVIEWER: ${reviewerPerms.length} permissions\n`);

  // USER TYPES & TAGS
  console.log('👥 Creating user types & tags...');
  const newHire = await prisma.userType.create({ data: { name: 'New Hire', slug: 'new-hire', description: 'First 90 days' } });
  const permanent = await prisma.userType.create({ data: { name: 'Permanent', slug: 'permanent', description: 'Full-time' } });
  const contractor = await prisma.userType.create({ data: { name: 'Contractor', slug: 'contractor', description: 'External' } });
  const supervisor = await prisma.userType.create({ data: { name: 'Supervisor', slug: 'supervisor', description: 'Leaders' } });
  
  const fireTag = await prisma.tag.create({ data: { name: 'Fire Safety', slug: 'fire-safety' } });
  const emergencyTag = await prisma.tag.create({ data: { name: 'Emergency', slug: 'emergency' } });
  const ppeTag = await prisma.tag.create({ data: { name: 'PPE', slug: 'ppe' } });
  const hazmatTag = await prisma.tag.create({ data: { name: 'Hazmat', slug: 'hazmat' } });
  const ergoTag = await prisma.tag.create({ data: { name: 'Ergonomics', slug: 'ergonomics' } });
  const firstAidTag = await prisma.tag.create({ data: { name: 'First Aid', slug: 'first-aid' } });
  console.log('✅ User types & tags\n');

  // USERS
  console.log('👤 Creating users...');
  await prisma.user.create({ data: { email: 'admin@safetyquest.com', name: 'Admin', passwordHash: await hashPassword('admin123'), role: 'ADMIN', roleId: admin.id } });
  await prisma.user.create({ data: { email: 'learner@safetyquest.com', name: 'John Learner', passwordHash: await hashPassword('learner123'), role: 'LEARNER', roleId: learner.id, userTypeId: newHire.id } });
  console.log('✅ Users created\n');

  console.log('📚 Creating Programs, Courses, Lessons...\n');

  // PROGRAM 1: CORE SAFETY
  const p1 = await prisma.program.create({ data: { title: 'Core Safety Procedures', slug: 'core-safety', description: 'Essential safety protocols', isActive: true } });
  console.log('📘 Program 1: Core Safety Procedures');
  
  // COURSE 1.1
  const c1_1 = await prisma.course.create({ data: { title: 'Fire Safety Fundamentals', slug: 'fire-safety-fundamentals', description: 'Fire safety basics', difficulty: 'Beginner' } });
  await prisma.courseTag.createMany({ data: [{ courseId: c1_1.id, tagId: fireTag.id }, { courseId: c1_1.id, tagId: emergencyTag.id }] });
  
  // LESSON 1.1.1
  const l1_1_1q = await prisma.quiz.create({ data: { title: 'Fire Hazards Quiz', slug: 'fire-hazards-quiz', type: 'lesson', passingScore: 70 } });
  const l1_1_1 = await prisma.lesson.create({ data: { title: 'Understanding Fire Hazards', slug: 'fire-hazards', description: 'Identify fire hazards', difficulty: 'Beginner', quizId: l1_1_1q.id } });
  await prisma.lessonTag.create({ data: { lessonId: l1_1_1.id, tagId: fireTag.id } });
  
  await prisma.lessonStep.createMany({ data: [
    { lessonId: l1_1_1.id, order: 0, type: 'content', contentType: 'text', contentData: JSON.stringify({ html: '<h2>Fire Hazards</h2><p>Fire requires heat, fuel, oxygen. Remove one element to prevent fire.</p><ul><li>Heat: sparks, flames</li><li>Fuel: combustibles</li><li>Oxygen: in air</li></ul>' }) },
    { lessonId: l1_1_1.id, order: 1, type: 'game', gameType: 'hotspot', gameConfig: h('Click fire hazards', '/images/workplace1.jpg', [{l:'Overload',x:5},{l:'Blocked exit',x:5},{l:'Chemicals',x:4},{l:'Cord',x:3}]) },
    { lessonId: l1_1_1.id, order: 2, type: 'content', contentType: 'video', contentData: JSON.stringify({ url: '/videos/fire-triangle.mp4', thumbnail: '/images/ft.jpg', duration: 180 }) },
    { lessonId: l1_1_1.id, order: 3, type: 'game', gameType: 'drag-drop', gameConfig: d('Match hazards', ['Cord','Rags','Strip','Chemicals','Dust'], [{t:'Electrical',c:['Cord','Strip'],x:3},{t:'Combustible',c:['Rags','Chemicals','Dust'],x:3}]) },
    { lessonId: l1_1_1.id, order: 4, type: 'game', gameType: 'memory-flip', gameConfig: m('Match hazard & prevention', ['Overload','Use outlets','Exit','Keep clear','Liquids','Containers','Housekeeping','Cleaning'], 2) },
    { lessonId: l1_1_1.id, order: 5, type: 'content', contentType: 'text', contentData: JSON.stringify({ html: '<h3>Common Hazards</h3><p>Electrical: overloads, damaged cords</p><p>Combustible: paper, liquids, dust</p>' }) },
    { lessonId: l1_1_1.id, order: 6, type: 'game', gameType: 'photo-swipe', gameConfig: ps('Right=hazard, Left=safe', [{l:'Overload',c:true,x:3},{l:'Proper',c:false,x:3},{l:'Blocked',c:true,x:3},{l:'Clear',c:false,x:3}]) },
    { lessonId: l1_1_1.id, order: 7, type: 'game', gameType: 'scenario', gameConfig: sc('Materials near heater?', [{t:'Ignore',c:false},{t:'Move and report',c:true,p:5},{t:'Wait',c:false}]) },
    { lessonId: l1_1_1.id, order: 8, type: 'game', gameType: 'matching', gameConfig: mat('Match triangle elements', [{l:'Heat',r:'Ignition',p:3},{l:'Fuel',r:'Combustible',p:3},{l:'Oxygen',r:'Supports fire',p:3}]) },
    { lessonId: l1_1_1.id, order: 9, type: 'game', gameType: 'sequence', gameConfig: seq('Order response', ['Assess','Remove if safe','Report','Document','Follow up'], 3) },
    { lessonId: l1_1_1.id, order: 10, type: 'game', gameType: 'true-false', gameConfig: tf('Fire only spreads by contact', false, 'Spreads via radiation, convection, conduction', 4) },
    { lessonId: l1_1_1.id, order: 11, type: 'game', gameType: 'multiple-choice', gameConfig: mc('NOT in fire triangle?', [{t:'Heat',c:false},{t:'Water',c:true},{t:'Fuel',c:false},{t:'Oxygen',c:false}], 5) },
    { lessonId: l1_1_1.id, order: 12, type: 'game', gameType: 'time-attack-sorting', gameConfig: ta('Sort High/Low risk (60s)', [{t:'Gas',c:'high',p:2},{t:'Paper',c:'low',p:2},{t:'Welding',c:'high',p:2},{t:'Water',c:'low',p:2},{t:'Battery',c:'high',p:2}], ['high','low'], 60) }
  ]});

  await prisma.quizQuestion.createMany({ data: [
    { quizId: l1_1_1q.id, order: 0, difficulty: 2, gameType: 'hotspot', gameConfig: h('ID hazards', '/images/q1.jpg', [{l:'Sprinkler',x:4},{l:'Smoking',x:4},{l:'Storage',x:3}]), points: 11 },
    { quizId: l1_1_1q.id, order: 1, difficulty: 3, gameType: 'drag-drop', gameConfig: d('Categorize prevention', ['Inspect','Train','Alarms','Exits'], [{t:'Proactive',c:['Inspect','Train'],x:3},{t:'Equipment',c:['Alarms','Exits'],x:3}]), points: 6 },
    { quizId: l1_1_1q.id, order: 2, difficulty: 2, gameType: 'memory-flip', gameConfig: m('Match', ['Overload','Distribute','Spill','Containment','Hot Work','Permit'], 2), points: 12 },
    { quizId: l1_1_1q.id, order: 3, difficulty: 1, gameType: 'photo-swipe', gameConfig: ps('Hazard/Safe', [{l:'H',c:true,x:2},{l:'S',c:false,x:2},{l:'H',c:true,x:2},{l:'S',c:false,x:2}]), points: 8 },
    { quizId: l1_1_1q.id, order: 4, difficulty: 3, gameType: 'scenario', gameConfig: sc('Materials near heater?', [{t:'Ignore',c:false},{t:'Move report',c:true,p:5},{t:'Later',c:false}]), points: 5 },
    { quizId: l1_1_1q.id, order: 5, difficulty: 2, gameType: 'matching', gameConfig: mat('Triangle', [{l:'Heat',r:'Ignition',p:3},{l:'Fuel',r:'Combustible',p:3},{l:'Oxygen',r:'Supports',p:3}]), points: 9 },
    { quizId: l1_1_1q.id, order: 6, difficulty: 4, gameType: 'sequence', gameConfig: seq('Order steps', ['Assess','Remove','Report','Document','Follow'], 3), points: 15 },
    { quizId: l1_1_1q.id, order: 7, difficulty: 1, gameType: 'true-false', gameConfig: tf('Contact only', false, 'Multiple ways', 4), points: 4 },
    { quizId: l1_1_1q.id, order: 8, difficulty: 2, gameType: 'multiple-choice', gameConfig: mc('NOT triangle', [{t:'Heat',c:false},{t:'Water',c:true},{t:'Fuel',c:false}], 5), points: 5 },
    { quizId: l1_1_1q.id, order: 9, difficulty: 3, gameType: 'time-attack-sorting', gameConfig: ta('Sort (60s)', [{t:'Gas',c:'high',p:2},{t:'Paper',c:'low',p:2},{t:'Weld',c:'high',p:2}], ['high','low'], 60), points: 6 }
  ]});

  console.log('  ✓ Lesson 1.1.1: Fire Hazards');

  // LESSON 1.1.2
  const l1_1_2q = await prisma.quiz.create({ data: { title: 'Extinguisher Quiz', slug: 'extinguisher-quiz', type: 'lesson', passingScore: 70 } });
  const l1_1_2 = await prisma.lesson.create({ data: { title: 'Fire Extinguisher Types', slug: 'extinguisher-types', description: 'Extinguisher classes & PASS', difficulty: 'Beginner', quizId: l1_1_2q.id } });
  
  await prisma.lessonStep.createMany({ data: [
    { lessonId: l1_1_2.id, order: 0, type: 'content', contentType: 'text', contentData: JSON.stringify({ html: '<h2>Classes</h2><ul><li>A: Wood, paper</li><li>B: Liquids</li><li>C: Electrical</li><li>K: Kitchen</li></ul>' }) },
    { lessonId: l1_1_2.id, order: 1, type: 'game', gameType: 'hotspot', gameConfig: h('Select extinguisher', '/images/ext.jpg', [{l:'A-Paper',x:5},{l:'B-Oil',x:5},{l:'C-Elec',x:5}]) },
    { lessonId: l1_1_2.id, order: 2, type: 'content', contentType: 'video', contentData: JSON.stringify({ url: '/videos/pass.mp4', thumbnail: '/images/pass.jpg', duration: 200 }) },
    { lessonId: l1_1_2.id, order: 3, type: 'game', gameType: 'drag-drop', gameConfig: d('Match fires', ['Wood','Gas','Electrical','Fryer'], [{t:'A',c:['Wood'],x:3},{t:'B',c:['Gas'],x:3},{t:'C',c:['Electrical'],x:3},{t:'K',c:['Fryer'],x:3}]) },
    { lessonId: l1_1_2.id, order: 4, type: 'game', gameType: 'memory-flip', gameConfig: m('Match types', ['Water','Class A','CO2','Class BC','Dry','ABC','Wet','Class K'], 2) },
    { lessonId: l1_1_2.id, order: 5, type: 'content', contentType: 'text', contentData: JSON.stringify({ html: '<h3>PASS</h3><ol><li>Pull pin</li><li>Aim base</li><li>Squeeze</li><li>Sweep</li></ol>' }) },
    { lessonId: l1_1_2.id, order: 6, type: 'game', gameType: 'photo-swipe', gameConfig: ps('Correct usage?', [{l:'Correct PASS',c:true,x:3},{l:'Wrong-high',c:false,x:3},{l:'Base aim',c:true,x:3},{l:'Too close',c:false,x:3}]) },
    { lessonId: l1_1_2.id, order: 7, type: 'game', gameType: 'scenario', gameConfig: sc('Electrical fire?', [{t:'Water',c:false},{t:'Class C, cut power',c:true,p:5},{t:'Run',c:false}]) },
    { lessonId: l1_1_2.id, order: 8, type: 'game', gameType: 'matching', gameConfig: mat('Inspection', [{l:'Visual',r:'Monthly',p:3},{l:'Professional',r:'Annual',p:3},{l:'Pressure',r:'Monthly',p:3}]) },
    { lessonId: l1_1_2.id, order: 9, type: 'game', gameType: 'sequence', gameConfig: seq('PASS order', ['Pull','Aim','Squeeze','Sweep'], 4) },
    { lessonId: l1_1_2.id, order: 10, type: 'game', gameType: 'true-false', gameConfig: tf('Aim top?', false, 'Aim BASE', 5) },
    { lessonId: l1_1_2.id, order: 11, type: 'game', gameType: 'multiple-choice', gameConfig: mc('Never on electrical', [{t:'Water',c:true},{t:'CO2',c:false},{t:'Dry',c:false}], 5) },
    { lessonId: l1_1_2.id, order: 12, type: 'game', gameType: 'time-attack-sorting', gameConfig: ta('Water OK? (45s)', [{t:'Wood',c:'ok',p:2},{t:'Electrical',c:'no',p:2},{t:'Paper',c:'ok',p:2},{t:'Grease',c:'no',p:2}], ['ok','no'], 45) }
  ]});

  await prisma.quizQuestion.createMany({ data: [
    { quizId: l1_1_2q.id, order: 0, difficulty: 2, gameType: 'hotspot', gameConfig: h('PASS parts', '/images/q-ext.jpg', [{l:'Pin',x:4},{l:'Nozzle',x:3},{l:'Handle',x:3}]), points: 10 },
    { quizId: l1_1_2q.id, order: 1, difficulty: 3, gameType: 'drag-drop', gameConfig: d('Match', ['Office','Kitchen','Computer'], [{t:'A',c:['Office'],x:3},{t:'K',c:['Kitchen'],x:3},{t:'C',c:['Computer'],x:3}]), points: 9 },
    { quizId: l1_1_2q.id, order: 2, difficulty: 2, gameType: 'memory-flip', gameConfig: m('PASS', ['Pull','Remove','Aim','Base','Squeeze','Press','Sweep','Side'], 2), points: 16 },
    { quizId: l1_1_2q.id, order: 3, difficulty: 1, gameType: 'photo-swipe', gameConfig: ps('Usage', [{l:'Distance',c:true,x:2},{l:'Blocked',c:false,x:2},{l:'Sweep',c:true,x:2}]), points: 6 },
    { quizId: l1_1_2q.id, order: 4, difficulty: 4, gameType: 'scenario', gameConfig: sc('Server fire', [{t:'Water',c:false},{t:'C+power',c:true,p:5},{t:'Run',c:false}]), points: 5 },
    { quizId: l1_1_2q.id, order: 5, difficulty: 2, gameType: 'matching', gameConfig: mat('Freq', [{l:'Visual',r:'Monthly',p:3},{l:'Pro',r:'Annual',p:3}]), points: 6 },
    { quizId: l1_1_2q.id, order: 6, difficulty: 4, gameType: 'sequence', gameConfig: seq('PASS', ['Pull','Aim','Squeeze','Sweep'], 4), points: 16 },
    { quizId: l1_1_2q.id, order: 7, difficulty: 1, gameType: 'true-false', gameConfig: tf('Aim top', false, 'BASE', 5), points: 5 },
    { quizId: l1_1_2q.id, order: 8, difficulty: 2, gameType: 'multiple-choice', gameConfig: mc('Never', [{t:'Water',c:true},{t:'CO2',c:false}], 5), points: 5 },
    { quizId: l1_1_2q.id, order: 9, difficulty: 3, gameType: 'time-attack-sorting', gameConfig: ta('Safe (45s)', [{t:'Wood',c:'ok',p:2},{t:'Elec',c:'no',p:2},{t:'Grease',c:'no',p:2}], ['ok','no'], 45), points: 6 }
  ]});

  console.log('  ✓ Lesson 1.1.2: Extinguishers');

  // COURSE 1.1 QUIZ
  const c1_1q = await prisma.quiz.create({ data: { title: 'Fire Safety Course Quiz', slug: 'fire-safety-course-quiz', type: 'course', passingScore: 80 } });
  await prisma.course.update({ where: { id: c1_1.id }, data: { quizId: c1_1q.id } });
  
  await prisma.quizQuestion.createMany({ data: [
    { quizId: c1_1q.id, order: 0, difficulty: 3, gameType: 'hotspot', gameConfig: h('All violations', '/images/cq1.jpg', [{l:'Exit',x:5},{l:'Overload',x:4},{l:'Wrong ext',x:4},{l:'Chem',x:5}]), points: 18 },
    { quizId: c1_1q.id, order: 1, difficulty: 4, gameType: 'drag-drop', gameConfig: d('Responsibilities', ['Drills','Maintain','Report','Plans'], [{t:'Mgmt',c:['Drills','Plans'],x:2},{t:'Emp',c:['Report'],x:2},{t:'Maint',c:['Maintain'],x:2}]), points: 6 },
    { quizId: c1_1q.id, order: 2, difficulty: 3, gameType: 'memory-flip', gameConfig: m('Concepts', ['Triangle','HFO','PASS','PASS steps','Class K','Kitchen'], 2), points: 12 },
    { quizId: c1_1q.id, order: 3, difficulty: 2, gameType: 'photo-swipe', gameConfig: ps('Review', [{l:'Correct',c:true,x:2},{l:'Violation',c:false,x:2},{l:'Safe',c:true,x:2},{l:'Hazard',c:false,x:2}]), points: 8 },
    { quizId: c1_1q.id, order: 4, difficulty: 5, gameType: 'scenario', gameConfig: sc('Small elec fire, no alarm, people nearby', [{t:'Fight',c:false},{t:'Alarm, alert, C if safe, else evac',c:true,p:10},{t:'Just evac',c:false}]), points: 10 },
    { quizId: c1_1q.id, order: 5, difficulty: 3, gameType: 'matching', gameConfig: mat('Equipment', [{l:'Ext',r:'Monthly visual annual',p:3},{l:'Alarms',r:'Monthly test',p:3},{l:'Lights',r:'30-sec monthly',p:3}]), points: 9 },
    { quizId: c1_1q.id, order: 6, difficulty: 5, gameType: 'sequence', gameConfig: seq('Full response', ['Discover','Alarm','Call','Alert','Extinguish small','Evac if spreads'], 2), points: 12 },
    { quizId: c1_1q.id, order: 7, difficulty: 2, gameType: 'true-false', gameConfig: tf('Multiple classes?', true, 'Often multiple', 6), points: 6 },
    { quizId: c1_1q.id, order: 8, difficulty: 3, gameType: 'multiple-choice', gameConfig: mc('Max distance Class A?', [{t:'50',c:false},{t:'75',c:true},{t:'100',c:false}], 6), points: 6 },
    { quizId: c1_1q.id, order: 9, difficulty: 4, gameType: 'time-attack-sorting', gameConfig: ta('Risk (90s)', [{t:'Welding',c:'high',p:2},{t:'Paper',c:'low',p:2},{t:'Bulk chem',c:'high',p:2},{t:'Battery',c:'high',p:2},{t:'Cabinet',c:'low',p:2}], ['high','low'], 90), points: 10 }
  ]});

  console.log('  ✓ Course 1.1 Quiz');

  await prisma.courseLesson.createMany({ data: [{ courseId: c1_1.id, lessonId: l1_1_1.id, order: 0 }, { courseId: c1_1.id, lessonId: l1_1_2.id, order: 1 }] });
  await prisma.programCourse.create({ data: { programId: p1.id, courseId: c1_1.id, order: 0 } });

  console.log('✅ PROGRAM 1 COMPLETE\n');

  const p2 = await prisma.program.create({ data: { title: 'Hazard & Risk Management', slug: 'hazard-risk-mgmt', description: 'Identify and mitigate hazards', isActive: true } });
  const p3 = await prisma.program.create({ data: { title: 'Job-Specific & Health Topics', slug: 'job-health', description: 'Role-specific safety', isActive: true } });
  console.log('✅ Programs 2 & 3 created\n');

  await prisma.userTypeProgramAssignment.createMany({ data: [
    { userTypeId: newHire.id, programId: p1.id },
    { userTypeId: permanent.id, programId: p2.id },
    { userTypeId: contractor.id, programId: p3.id }
  ]});

  await prisma.badge.createMany({ data: [
    { name: 'Fire Safety Expert', description: 'Completed fire course', iconUrl: '/badges/fire.png', criteria: JSON.stringify({ type: 'course', courseId: c1_1.id }) },
    { name: 'Quick Learner', description: 'Fast completion', iconUrl: '/badges/quick.png', criteria: JSON.stringify({ type: 'time', maxSeconds: 600 }) },
    { name: 'Level 5', description: 'Reached level 5', iconUrl: '/badges/l5.png', criteria: JSON.stringify({ type: 'level', threshold: 5 }) }
  ]});

  console.log('\n🎉 SEED COMPLETE!\n');
  console.log('📊 Summary:');
  console.log('   - 44 permissions');
  console.log('   - 5 roles with proper permissions:');
  console.log('     • ADMIN: All permissions');
  console.log('     • INSTRUCTOR: Content management');
  console.log('     • LEARNER: View learning content');
  console.log('     • SAFETY OFFICER: View all + export reports');
  console.log('     • CONTENT REVIEWER: View + edit content');
  console.log('   - 4 user types, 6 tags');
  console.log('   - 3 programs');
  console.log('   - 1 complete course with 2 lessons');
  console.log('   - All 10 game types in lessons & quizzes');
  console.log('   - 3 badges\n');
  console.log('👤 Login:');
  console.log('   admin@safetyquest.com / admin123');
  console.log('   learner@safetyquest.com / learner123\n');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });