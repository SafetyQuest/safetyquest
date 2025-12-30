// ======================================================================================
// SEED 2: COMPLETE CORE SAFETY COURSES - 3 Courses, 12 Lessons, 156 Steps
// Run this SECOND (after seed-1-setup.ts)
// ======================================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let operationCount = 0;
const logOp = (message: string) => {
  operationCount++;
  console.log(`  [${operationCount.toString().padStart(3, ' ')}] ${message}`);
};

// Lesson data definitions
const fireLesson1Data = {
  title: 'Understanding Fire Hazards',
  slug: 'fire-hazards',
  description: 'Identify common fire hazards in the workplace',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Fire Hazards Overview', videoUrl: '/videos/intro.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Understanding Fire Hazards', body: 'Fire triangle, classes of fire, and common hazards.' }) },
    { type: 'game', gameType: 'hotspot', gameConfig: JSON.stringify({ instruction: 'Identify fire hazards', imageUrl: '/images/workplace1.jpg', hotspots: [{ x: 20, y: 30, radius: 8, label: 'Overloaded outlet', xp: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Which is NOT part of fire triangle?', options: [{ id: 'a', text: 'Heat', correct: false }, { id: 'b', text: 'Water', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Water extinguishers are safe for electrical fires?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False', correct: true }], points: 10 }), points: 10 }
  ]
};

const fireLesson2Data = {
  title: 'Fire Extinguisher Types & Use',
  slug: 'extinguisher-types',
  description: 'Classes of extinguishers and proper application',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Extinguisher Overview', videoUrl: '/videos/ext.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Extinguisher Types', body: 'Learn about Class A, B, C, D, and K extinguishers.' }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'PASS stands for?', options: [{ id: 'a', text: 'Pull Aim Squeeze Sweep', correct: true }, { id: 'b', text: 'Point Activate Spray Stop', correct: false }], points: 5 }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Small grease fire in breakroom. What extinguisher?', options: [{ id: 'a', text: 'Water', correct: false }, { id: 'b', text: 'Class K', correct: true, points: 5 }] }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Where should extinguishers be mounted?', options: [{ id: 'a', text: '3.5-5 ft high', correct: true }, { id: 'b', text: 'On floor', correct: false }], points: 10 }), points: 10 }
  ]
};

const fireLesson3Data = {
  title: 'Evacuation Procedures',
  slug: 'evacuation-procedures',
  description: 'Emergency egress, assembly points, and accountability',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Evacuation Overview', videoUrl: '/videos/evac.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'RACE Protocol', body: 'Rescue, Alarm, Contain, Evacuate.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Alarm sounds, you see smoke. Action?', options: [{ id: 'a', text: 'Wait for supervisor', correct: false }, { id: 'b', text: 'Evacuate immediately', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Use elevators during fire evacuation?', options: [{ id: 'a', text: 'Yes', correct: false }, { id: 'b', text: 'No', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Who conducts headcount?', options: [{ id: 'a', text: 'Designated wardens', correct: true }, { id: 'b', text: 'First person there', correct: false }], points: 10 }), points: 10 }
  ]
};

const fireLesson4Data = {
  title: 'Fire Prevention Best Practices',
  slug: 'fire-prevention',
  description: 'Proactive measures to reduce fire risk',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Prevention Overview', videoUrl: '/videos/prev.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Hot Work Permits', body: 'Required for welding, grinding, and open flame work.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Contractor wants to weld near solvent. Action?', options: [{ id: 'a', text: 'Approve if experienced', correct: false }, { id: 'b', text: 'Require permit, relocate, fire watch', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Hot work permits are optional for experienced workers?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Max distance for Class A extinguisher?', options: [{ id: 'a', text: '75 ft', correct: true }, { id: 'b', text: '30 ft', correct: false }], points: 10 }), points: 10 }
  ]
};

const emergLesson1Data = {
  title: 'First Aid Fundamentals',
  slug: 'first-aid-fundamentals',
  description: 'CPR, bleeding control, and shock management',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'First Aid Overview', videoUrl: '/videos/firstaid.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'CPR Basics', body: 'C-A-B: Compressions, Airway, Breathing. 30:2 ratio.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Coworker collapses, not breathing. First action?', options: [{ id: 'a', text: 'Check pulse 30 sec', correct: false }, { id: 'b', text: 'Call for help, start compressions', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Adult chest compression depth?', options: [{ id: 'a', text: '2-2.4 inches', correct: true }, { id: 'b', text: '1 inch', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Unconscious person. Response?', options: [{ id: 'a', text: 'Call 911, start CPR', correct: true }, { id: 'b', text: 'Wait and observe', correct: false }], points: 15 }), points: 15 }
  ]
};

const emergLesson2Data = {
  title: 'Incident Reporting',
  slug: 'incident-reporting',
  description: 'Near misses, injury reporting, and investigation basics',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Reporting Overview', videoUrl: '/videos/report.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Near Miss Reporting', body: 'Report all near misses within 24 hours.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Tool falls but misses coworker. Report?', options: [{ id: 'a', text: 'No injury, no report', correct: false }, { id: 'b', text: 'Yes, near miss requires reporting', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'When to report near miss?', options: [{ id: 'a', text: 'Within 24 hours', correct: true }, { id: 'b', text: 'Next meeting', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Only injuries require reporting?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False', correct: true }], points: 10 }), points: 10 }
  ]
};

const emergLesson3Data = {
  title: 'Emergency Communication',
  slug: 'emergency-communication',
  description: 'Alert systems, notifications, and chain of command',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Communication Overview', videoUrl: '/videos/comm.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Alert Systems', body: 'Mass notification via text, email, PA system.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Alarm but no announcement. Action?', options: [{ id: 'a', text: 'Wait for email', correct: false }, { id: 'b', text: 'Follow posted procedure', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Multiple people should send emergency messages?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - single point', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Emergency messages should include?', options: [{ id: 'a', text: 'Action, location, duration', correct: true }, { id: 'b', text: 'Only location', correct: false }], points: 10 }), points: 10 }
  ]
};

const emergLesson4Data = {
  title: 'Crisis Management Basics',
  slug: 'crisis-management',
  description: 'Roles, continuity planning, and post-incident review',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Crisis Management Overview', videoUrl: '/videos/crisis.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'ICS Structure', body: 'Incident Command System: Command, Operations, Logistics.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Major incident, supervisor unavailable. You should?', options: [{ id: 'a', text: 'Wait for authority', correct: false }, { id: 'b', text: 'Follow chain of command', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Crisis plans should be reviewed?', options: [{ id: 'a', text: 'Annually', correct: true }, { id: 'b', text: 'Every 5 years', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Purpose of debrief?', options: [{ id: 'a', text: 'Identify improvements', correct: true }, { id: 'b', text: 'Assign blame', correct: false }], points: 10 }), points: 10 }
  ]
};

const ppeLesson1Data = {
  title: 'PPE Selection & Fit',
  slug: 'ppe-selection',
  description: 'Hazard assessment and appropriate PPE selection',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'PPE Overview', videoUrl: '/videos/ppe.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'PPE Standards', body: 'ANSI Z87.1 for eye protection, OSHA 1910.132 for general PPE.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Task: grinding metal. Required PPE?', options: [{ id: 'a', text: 'Safety glasses only', correct: false }, { id: 'b', text: 'Face shield + glasses + hearing + gloves', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'PPE eliminates the hazard?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'When should PPE be inspected?', options: [{ id: 'a', text: 'Before each use', correct: true }, { id: 'b', text: 'Monthly', correct: false }], points: 10 }), points: 10 }
  ]
};

const ppeLesson2Data = {
  title: 'Respiratory Protection',
  slug: 'respiratory-protection',
  description: 'Respirator types, fit testing, and maintenance',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Respirator Overview', videoUrl: '/videos/resp.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Respirator Types', body: 'N95 for particulates, half-face for gases, PAPR for high hazard.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Sandblasting in confined space. Respirator?', options: [{ id: 'a', text: 'Dust mask', correct: false }, { id: 'b', text: 'Supplied-air respirator', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Fit testing required?', options: [{ id: 'a', text: 'Annually', correct: true }, { id: 'b', text: 'Every 5 years', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'User seal check verifies?', options: [{ id: 'a', text: 'Proper fit before entry', correct: true }, { id: 'b', text: 'Filter efficiency', correct: false }], points: 10 }), points: 10 }
  ]
};

const ppeLesson3Data = {
  title: 'PPE Maintenance & Storage',
  slug: 'ppe-maintenance',
  description: 'Cleaning, inspection, and proper storage of PPE',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'PPE Care Overview', videoUrl: '/videos/care.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Inspection & Storage', body: 'Inspect before/after use. Store in cool, dry place.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Small crack in face shield. Action?', options: [{ id: 'a', text: 'Tape it', correct: false }, { id: 'b', text: 'Tag out, report, replace', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'PPE can be shared if cleaned?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - some is personal', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Fall protection inspection frequency?', options: [{ id: 'a', text: 'Before each use', correct: true }, { id: 'b', text: 'Monthly', correct: false }], points: 10 }), points: 10 }
  ]
};

const ppeLesson4Data = {
  title: 'Housekeeping & 5S',
  slug: 'housekeeping-5s',
  description: 'Workplace organization, spill control, and clutter prevention',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: '5S Overview', videoUrl: '/videos/5s.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: '5S Methodology', body: 'Sort, Set in Order, Shine, Standardize, Sustain.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Oil spill near forklift path. Action?', options: [{ id: 'a', text: 'Step around it', correct: false }, { id: 'b', text: 'Contain, clean, report if >1 gal', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Housekeeping is only janitorial responsibility?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - everyone', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What does Shine mean in 5S?', options: [{ id: 'a', text: 'Clean and inspect', correct: true }, { id: 'b', text: 'Polish surfaces', correct: false }], points: 10 }), points: 10 }
  ]
};

async function createLesson(data: any, courseId: string, order: number, tags: string[]) {
  // Create quiz
  const quiz = await prisma.quiz.create({
    data: { 
      title: `${data.title} Quiz`, 
      slug: `${data.slug}-quiz`, 
      type: 'lesson', 
      passingScore: 70 
    }
  });
  
  // Create lesson
  const lesson = await prisma.lesson.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      difficulty: 'Beginner',
      quizId: quiz.id
    }
  });
  
  // Create steps
  const stepsWithIds = data.steps.map((step: any, idx: number) => ({
    ...step,
    lessonId: lesson.id,
    order: idx
  }));
  await prisma.lessonStep.createMany({ data: stepsWithIds });
  
  // Create quiz questions
  const questionsWithIds = data.quizQuestions.map((q: any, idx: number) => ({
    ...q,
    quizId: quiz.id,
    order: idx
  }));
  await prisma.quizQuestion.createMany({ data: questionsWithIds });
  
  // Tag lesson
  await prisma.lessonTag.createMany({
    data: tags.map(tagId => ({ lessonId: lesson.id, tagId }))
  });
  
  // Link to course
  await prisma.courseLesson.create({
    data: { courseId, lessonId: lesson.id, order }
  });
  
  return lesson;
}

async function main() {
  console.log('🌱 SEED 2: Complete Core Safety Courses\n');

  // Get references
  const coreProgram = await prisma.program.findUnique({ where: { slug: 'core-safety' } });
  const tags = {
    fire: await prisma.tag.findUnique({ where: { slug: 'fire-safety' } }),
    emergency: await prisma.tag.findUnique({ where: { slug: 'emergency' } }),
    ppe: await prisma.tag.findUnique({ where: { slug: 'ppe' } }),
    hazmat: await prisma.tag.findUnique({ where: { slug: 'hazmat' } }),
    firstAid: await prisma.tag.findUnique({ where: { slug: 'first-aid' } })
  };

  if (!coreProgram || !tags.fire || !tags.emergency || !tags.ppe || !tags.hazmat || !tags.firstAid) {
    throw new Error('Missing data from Seed 1');
  }

  // Clean existing
  console.log('Cleaning existing Core Safety courses...\n');
  const existingCourses = await prisma.course.findMany({
    where: { slug: { in: ['fire-safety-fundamentals', 'emergency-response', 'ppe-housekeeping'] } }
  });
  
  for (const course of existingCourses) {
    const courseLessons = await prisma.courseLesson.findMany({ 
      where: { courseId: course.id },
      include: { lesson: true }
    });
    
    for (const cl of courseLessons) {
      await prisma.lessonStep.deleteMany({ where: { lessonId: cl.lesson.id } });
      await prisma.lessonTag.deleteMany({ where: { lessonId: cl.lesson.id } });
      if (cl.lesson.quizId) {
        await prisma.quizQuestion.deleteMany({ where: { quizId: cl.lesson.quizId } });
        await prisma.quiz.delete({ where: { id: cl.lesson.quizId } });
      }
    }
    
    await prisma.courseLesson.deleteMany({ where: { courseId: course.id } });
    await prisma.programCourse.deleteMany({ where: { courseId: course.id } });
    await prisma.courseTag.deleteMany({ where: { courseId: course.id } });
    
    if (course.quizId) {
      await prisma.quizQuestion.deleteMany({ where: { quizId: course.quizId } });
      await prisma.quiz.delete({ where: { id: course.quizId } });
    }
    
    // Delete lessons
    for (const cl of courseLessons) {
      await prisma.lesson.delete({ where: { id: cl.lesson.id } });
    }
    
    await prisma.course.delete({ where: { id: course.id } });
  }

  // COURSE 1: Fire Safety
  console.log('🔥 Creating Fire Safety Fundamentals...');
  const fireCourse = await prisma.course.create({
    data: {
      title: 'Fire Safety Fundamentals',
      slug: 'fire-safety-fundamentals',
      description: 'Fire prevention, response, and extinguisher use',
      difficulty: 'Beginner'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [
      { courseId: fireCourse.id, tagId: tags.fire!.id },
      { courseId: fireCourse.id, tagId: tags.emergency!.id }
    ]
  });
  
  await createLesson(fireLesson1Data, fireCourse.id, 0, [tags.fire!.id, tags.emergency!.id]);
  logOp('Fire Lesson 1');
  await createLesson(fireLesson2Data, fireCourse.id, 1, [tags.fire!.id]);
  logOp('Fire Lesson 2');
  await createLesson(fireLesson3Data, fireCourse.id, 2, [tags.fire!.id, tags.emergency!.id]);
  logOp('Fire Lesson 3');
  await createLesson(fireLesson4Data, fireCourse.id, 3, [tags.fire!.id]);
  logOp('Fire Lesson 4');
  
  // Create course quiz
  const fireQuiz = await prisma.quiz.create({
    data: { title: 'Fire Safety Assessment', slug: 'fire-safety-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: fireQuiz.id,
      order: 0,
      difficulty: 3,
      gameType: 'multiple-choice',
      gameConfig: JSON.stringify({ question: 'PASS stands for?', options: [{ id: 'a', text: 'Pull Aim Squeeze Sweep', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: fireCourse.id }, data: { quizId: fireQuiz.id } });
  await prisma.programCourse.create({ data: { programId: coreProgram.id, courseId: fireCourse.id, order: 0 } });

  // COURSE 2: Emergency Response
  console.log('🚑 Creating Emergency Response...');
  const emergCourse = await prisma.course.create({
    data: {
      title: 'Emergency Response & First Aid',
      slug: 'emergency-response',
      description: 'Medical emergencies and crisis management',
      difficulty: 'Intermediate'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [
      { courseId: emergCourse.id, tagId: tags.emergency!.id },
      { courseId: emergCourse.id, tagId: tags.firstAid!.id }
    ]
  });
  
  await createLesson(emergLesson1Data, emergCourse.id, 0, [tags.emergency!.id, tags.firstAid!.id]);
  logOp('Emergency Lesson 1');
  await createLesson(emergLesson2Data, emergCourse.id, 1, [tags.emergency!.id]);
  logOp('Emergency Lesson 2');
  await createLesson(emergLesson3Data, emergCourse.id, 2, [tags.emergency!.id]);
  logOp('Emergency Lesson 3');
  await createLesson(emergLesson4Data, emergCourse.id, 3, [tags.emergency!.id]);
  logOp('Emergency Lesson 4');
  
  const emergQuiz = await prisma.quiz.create({
    data: { title: 'Emergency Response Assessment', slug: 'emergency-response-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: emergQuiz.id,
      order: 0,
      difficulty: 3,
      gameType: 'scenario',
      gameConfig: JSON.stringify({ question: 'Medical emergency. First step?', options: [{ id: 'a', text: 'Call 911', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: emergCourse.id }, data: { quizId: emergQuiz.id } });
  await prisma.programCourse.create({ data: { programId: coreProgram.id, courseId: emergCourse.id, order: 1 } });

  // COURSE 3: PPE & Housekeeping
  console.log('🦺 Creating PPE & Housekeeping...');
  const ppeCourse = await prisma.course.create({
    data: {
      title: 'PPE & Workplace Housekeeping',
      slug: 'ppe-housekeeping',
      description: 'Selection, use, and maintenance of protective equipment',
      difficulty: 'Beginner'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [
      { courseId: ppeCourse.id, tagId: tags.ppe!.id },
      { courseId: ppeCourse.id, tagId: tags.hazmat!.id }
    ]
  });
  
  await createLesson(ppeLesson1Data, ppeCourse.id, 0, [tags.ppe!.id]);
  logOp('PPE Lesson 1');
  await createLesson(ppeLesson2Data, ppeCourse.id, 1, [tags.ppe!.id]);
  logOp('PPE Lesson 2');
  await createLesson(ppeLesson3Data, ppeCourse.id, 2, [tags.ppe!.id]);
  logOp('PPE Lesson 3');
  await createLesson(ppeLesson4Data, ppeCourse.id, 3, [tags.ppe!.id]);
  logOp('PPE Lesson 4');
  
  const ppeQuiz = await prisma.quiz.create({
    data: { title: 'PPE Assessment', slug: 'ppe-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: ppeQuiz.id,
      order: 0,
      difficulty: 2,
      gameType: 'multiple-choice',
      gameConfig: JSON.stringify({ question: 'When inspect PPE?', options: [{ id: 'a', text: 'Before each use', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: ppeCourse.id }, data: { quizId: ppeQuiz.id } });
  await prisma.programCourse.create({ data: { programId: coreProgram.id, courseId: ppeCourse.id, order: 2 } });

  // Validation
  console.log('\n🔍 Validating...');
  const [courseCount, lessonCount, stepCount] = await Promise.all([
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.lessonStep.count()
  ]);

  console.log(`  ✅ Courses: ${courseCount}`);
  console.log(`  ✅ Lessons: ${lessonCount}`);
  console.log(`  ✅ Steps: ${stepCount}`);

  console.log('\n🎉 SEED 2 COMPLETE!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed 2 failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });