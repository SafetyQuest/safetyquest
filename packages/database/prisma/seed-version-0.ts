import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@safetyquest/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // ==========================================
  // 1. USERS
  // ==========================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@safetyquest.com' },
    update: {},
    create: {
      email: 'admin@safetyquest.com',
      name: 'Admin User',
      passwordHash: await hashPassword('admin123'),
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin user created');

  // ==========================================
  // 2. USER TYPES
  // ==========================================
  const visitor = await prisma.userType.upsert({
    where: { slug: 'visitor' },
    update: {},
    create: {
      name: 'Visitor',
      slug: 'visitor',
      description: 'Temporary site visitors'
    }
  });

  const contractor = await prisma.userType.upsert({
    where: { slug: 'contractor' },
    update: {},
    create: {
      name: 'Contractor',
      slug: 'contractor',
      description: 'External contractors'
    }
  });

  const employee = await prisma.userType.upsert({
    where: { slug: 'employee' },
    update: {},
    create: {
      name: 'Permanent Employee',
      slug: 'employee',
      description: 'Full-time employees'
    }
  });
  console.log('✅ User types created (Visitor, Contractor, Employee)\n');

  // ==========================================
  // 3. TAGS
  // ==========================================
  const safetyTag = await prisma.tag.upsert({
    where: { slug: 'safety' },
    update: {},
    create: { name: 'Safety', slug: 'safety' }
  });

  const ppeTag = await prisma.tag.upsert({
    where: { slug: 'ppe' },
    update: {},
    create: { name: 'PPE', slug: 'ppe' }
  });

  const fireTag = await prisma.tag.upsert({
    where: { slug: 'fire-safety' },
    update: {},
    create: { name: 'Fire Safety', slug: 'fire-safety' }
  });
  console.log('✅ Tags created (Safety, PPE, Fire Safety)\n');

  // ==========================================
  // 4. QUIZZES (Create before lessons/courses)
  // ==========================================
  
  // Gap Assessment Quiz
  const gapQuiz = await prisma.quiz.upsert({
    where: { slug: 'gap-assessment' },
    update: {},
    create: {
      title: 'Safety Knowledge Gap Assessment',
      slug: 'gap-assessment',
      description: 'Initial assessment to determine training level',
      type: 'gap_assessment',
      passingScore: 70
    }
  });

  // Create gap assessment questions
  await prisma.quizQuestion.createMany({
    data: [
      {
        quizId: gapQuiz.id,
        order: 0,
        difficulty: 1,
        gameType: 'true-false',
        gameConfig: JSON.stringify({
          question: 'Hard hats must be worn in all production areas',
          correctAnswer: true
        }),
        points: 10
      },
      {
        quizId: gapQuiz.id,
        order: 1,
        difficulty: 3,
        gameType: 'hotspot',
        gameConfig: JSON.stringify({
          question: 'Identify all PPE violations in this scene',
          imageUrl: '/images/ppe-violations.jpg',
          hotspots: [
            { x: 30, y: 40, radius: 5, label: 'Missing hard hat' },
            { x: 50, y: 70, radius: 5, label: 'Improper footwear' }
          ]
        }),
        points: 20
      },
      {
        quizId: gapQuiz.id,
        order: 2,
        difficulty: 5,
        gameType: 'sequence',
        gameConfig: JSON.stringify({
          question: 'Order the emergency evacuation steps correctly',
          items: [
            'Hear alarm',
            'Stop work safely',
            'Proceed to muster point',
            'Report to supervisor'
          ],
          correctOrder: [0, 1, 2, 3]
        }),
        points: 30
      }
    ],
    // skipDuplicates: true
  });
  console.log('✅ Gap assessment quiz created with 3 questions\n');

  // PPE Intro Lesson Quiz
  const ppeIntroQuiz = await prisma.quiz.upsert({
    where: { slug: 'ppe-intro-quiz' },
    update: {},
    create: {
      title: 'PPE Introduction Quiz',
      slug: 'ppe-intro-quiz',
      type: 'lesson',
      passingScore: 80
    }
  });

  await prisma.quizQuestion.createMany({
    data: [
      {
        quizId: ppeIntroQuiz.id,
        order: 0,
        difficulty: 2,
        gameType: 'drag-drop',
        gameConfig: JSON.stringify({
          question: 'Match each PPE to its purpose',
          items: [
            { id: 'helmet', text: 'Hard Hat' },
            { id: 'boots', text: 'Safety Boots' },
            { id: 'gloves', text: 'Gloves' }
          ],
          targets: [
            { id: 'head', text: 'Head Protection', correctItem: 'helmet' },
            { id: 'feet', text: 'Foot Protection', correctItem: 'boots' },
            { id: 'hands', text: 'Hand Protection', correctItem: 'gloves' }
          ]
        }),
        points: 15
      }
    ],
    // skipDuplicates: true
  });
  console.log('✅ PPE intro lesson quiz created\n');

  // PPE Course Comprehensive Quiz
  const ppeCourseQuiz = await prisma.quiz.upsert({
    where: { slug: 'ppe-course-comprehensive' },
    update: {},
    create: {
      title: 'PPE Course Comprehensive Assessment',
      slug: 'ppe-course-comprehensive',
      type: 'course',
      passingScore: 85
    }
  });

  await prisma.quizQuestion.createMany({
    data: [
      {
        quizId: ppeCourseQuiz.id,
        order: 0,
        difficulty: 4,
        gameType: 'scenario',
        gameConfig: JSON.stringify({
          question: 'You notice a coworker not wearing required PPE. What do you do?',
          options: [
            { id: 'ignore', text: 'Ignore it, not my problem', correct: false },
            { id: 'report', text: 'Politely remind them and report to supervisor', correct: true },
            { id: 'yell', text: 'Yell at them publicly', correct: false }
          ]
        }),
        points: 25
      }
    ],
    // skipDuplicates: true
  });
  console.log('✅ PPE course comprehensive quiz created\n');

  // ==========================================
  // 5. LESSONS (Corpus)
  // ==========================================
  const ppeIntroLesson = await prisma.lesson.upsert({
    where: { slug: 'intro-to-ppe' },
    update: {},
    create: {
      title: 'Introduction to PPE',
      slug: 'intro-to-ppe',
      description: 'Learn about different types of Personal Protective Equipment',
      difficulty: 'Beginner',
      quizId: ppeIntroQuiz.id
    }
  });

  // Add lesson steps
  await prisma.lessonStep.createMany({
    data: [
      {
        lessonId: ppeIntroLesson.id,
        order: 0,
        type: 'content',
        contentType: 'text',
        contentData: JSON.stringify({
          html: '<h2>Welcome to PPE Training</h2><p>Personal Protective Equipment (PPE) is essential for workplace safety. In this lesson, you will learn about different types of PPE and when to use them.</p>'
        })
      },
      {
        lessonId: ppeIntroLesson.id,
        order: 1,
        type: 'content',
        contentType: 'video',
        contentData: JSON.stringify({
          url: '/videos/ppe-overview.mp4',
          thumbnail: '/images/ppe-thumb.jpg',
          duration: 180
        })
      },
      {
        lessonId: ppeIntroLesson.id,
        order: 2,
        type: 'game',
        gameType: 'hotspot',
        gameConfig: JSON.stringify({
          instruction: 'Click on all the PPE items in this warehouse scene',
          imageUrl: '/images/warehouse-scene.jpg',
          hotspots: [
            { x: 30, y: 40, radius: 8, label: 'Hard Hat', xp: 10 },
            { x: 50, y: 60, radius: 8, label: 'Safety Boots', xp: 10 },
            { x: 70, y: 45, radius: 8, label: 'Hi-Vis Vest', xp: 10 }
          ]
        })
      },
      {
        lessonId: ppeIntroLesson.id,
        order: 3,
        type: 'content',
        contentType: 'text',
        contentData: JSON.stringify({
          html: '<h3>Types of PPE</h3><ul><li>Head Protection: Hard hats, bump caps</li><li>Eye Protection: Safety glasses, goggles</li><li>Hearing Protection: Earplugs, earmuffs</li></ul>'
        })
      }
    ],
    // skipDuplicates: true
  });

  const ppeUsageLesson = await prisma.lesson.upsert({
    where: { slug: 'proper-ppe-usage' },
    update: {},
    create: {
      title: 'Proper PPE Usage',
      slug: 'proper-ppe-usage',
      description: 'How to correctly wear and maintain PPE',
      difficulty: 'Beginner'
      // No quiz yet - will add later
    }
  });

  await prisma.lessonStep.createMany({
    data: [
      {
        lessonId: ppeUsageLesson.id,
        order: 0,
        type: 'content',
        contentType: 'text',
        contentData: JSON.stringify({
          html: '<h2>Proper PPE Usage</h2><p>Using PPE correctly is just as important as having it.</p>'
        })
      }
    ],
    // skipDuplicates: true
  });
  console.log('✅ Lessons created (PPE Intro, PPE Usage)\n');

  // ==========================================
  // 6. COURSES (Corpus)
  // ==========================================
  const ppeCourse = await prisma.course.upsert({
    where: { slug: 'ppe-basics' },
    update: {},
    create: {
      title: 'PPE Basics',
      slug: 'ppe-basics',
      description: 'Comprehensive Personal Protective Equipment training',
      difficulty: 'Beginner',
      quizId: ppeCourseQuiz.id
    }
  });

  // Link lessons to course
  await prisma.courseLesson.createMany({
    data: [
      { courseId: ppeCourse.id, lessonId: ppeIntroLesson.id, order: 0 },
      { courseId: ppeCourse.id, lessonId: ppeUsageLesson.id, order: 1 }
    ],
    // skipDuplicates: true
  });

  // Add tags to course
  await prisma.courseTag.createMany({
    data: [
      { courseId: ppeCourse.id, tagId: safetyTag.id },
      { courseId: ppeCourse.id, tagId: ppeTag.id }
    ],
    // skipDuplicates: true
  });

  // Add tags to lessons
  await prisma.lessonTag.createMany({
    data: [
      { lessonId: ppeIntroLesson.id, tagId: ppeTag.id },
      { lessonId: ppeUsageLesson.id, tagId: ppeTag.id }
    ],
    // skipDuplicates: true
  });
  console.log('✅ Course created (PPE Basics) with 2 lessons\n');

  // ==========================================
  // 7. PROGRAMS
  // ==========================================
  const basicSafetyProgram = await prisma.program.upsert({
    where: { slug: 'basic-safety' },
    update: {},
    create: {
      title: 'Basic Safety Orientation',
      slug: 'basic-safety',
      description: 'Foundational safety training for all site visitors',
      isActive: true
    }
  });

  const contractorProgram = await prisma.program.upsert({
    where: { slug: 'contractor-advanced' },
    update: {},
    create: {
      title: 'Contractor Advanced Safety',
      slug: 'contractor-advanced',
      description: 'Enhanced safety training for contractors',
      isActive: true
    }
  });

  // Link courses to programs
  await prisma.programCourse.createMany({
    data: [
      { programId: basicSafetyProgram.id, courseId: ppeCourse.id, order: 0 },
      { programId: contractorProgram.id, courseId: ppeCourse.id, order: 0 }
    ],
    // skipDuplicates: true
  });
  console.log('✅ Programs created (Basic Safety, Contractor Advanced)\n');

  // ==========================================
  // 8. USER TYPE → PROGRAM ASSIGNMENTS
  // ==========================================
  await prisma.userTypeProgramAssignment.createMany({
    data: [
      { userTypeId: visitor.id, programId: basicSafetyProgram.id },
      { userTypeId: contractor.id, programId: contractorProgram.id },
      { userTypeId: employee.id, programId: basicSafetyProgram.id }
    ],
    // skipDuplicates: true
  });
  console.log('✅ UserType → Program inheritance configured\n');

  // ==========================================
  // 9. SAMPLE LEARNER USER
  // ==========================================
  const learner = await prisma.user.upsert({
    where: { email: 'learner@safetyquest.com' },
    update: {},
    create: {
      email: 'learner@safetyquest.com',
      name: 'John Learner',
      passwordHash: await hashPassword('learner123'),
      role: 'LEARNER',
      userTypeId: visitor.id,
      section: 'Production',
      department: 'Manufacturing',
      designation: 'Operator'
    }
  });

  // Create inherited program assignment
  await prisma.programAssignment.create({
    data: {
      userId: learner.id,
      programId: basicSafetyProgram.id,
      source: 'usertype',
      assignedBy: 'system'
    }
  });
  console.log('✅ Sample learner created with inherited program\n');

  // ==========================================
  // 10. BADGES
  // ==========================================
  await prisma.badge.createMany({
    data: [
      {
        name: 'PPE Expert',
        description: 'Completed PPE Basics course',
        iconUrl: '/badges/ppe-expert.png',
        criteria: JSON.stringify({
          type: 'course',
          courseId: ppeCourse.id
        })
      },
      {
        name: 'Quick Learner',
        description: 'Completed first lesson within 10 minutes',
        iconUrl: '/badges/quick-learner.png',
        criteria: JSON.stringify({
          type: 'time',
          maxSeconds: 600
        })
      },
      {
        name: 'Level 5',
        description: 'Reached level 5',
        iconUrl: '/badges/level-5.png',
        criteria: JSON.stringify({
          type: 'level',
          threshold: 5
        })
      }
    ],
    // skipDuplicates: true
  });
  console.log('✅ Badges created\n');

  console.log('🎉 Seed completed successfully!\n');
  console.log('📝 Login credentials:');
  console.log('   Admin:   admin@safetyquest.com / admin123');
  console.log('   Learner: learner@safetyquest.com / learner123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });