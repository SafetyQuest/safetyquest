// ======================================================================================
// SEED 3: HAZARD & RISK MANAGEMENT COURSES - 3 Courses, 12 Lessons
// Run this THIRD (after seed-2-core-courses.ts)
// ======================================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let operationCount = 0;
const logOp = (message: string) => {
  operationCount++;
  console.log(`  [${operationCount.toString().padStart(3, ' ')}] ${message}`);
};

// COURSE 4: Hazard Identification - Lesson Data
const hazardLesson1Data = {
  title: 'Physical Hazard Identification',
  slug: 'physical-hazards',
  description: 'Identifying mechanical, noise, vibration, and thermal hazards',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Physical Hazards Overview', videoUrl: '/videos/physical.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Hazard Hierarchy', body: 'Eliminate > Substitute > Engineer > Admin > PPE' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Worker exposed to 92 dB noise 8 hrs/day. Action?', options: [{ id: 'a', text: 'Provide earplugs', correct: false }, { id: 'b', text: 'Engineering controls first, then hearing protection', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Administrative controls more effective than engineering?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'First step in hazard ID?', options: [{ id: 'a', text: 'Observe the task', correct: true }, { id: 'b', text: 'Buy PPE', correct: false }], points: 10 }), points: 10 }
  ]
};

const hazardLesson2Data = {
  title: 'Chemical Hazard Identification',
  slug: 'chemical-hazards',
  description: 'Recognizing chemical risks using SDS and labeling',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Chemical Hazards Overview', videoUrl: '/videos/chemical.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'GHS System', body: 'Globally Harmonized System: pictograms, signal words, hazard statements' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Unknown liquid in unlabeled bottle. Action?', options: [{ id: 'a', text: 'Smell to identify', correct: false }, { id: 'b', text: 'Secure area, contact EHS, treat as hazardous', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Which SDS section has first aid?', options: [{ id: 'a', text: 'Section 4', correct: true }, { id: 'b', text: 'Section 1', correct: false }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'SDS Section 11 always required?', options: [{ id: 'a', text: 'False - may be confidential', correct: true }, { id: 'b', text: 'True', correct: false }], points: 10 }), points: 10 }
  ]
};

const hazardLesson3Data = {
  title: 'Ergonomic Hazard Identification',
  slug: 'ergonomic-hazards',
  description: 'Spotting MSD risks in work design and posture',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Ergonomic Hazards Overview', videoUrl: '/videos/ergo-haz.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'MSD Risk Factors', body: 'Awkward posture, repetition, force, contact stress' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Assembly worker has wrist pain after 2-hour task. Action?', options: [{ id: 'a', text: 'Provide wrist brace', correct: false }, { id: 'b', text: 'Ergonomic assessment, adjust workstation, job rotation', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Ergonomics only for office workers?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - all work', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What is neutral posture?', options: [{ id: 'a', text: 'Relaxed, natural alignment', correct: true }, { id: 'b', text: 'Standing straight', correct: false }], points: 10 }), points: 10 }
  ]
};

const hazardLesson4Data = {
  title: 'Biological & Psychosocial Hazards',
  slug: 'bio-psycho-hazards',
  description: 'Recognizing biological agents and stress factors',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Bio/Psychosocial Overview', videoUrl: '/videos/bio.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Universal Precautions', body: 'Treat all blood as infectious. Use appropriate PPE.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Needlestick injury. First action?', options: [{ id: 'a', text: 'Suck wound', correct: false }, { id: 'b', text: 'Wash with soap/water, report, medical eval', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Psychosocial hazards are not real workplace hazards?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What is universal precautions?', options: [{ id: 'a', text: 'Treat all human blood as infectious', correct: true }, { id: 'b', text: 'Only for known infections', correct: false }], points: 10 }), points: 10 }
  ]
};

// COURSE 5: Risk Assessment - Lesson Data
const riskLesson1Data = {
  title: 'Risk Assessment Basics',
  slug: 'risk-basics',
  description: 'Introduction to risk matrices and qualitative assessment',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Risk Basics Overview', videoUrl: '/videos/risk-basics.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Risk Matrix', body: 'Risk = Likelihood × Severity. Scale 1-5 each.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Risk rating 15 (3×5). Controls reduce to 6 (2×3). Acceptable?', options: [{ id: 'a', text: 'Yes - below threshold', correct: true, points: 5 }, { id: 'b', text: 'No - still requires review', correct: false }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Risk assessment is one-time activity?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - review when processes change', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What does ALARP mean?', options: [{ id: 'a', text: 'As Low As Reasonably Practicable', correct: true }, { id: 'b', text: 'Accept Low And Reasonable Probability', correct: false }], points: 10 }), points: 10 }
  ]
};

const riskLesson2Data = {
  title: 'Quantitative Risk Assessment',
  slug: 'quant-risk',
  description: 'Using exposure data and dose-response for risk calculation',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Quantitative Risk Overview', videoUrl: '/videos/quant.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Exposure Limits', body: 'PEL: OSHA legal limit. REL: NIOSH recommended. TLV: ACGIH guideline.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Silica sampling shows 0.06 mg/m³ (PEL=0.05). Action?', options: [{ id: 'a', text: 'Continue work', correct: false }, { id: 'b', text: 'Implement controls, re-sample', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'PEL is the safe exposure level?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - legal limit, lower is better', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What is TWA?', options: [{ id: 'a', text: 'Time-Weighted Average exposure', correct: true }, { id: 'b', text: 'Total Weight Average', correct: false }], points: 10 }), points: 10 }
  ]
};

const riskLesson3Data = {
  title: 'Dynamic Risk Assessment',
  slug: 'dynamic-risk',
  description: 'Real-time risk evaluation for non-routine tasks',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Dynamic Risk Overview', videoUrl: '/videos/dynamic.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Stop Work Authority', body: 'Any employee can halt unsafe work. Take 5: pause, assess, plan.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'During hot work, wind shifts toward flammables. Action?', options: [{ id: 'a', text: 'Continue carefully', correct: false }, { id: 'b', text: 'Stop work, re-assess, implement controls', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Dynamic risk assessment replaces formal JHAs?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - complements them', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Who can call a Stop Work?', options: [{ id: 'a', text: 'Any trained employee', correct: true }, { id: 'b', text: 'Supervisors only', correct: false }], points: 10 }), points: 10 }
  ]
};

const riskLesson4Data = {
  title: 'Risk Documentation & Review',
  slug: 'risk-docs',
  description: 'Recording assessments and ensuring continuous improvement',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Risk Documentation Overview', videoUrl: '/videos/docs.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Living Documents', body: 'Risk assessments must be reviewed and updated regularly.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Assessment shows high risk, worker says "I am used to it". You should?', options: [{ id: 'a', text: 'Accept worker preference', correct: false }, { id: 'b', text: 'Explain long-term risk, involve in solution', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Risk assessments should be filed and forgotten?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - must be reviewed regularly', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What is CAPA?', options: [{ id: 'a', text: 'Corrective and Preventive Action', correct: true }, { id: 'b', text: 'Computer-Aided Process Analysis', correct: false }], points: 10 }), points: 10 }
  ]
};

// COURSE 6: Incident Investigation - Lesson Data
const incidentLesson1Data = {
  title: 'Investigation Preparation',
  slug: 'investigation-prep',
  description: 'Securing scenes and assembling investigation teams',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Investigation Prep Overview', videoUrl: '/videos/prep.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Scene Preservation', body: 'Secure scene. Preserve evidence. Assemble cross-functional team.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Minor injury - coworker cleaned area before you arrived. Action?', options: [{ id: 'a', text: 'Proceed with interview only', correct: false }, { id: 'b', text: 'Document alteration, gather photos/witnesses, note limitation', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Only serious incidents require investigation?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - all incidents and near misses', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Who should be on investigation team?', options: [{ id: 'a', text: 'Supervisor, worker, safety, subject expert', correct: true }, { id: 'b', text: 'Safety only', correct: false }], points: 10 }), points: 10 }
  ]
};

const incidentLesson2Data = {
  title: 'Data Collection Techniques',
  slug: 'data-collection',
  description: 'Interviewing, document review, and evidence gathering',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Data Collection Overview', videoUrl: '/videos/data.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'Triangulation', body: 'Verify facts with 3+ independent sources. Use open questions.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Worker says "I was trained", but no record. Action?', options: [{ id: 'a', text: 'Accept worker statement', correct: false }, { id: 'b', text: 'Note discrepancy, investigate training process, verify competency', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Goal is to find who is at fault?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - goal is prevention', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What is triangulation?', options: [{ id: 'a', text: 'Verify facts with 3+ independent sources', correct: true }, { id: 'b', text: 'Three investigators', correct: false }], points: 10 }), points: 10 }
  ]
};

const incidentLesson3Data = {
  title: 'Root Cause Analysis',
  slug: 'root-cause-analysis',
  description: 'Using 5 Whys, Fishbone, and logic trees',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Root Cause Overview', videoUrl: '/videos/root.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: '5 Whys & Fishbone', body: 'Ask why 5 times. Use Fishbone: Man, Machine, Method, Material, Environment.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Worker trips on cord. Investigation finds 3 prior near misses. Root cause?', options: [{ id: 'a', text: 'Worker not paying attention', correct: false }, { id: 'b', text: 'Inadequate hazard reporting system and housekeeping process', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Root cause is always a single factor?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - usually multiple interacting causes', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 3, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Purpose of 5 Whys?', options: [{ id: 'a', text: 'Drill to root cause', correct: true }, { id: 'b', text: 'Find 5 causes', correct: false }], points: 10 }), points: 10 }
  ]
};

const incidentLesson4Data = {
  title: 'Reporting & Follow-Up',
  slug: 'investigation-reporting',
  description: 'Writing effective reports and ensuring corrective actions',
  steps: [
    { type: 'content', contentType: 'video', contentData: JSON.stringify({ title: 'Reporting Overview', videoUrl: '/videos/reporting.mp4', duration: 180 }) },
    { type: 'content', contentType: 'text', contentData: JSON.stringify({ title: 'SMART Actions', body: 'Specific, Measurable, Assignable, Realistic, Time-bound.' }) },
    { type: 'game', gameType: 'scenario', gameConfig: JSON.stringify({ question: 'Recommendation: "Improve training". Is this sufficient?', options: [{ id: 'a', text: 'Yes - clear instruction', correct: false }, { id: 'b', text: 'No - must be specific with owner and date', correct: true, points: 5 }] }) },
    { type: 'game', gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'Report is the end of investigation?', options: [{ id: 'a', text: 'True', correct: false }, { id: 'b', text: 'False - follow-up and verification critical', correct: true }], points: 5 }) }
  ],
  quizQuestions: [
    { difficulty: 2, gameType: 'multiple-choice', gameConfig: JSON.stringify({ question: 'What makes a recommendation SMART?', options: [{ id: 'a', text: 'Specific, Measurable, Assignable, Realistic, Time-bound', correct: true }, { id: 'b', text: 'Short, Memorable, Actionable, Realistic, Timely', correct: false }], points: 10 }), points: 10 }
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
  console.log('🌱 SEED 3: Hazard & Risk Management Courses\n');

  const hazardProgram = await prisma.program.findUnique({ where: { slug: 'hazard-risk-mgmt' } });
  const tags = {
    hazmat: await prisma.tag.findUnique({ where: { slug: 'hazmat' } }),
    ergo: await prisma.tag.findUnique({ where: { slug: 'ergonomics' } }),
    emergency: await prisma.tag.findUnique({ where: { slug: 'emergency' } })
  };

  if (!hazardProgram || !tags.hazmat || !tags.ergo || !tags.emergency) {
    throw new Error('Missing data from previous seeds');
  }

  // Clean existing
  console.log('Cleaning existing Hazard courses...\n');
  const existingCourses = await prisma.course.findMany({
    where: { slug: { in: ['hazard-identification', 'risk-assessment', 'incident-investigation'] } }
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

  // COURSE 4: Hazard Identification
  console.log('🔍 Creating Hazard Identification Techniques...');
  const hazardCourse = await prisma.course.create({
    data: {
      title: 'Hazard Identification Techniques',
      slug: 'hazard-identification',
      description: 'Job hazard analysis, observation, and proactive detection',
      difficulty: 'Intermediate'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [
      { courseId: hazardCourse.id, tagId: tags.hazmat!.id },
      { courseId: hazardCourse.id, tagId: tags.ergo!.id }
    ]
  });
  
  await createLesson(hazardLesson1Data, hazardCourse.id, 0, [tags.hazmat!.id]);
  logOp('Hazard Lesson 1');
  await createLesson(hazardLesson2Data, hazardCourse.id, 1, [tags.hazmat!.id]);
  logOp('Hazard Lesson 2');
  await createLesson(hazardLesson3Data, hazardCourse.id, 2, [tags.ergo!.id]);
  logOp('Hazard Lesson 3');
  await createLesson(hazardLesson4Data, hazardCourse.id, 3, [tags.hazmat!.id, tags.emergency!.id]);
  logOp('Hazard Lesson 4');
  
  const hazardQuiz = await prisma.quiz.create({
    data: { title: 'Hazard Identification Assessment', slug: 'hazard-identification-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: hazardQuiz.id,
      order: 0,
      difficulty: 3,
      gameType: 'multiple-choice',
      gameConfig: JSON.stringify({ question: 'First step in hazard hierarchy?', options: [{ id: 'a', text: 'Elimination', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: hazardCourse.id }, data: { quizId: hazardQuiz.id } });
  await prisma.programCourse.create({ data: { programId: hazardProgram.id, courseId: hazardCourse.id, order: 0 } });

  // COURSE 5: Risk Assessment
  console.log('⚖️ Creating Risk Assessment & Control...');
  const riskCourse = await prisma.course.create({
    data: {
      title: 'Risk Assessment & Control',
      slug: 'risk-assessment',
      description: 'Evaluating likelihood, severity, and implementing controls',
      difficulty: 'Advanced'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [
      { courseId: riskCourse.id, tagId: tags.hazmat!.id },
      { courseId: riskCourse.id, tagId: tags.ergo!.id }
    ]
  });
  
  await createLesson(riskLesson1Data, riskCourse.id, 0, [tags.hazmat!.id]);
  logOp('Risk Lesson 1');
  await createLesson(riskLesson2Data, riskCourse.id, 1, [tags.hazmat!.id]);
  logOp('Risk Lesson 2');
  await createLesson(riskLesson3Data, riskCourse.id, 2, [tags.hazmat!.id]);
  logOp('Risk Lesson 3');
  await createLesson(riskLesson4Data, riskCourse.id, 3, [tags.hazmat!.id]);
  logOp('Risk Lesson 4');
  
  const riskQuiz = await prisma.quiz.create({
    data: { title: 'Risk Assessment Assessment', slug: 'risk-assessment-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: riskQuiz.id,
      order: 0,
      difficulty: 3,
      gameType: 'multiple-choice',
      gameConfig: JSON.stringify({ question: 'What is risk?', options: [{ id: 'a', text: 'Likelihood × Severity', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: riskCourse.id }, data: { quizId: riskQuiz.id } });
  await prisma.programCourse.create({ data: { programId: hazardProgram.id, courseId: riskCourse.id, order: 1 } });

  // COURSE 6: Incident Investigation
  console.log('🔬 Creating Incident Investigation...');
  const incidentCourse = await prisma.course.create({
    data: {
      title: 'Incident Investigation',
      slug: 'incident-investigation',
      description: 'Root cause analysis, corrective actions, and prevention',
      difficulty: 'Advanced'
    }
  });
  
  await prisma.courseTag.createMany({
    data: [
      { courseId: incidentCourse.id, tagId: tags.hazmat!.id },
      { courseId: incidentCourse.id, tagId: tags.emergency!.id }
    ]
  });
  
  await createLesson(incidentLesson1Data, incidentCourse.id, 0, [tags.emergency!.id]);
  logOp('Incident Lesson 1');
  await createLesson(incidentLesson2Data, incidentCourse.id, 1, [tags.emergency!.id]);
  logOp('Incident Lesson 2');
  await createLesson(incidentLesson3Data, incidentCourse.id, 2, [tags.hazmat!.id]);
  logOp('Incident Lesson 3');
  await createLesson(incidentLesson4Data, incidentCourse.id, 3, [tags.emergency!.id]);
  logOp('Incident Lesson 4');
  
  const incidentQuiz = await prisma.quiz.create({
    data: { title: 'Incident Investigation Assessment', slug: 'incident-investigation-assessment', type: 'course', passingScore: 80 }
  });
  await prisma.quizQuestion.create({
    data: {
      quizId: incidentQuiz.id,
      order: 0,
      difficulty: 3,
      gameType: 'multiple-choice',
      gameConfig: JSON.stringify({ question: 'Goal of investigation?', options: [{ id: 'a', text: 'Prevention, not blame', correct: true }], points: 10 }),
      points: 10
    }
  });
  await prisma.course.update({ where: { id: incidentCourse.id }, data: { quizId: incidentQuiz.id } });
  await prisma.programCourse.create({ data: { programId: hazardProgram.id, courseId: incidentCourse.id, order: 2 } });

  // Validation
  console.log('\n🔍 Validating...');
  const [courseCount, lessonCount, stepCount] = await Promise.all([
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.lessonStep.count()
  ]);

  console.log(`  ✅ Total Courses: ${courseCount}`);
  console.log(`  ✅ Total Lessons: ${lessonCount}`);
  console.log(`  ✅ Total Steps: ${stepCount}`);

  console.log('\n🎉 SEED 3 COMPLETE!\n');
  console.log('Next: Run seed-4-health-courses.ts for the final 3 courses\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed 3 failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
