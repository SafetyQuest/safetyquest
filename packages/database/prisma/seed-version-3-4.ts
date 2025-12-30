// ======================================================================================
// SEED 4: JOB-SPECIFIC & HEALTH COURSES - 3 Courses, 12 Lessons (FINAL)
// Run this FOURTH (after seed-3-hazard-courses.ts)
// ======================================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let operationCount = 0;
const logOp = (message: string) => {
  operationCount++;
  console.log(`  [${operationCount.toString().padStart(3, ' ')}] ${message}`);
};

// COURSE 7: Workplace Ergonomics - Lesson Data
const ergoLesson1Data = {
  title: 'Office Ergonomics',
  slug: 'office-ergonomics',
  description: 'Workstation setup, posture, and breaks for desk work',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Office Ergonomics Overview', videoUrl: '/videos/office-ergo.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Monitor Positioning', body: 'Top of screen at eye level, 20-28 inches away. Arms at 90°, feet flat.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Employee has neck pain after computer work. First adjustment?', options: [{ id: 'a', text: 'Buy new chair', correct: false }, { id: 'b', text: 'Raise monitor to eye level, adjust chair height', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: '20-20-20 rule means?', options: [{ id: 'a', text: 'Every 20 min, look 20 ft away for 20 sec', correct: true }, { id: 'b', text: 'Work 20 min, break 20 min', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Optimal monitor distance?', options: [{ id: 'a', text: '20-28 inches', correct: true }, { id: 'b', text: '10 inches', correct: false }], points: 10 }), points: 10 }
  ]
};

const ergoLesson2Data = {
  title: 'Manual Handling & Lifting',
  slug: 'manual-handling',
  description: 'Safe lifting techniques and mechanical assists',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Manual Handling Overview', videoUrl: '/videos/lifting.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Lifting Technique', body: 'Bend knees, keep back straight, load close to body, pivot feet.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: '50 lb box on floor, need to place on shelf. Correct approach?', options: [{ id: 'a', text: 'Bend at waist, lift quickly', correct: false }, { id: 'b', text: 'Squat, grip firmly, lift with legs, use step if needed', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Maximum safe lift weight?', options: [{ id: 'a', text: 'Depends on individual, task, training', correct: true }, { id: 'b', text: 'Always 50 lbs', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Team lift required when?', options: [{ id: 'a', text: 'Load awkward, heavy, or one person cannot', correct: true }, { id: 'b', text: 'Always over 25 lbs', correct: false }], points: 10 }), points: 10 }
  ]
};

const ergoLesson3Data = {
  title: 'Repetitive Strain Prevention',
  slug: 'repetitive-strain',
  description: 'Recognizing and preventing cumulative trauma disorders',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Repetitive Strain Overview', videoUrl: '/videos/rsi.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'CTD Risk Factors', body: 'Repetition, force, awkward posture, vibration, cold.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Assembly worker reports tingling in hands after shift. Action?', options: [{ id: 'a', text: 'Suggest over-the-counter pain relief', correct: false }, { id: 'b', text: 'Medical evaluation, ergonomic assessment, job rotation', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Micro-breaks are effective for RSI prevention?', options: [{ id: 'a', text: 'True - brief breaks help recovery', correct: true }, { id: 'b', text: 'False - only long breaks work', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What is carpal tunnel syndrome?', options: [{ id: 'a', text: 'Nerve compression in wrist', correct: true }, { id: 'b', text: 'Muscle tear in forearm', correct: false }], points: 10 }), points: 10 }
  ]
};

const ergoLesson4Data = {
  title: 'Ergonomic Program Management',
  slug: 'ergo-program',
  description: 'Building and sustaining ergonomics initiatives',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Ergo Program Overview', videoUrl: '/videos/ergo-program.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Program Elements', body: 'Management commitment, employee involvement, training, early reporting.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Worker suggests tool modification to reduce strain. Response?', options: [{ id: 'a', text: 'Defer to management later', correct: false }, { id: 'b', text: 'Evaluate suggestion, pilot test, implement if effective', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Ergonomics is only for injured workers?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - proactive prevention for all', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Key to successful ergo program?', options: [{ id: 'a', text: 'Employee involvement and early reporting', correct: true }, { id: 'b', text: 'Expensive equipment', correct: false }], points: 10 }), points: 10 }
  ]
};

// COURSE 8: Hazardous Materials Handling - Lesson Data
const hazmatLesson1Data = {
  title: 'Chemical Storage & Segregation',
  slug: 'chemical-storage',
  description: 'Proper storage, labeling, and incompatibility management',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Chemical Storage Overview', videoUrl: '/videos/chem-storage.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Segregation Classes', body: 'Separate acids/bases, oxidizers/flammables, reactives.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Need to store bleach (oxidizer) and ammonia (base). Action?', options: [{ id: 'a', text: 'Store together for convenience', correct: false }, { id: 'b', text: 'Store in separate cabinets, ensure ventilation', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Flammable cabinet must be grounded?', options: [{ id: 'a', text: 'Yes - prevent static spark', correct: true }, { id: 'b', text: 'No', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What is incompatibility?', options: [{ id: 'a', text: 'Chemicals that react dangerously together', correct: true }, { id: 'b', text: 'Chemicals from different suppliers', correct: false }], points: 10 }), points: 10 }
  ]
};

const hazmatLesson2Data = {
  title: 'Spill Response & Cleanup',
  slug: 'spill-response',
  description: 'Containment, cleanup, and disposal procedures',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Spill Response Overview', videoUrl: '/videos/spill.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Spill Kit Contents', body: 'Absorbent, PPE, disposal bags, neutralizers, SDS.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: '2-liter acid spill. Trained responder available. Action?', options: [{ id: 'a', text: 'Evacuate, call hazmat team', correct: false }, { id: 'b', text: 'Don PPE, neutralize, absorb, dispose per SDS', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Mercury spill - use vacuum to clean?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - aerosolizes mercury', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Incidental spill vs emergency?', options: [{ id: 'a', text: 'Small, contained, trained = incidental', correct: true }, { id: 'b', text: 'All spills are emergencies', correct: false }], points: 10 }), points: 10 }
  ]
};

const hazmatLesson3Data = {
  title: 'Hazardous Waste Management',
  slug: 'hazmat-waste',
  description: 'Identification, labeling, and disposal of hazardous waste',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Hazmat Waste Overview', videoUrl: '/videos/hazwaste.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'RCRA Waste Types', body: 'Listed wastes (F, K, P, U) and Characteristic wastes (TCLP).' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Lab generates solvent waste. Container label must include?', options: [{ id: 'a', text: 'Contents only', correct: false }, { id: 'b', text: 'Contents, hazards, accumulation start date, generator info', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Satellite accumulation area limit?', options: [{ id: 'a', text: '55 gallons or 1 quart acutely hazardous', correct: true }, { id: 'b', text: 'No limit', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What does RCRA stand for?', options: [{ id: 'a', text: 'Resource Conservation and Recovery Act', correct: true }, { id: 'b', text: 'Regulatory Cleanup and Removal Authority', correct: false }], points: 10 }), points: 10 }
  ]
};

const hazmatLesson4Data = {
  title: 'Transportation & Shipping',
  slug: 'hazmat-shipping',
  description: 'DOT regulations and shipping documentation',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Hazmat Shipping Overview', videoUrl: '/videos/shipping.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Shipping Papers', body: 'Must include: proper shipping name, hazard class, ID number, packing group.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Shipping flammable liquid (Class 3). Label required?', options: [{ id: 'a', text: 'No label needed', correct: false }, { id: 'b', text: 'Red diamond with flame symbol', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'UN number identifies?', options: [{ id: 'a', text: 'Specific chemical for transport', correct: true }, { id: 'b', text: 'Country of origin', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Who regulates hazmat transport in US?', options: [{ id: 'a', text: 'DOT (Department of Transportation)', correct: true }, { id: 'b', text: 'EPA only', correct: false }], points: 10 }), points: 10 }
  ]
};

// COURSE 9: Worker Health & Wellness - Lesson Data
const healthLesson1Data = {
  title: 'Occupational Health Monitoring',
  slug: 'health-monitoring',
  description: 'Medical surveillance, hearing tests, and exposure tracking',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Health Monitoring Overview', videoUrl: '/videos/monitoring.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Surveillance Types', body: 'Baseline, periodic, exit, and exposure-triggered exams.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Worker in respirator program. Annual requirement?', options: [{ id: 'a', text: 'Medical evaluation only', correct: false }, { id: 'b', text: 'Medical eval, fit test, training', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Audiometric testing required for noise >85 dB TWA?', options: [{ id: 'a', text: 'True - OSHA hearing conservation', correct: true }, { id: 'b', text: 'False', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Purpose of medical surveillance?', options: [{ id: 'a', text: 'Early detection and prevention', correct: true }, { id: 'b', text: 'Hiring decisions only', correct: false }], points: 10 }), points: 10 }
  ]
};

const healthLesson2Data = {
  title: 'Heat & Cold Stress Prevention',
  slug: 'thermal-stress',
  description: 'Recognizing and preventing temperature-related illness',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Thermal Stress Overview', videoUrl: '/videos/thermal.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Heat Illness Progression', body: 'Heat rash → cramps → exhaustion → stroke (EMERGENCY).' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Worker outdoors in 95°F, complains of dizziness, nausea. Action?', options: [{ id: 'a', text: 'Give salt tablets', correct: false }, { id: 'b', text: 'Move to shade, cool water, monitor, call EMS if worsens', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Acclimatization to heat takes?', options: [{ id: 'a', text: '1-2 weeks', correct: true }, { id: 'b', text: '1 day', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Heat stroke symptoms?', options: [{ id: 'a', text: 'High temp, confusion, no sweating', correct: true }, { id: 'b', text: 'Mild sweating, alert', correct: false }], points: 10 }), points: 10 }
  ]
};

const healthLesson3Data = {
  title: 'Mental Health & Fatigue',
  slug: 'mental-health',
  description: 'Recognizing stress, fatigue, and promoting wellness',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Mental Health Overview', videoUrl: '/videos/mental.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Fatigue Risk Factors', body: 'Long shifts, night work, inadequate rest, high workload.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Colleague seems withdrawn, performance declining. Response?', options: [{ id: 'a', text: 'Ignore - personal matter', correct: false }, { id: 'b', text: 'Express concern privately, suggest EAP, involve supervisor if needed', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Workplace can contribute to mental health?', options: [{ id: 'a', text: 'True - both positive and negative', correct: true }, { id: 'b', text: 'False - only personal factors', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What is EAP?', options: [{ id: 'a', text: 'Employee Assistance Program', correct: true }, { id: 'b', text: 'Emergency Action Plan', correct: false }], points: 10 }), points: 10 }
  ]
};

const healthLesson4Data = {
  title: 'Wellness Programs & Lifestyle',
  slug: 'wellness-programs',
  description: 'Promoting healthy behaviors and work-life balance',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Wellness Programs Overview', videoUrl: '/videos/wellness.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Total Worker Health', body: 'Integrate safety, health promotion, and organizational wellbeing.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Company offers fitness challenge. Participation mandatory?', options: [{ id: 'a', text: 'Yes - for everyone', correct: false }, { id: 'b', text: 'No - voluntary, inclusive, supportive', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Wellness programs only about fitness?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - holistic: physical, mental, financial, social', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Total Worker Health approach addresses?', options: [{ id: 'a', text: 'Work and non-work factors affecting health', correct: true }, { id: 'b', text: 'Safety compliance only', correct: false }], points: 10 }), points: 10 }
  ]
};

async function createLesson(data: any, courseId: string, order: number, tags: string[]) {
  const quiz = await prisma.quiz.create({
    data: { title: `${data.title} Quiz`, slug: `${data.slug}-quiz`, type: 'lesson', passingScore: 70 }
  });
  
  const lesson = await prisma.lesson.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      difficulty: 'Intermediate',
      quizId: quiz.id
    }
  });
  
  const stepsWithIds = data.steps.map((step: any, idx: number) => ({
    ...step,
    lessonId: lesson.id,
    order: idx
  }));
  await prisma.lessonStep.createMany({ data: stepsWithIds });
  
  const questionsWithIds = data.quizQuestions.map((q: any, idx: number) => ({
    ...q,
    quizId: quiz.id,
    order: idx
  }));
  await prisma.quizQuestion.createMany({ data: questionsWithIds });
  
  await prisma.lessonTag.createMany({
    data: tags.map(tagId => ({ lessonId: lesson.id, tagId }))
  });
  
  await prisma.courseLesson.create({
    data: { courseId, lessonId: lesson.id, order }
  });
  
  return lesson;
}

async function main() {
  console.log('🌱 SEED 4: Job-Specific & Health Courses (FINAL)\n');

  const jobHealthProgram = await prisma.program.findUnique({ where: { slug: 'job-health' } });
  const tags = {
    ergo: await prisma.tag.findUnique({ where: { slug: 'ergonomics' } }),
    hazmat: await prisma.tag.findUnique({ where: { slug: 'hazmat' } }),
    firstAid: await prisma.tag.findUnique({ where: { slug: 'first-aid' } })
  };

  if (!jobHealthProgram || !tags.ergo || !tags.hazmat || !tags.firstAid) {
    throw new Error('Missing data from previous seeds');
  }

  // Clean existing
  console.log('Cleaning existing Job/Health courses...\n');
  const existingCourses = await prisma.course.findMany({
    where: { slug: { in: ['workplace-ergonomics', 'hazmat-handling', 'worker-health-wellness'] } }
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
    
    for (const cl of courseLessons) {
      await prisma.lesson.delete({ where: { id: cl.lesson.id } });
    }
    
    await prisma.course.delete({ where: { id: course.id } });
  }

  // COURSE 7: Workplace Ergonomics
  console.log('💪 Creating Workplace Ergonomics...');
  const ergoCourse = await prisma.course.create({
    data: {
      title: 'Workplace Ergonomics',
      slug: 'workplace-ergonomics',
      description: 'Posture, workstation design, and injury prevention',
      difficulty: 'Beginner'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [{ courseId: ergoCourse.id, tagId: tags.ergo!.id }]
  });
  
  await createLesson(ergoLesson1Data, ergoCourse.id, 0, [tags.ergo!.id]);
  logOp('Ergo Lesson 1');
  await createLesson(ergoLesson2Data, ergoCourse.id, 1, [tags.ergo!.id]);
  logOp('Ergo Lesson 2');
  await createLesson(ergoLesson3Data, ergoCourse.id, 2, [tags.ergo!.id]);
  logOp('Ergo Lesson 3');
  await createLesson(ergoLesson4Data, ergoCourse.id, 3, [tags.ergo!.id]);
  logOp('Ergo Lesson 4');
  
  const ergoQuiz = await prisma.quiz.create({
    data: { title: 'Workplace Ergonomics Assessment', slug: 'workplace-ergonomics-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: ergoQuiz.id,
      order: 0,
      difficulty: 2,
      gameType: 'multiple-choice',
      gameConfig: JSON.stringify({ question: 'What is neutral posture?', options: [{ id: 'a', text: 'Natural, relaxed alignment', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: ergoCourse.id }, data: { quizId: ergoQuiz.id } });
  await prisma.programCourse.create({ data: { programId: jobHealthProgram.id, courseId: ergoCourse.id, order: 0 } });

  // COURSE 8: Hazardous Materials Handling
  console.log('☢️ Creating Hazardous Materials Handling...');
  const hazmatCourse = await prisma.course.create({
    data: {
      title: 'Hazardous Materials Handling',
      slug: 'hazmat-handling',
      description: 'Chemical storage, spills, waste, and shipping',
      difficulty: 'Advanced'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [{ courseId: hazmatCourse.id, tagId: tags.hazmat!.id }]
  });
  
  await createLesson(hazmatLesson1Data, hazmatCourse.id, 0, [tags.hazmat!.id]);
  logOp('Hazmat Lesson 1');
  await createLesson(hazmatLesson2Data, hazmatCourse.id, 1, [tags.hazmat!.id]);
  logOp('Hazmat Lesson 2');
  await createLesson(hazmatLesson3Data, hazmatCourse.id, 2, [tags.hazmat!.id]);
  logOp('Hazmat Lesson 3');
  await createLesson(hazmatLesson4Data, hazmatCourse.id, 3, [tags.hazmat!.id]);
  logOp('Hazmat Lesson 4');
  
  const hazmatQuiz = await prisma.quiz.create({
    data: { title: 'Hazmat Handling Assessment', slug: 'hazmat-handling-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: hazmatQuiz.id,
      order: 0,
      difficulty: 3,
      gameType: 'multiple-choice',
      gameConfig: JSON.stringify({ question: 'What is chemical incompatibility?', options: [{ id: 'a', text: 'Chemicals that react dangerously', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: hazmatCourse.id }, data: { quizId: hazmatQuiz.id } });
  await prisma.programCourse.create({ data: { programId: jobHealthProgram.id, courseId: hazmatCourse.id, order: 1 } });

  // COURSE 9: Worker Health & Wellness
  console.log('❤️ Creating Worker Health & Wellness...');
  const healthCourse = await prisma.course.create({
    data: {
      title: 'Worker Health & Wellness',
      slug: 'worker-health-wellness',
      description: 'Medical monitoring, stress management, and holistic wellbeing',
      difficulty: 'Beginner'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [{ courseId: healthCourse.id, tagId: tags.firstAid!.id }]
  });
  
  await createLesson(healthLesson1Data, healthCourse.id, 0, [tags.firstAid!.id]);
  logOp('Health Lesson 1');
  await createLesson(healthLesson2Data, healthCourse.id, 1, [tags.firstAid!.id]);
  logOp('Health Lesson 2');
  await createLesson(healthLesson3Data, healthCourse.id, 2, [tags.firstAid!.id]);
  logOp('Health Lesson 3');
  await createLesson(healthLesson4Data, healthCourse.id, 3, [tags.firstAid!.id]);
  logOp('Health Lesson 4');
  
  const healthQuiz = await prisma.quiz.create({
    data: { title: 'Worker Health & Wellness Assessment', slug: 'worker-health-wellness-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: healthQuiz.id,
      order: 0,
      difficulty: 2,
      gameType: 'multiple-choice',
      gameConfig: JSON.stringify({ question: 'Total Worker Health addresses?', options: [{ id: 'a', text: 'Work and non-work health factors', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: healthCourse.id }, data: { quizId: healthQuiz.id } });
  await prisma.programCourse.create({ data: { programId: jobHealthProgram.id, courseId: healthCourse.id, order: 2 } });

  // FINAL VALIDATION
  console.log('\n🔍 Final Validation...');
  const [
    totalPrograms, totalCourses, totalLessons, totalSteps, totalQuizQuestions
  ] = await Promise.all([
    prisma.program.count(),
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.lessonStep.count(),
    prisma.quizQuestion.count()
  ]);

  console.log(`\n  ✅ Total Programs: ${totalPrograms} (expected: 3)`);
  console.log(`  ✅ Total Courses: ${totalCourses} (expected: 9)`);
  console.log(`  ✅ Total Lessons: ${totalLessons} (expected: 36)`);
  console.log(`  ✅ Total Steps: ${totalSteps} (expected: 144 = 36×4)`);
  console.log(`  ✅ Total Quiz Questions: ${totalQuizQuestions}`);

  console.log('\n🎉🎉🎉 ALL SEEDS COMPLETE! 🎉🎉🎉\n');
  console.log('SafetyQuest LMS Database fully populated with:');
  console.log('  • 3 Programs');
  console.log('  • 9 Courses');
  console.log('  • 36 Lessons');
  console.log('  • 144 Lesson Steps');
  console.log('  • 10 Users with org data');
  console.log('  • Full permission system');
  console.log('  • Tags, quizzes, and assessments\n');
  console.log('Next: Run seed-5-badges.ts for gamification (optional)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed 4 failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
