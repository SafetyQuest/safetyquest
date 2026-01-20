// packages/database/prisma/seed-badges.ts
// Run with: npx ts-node prisma/seed-badges.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// LESSON BADGES (28 Total)
// ============================================
export const lessonBadges = [
  // AWAKENING FAMILY (1, 3, 6, 9)
  { badgeKey: 'lesson_awakening_bronze', name: 'Awakening', description: 'Begin your safety journey', category: 'lesson', family: 'awakening', tier: 'bronze', icon: 'BookOpen', requirement: 1, xpBonus: 25, displayOrder: 1 },
  { badgeKey: 'lesson_awakening_silver', name: 'Awakening', description: 'Begin your safety journey', category: 'lesson', family: 'awakening', tier: 'silver', icon: 'BookOpen', requirement: 3, xpBonus: 35, displayOrder: 2 },
  { badgeKey: 'lesson_awakening_gold', name: 'Awakening', description: 'Begin your safety journey', category: 'lesson', family: 'awakening', tier: 'gold', icon: 'BookOpen', requirement: 6, xpBonus: 50, displayOrder: 3 },
  { badgeKey: 'lesson_awakening_platinum', name: 'Awakening', description: 'Begin your safety journey', category: 'lesson', family: 'awakening', tier: 'platinum', icon: 'BookOpen', requirement: 9, xpBonus: 75, displayOrder: 4 },
  
  // THE CLIMB BEGINS FAMILY (13, 17, 21, 25)
  { badgeKey: 'lesson_theclimbbegins_bronze', name: 'The Climb Begins', description: 'Taking the first steps', category: 'lesson', family: 'theclimbbegins', tier: 'bronze', icon: 'Footprints', requirement: 13, xpBonus: 50, displayOrder: 5 },
  { badgeKey: 'lesson_theclimbbegins_silver', name: 'The Climb Begins', description: 'Taking the first steps', category: 'lesson', family: 'theclimbbegins', tier: 'silver', icon: 'Footprints', requirement: 17, xpBonus: 65, displayOrder: 6 },
  { badgeKey: 'lesson_theclimbbegins_gold', name: 'The Climb Begins', description: 'Taking the first steps', category: 'lesson', family: 'theclimbbegins', tier: 'gold', icon: 'Footprints', requirement: 21, xpBonus: 85, displayOrder: 7 },
  { badgeKey: 'lesson_theclimbbegins_platinum', name: 'The Climb Begins', description: 'Taking the first steps', category: 'lesson', family: 'theclimbbegins', tier: 'platinum', icon: 'Footprints', requirement: 25, xpBonus: 110, displayOrder: 8 },
  
  // PATHFINDER FAMILY (31, 36, 40, 45)
  { badgeKey: 'lesson_pathfinder_bronze', name: 'Pathfinder', description: 'Finding your way', category: 'lesson', family: 'pathfinder', tier: 'bronze', icon: 'Compass', requirement: 31, xpBonus: 75, displayOrder: 9 },
  { badgeKey: 'lesson_pathfinder_silver', name: 'Pathfinder', description: 'Finding your way', category: 'lesson', family: 'pathfinder', tier: 'silver', icon: 'Compass', requirement: 36, xpBonus: 95, displayOrder: 10 },
  { badgeKey: 'lesson_pathfinder_gold', name: 'Pathfinder', description: 'Finding your way', category: 'lesson', family: 'pathfinder', tier: 'gold', icon: 'Compass', requirement: 40, xpBonus: 120, displayOrder: 11 },
  { badgeKey: 'lesson_pathfinder_platinum', name: 'Pathfinder', description: 'Finding your way', category: 'lesson', family: 'pathfinder', tier: 'platinum', icon: 'Compass', requirement: 45, xpBonus: 150, displayOrder: 12 },
  
  // LORE HUNTER FAMILY (51, 57, 63, 70)
  { badgeKey: 'lesson_lorehunter_bronze', name: 'Lore Hunter', description: 'Seeking knowledge', category: 'lesson', family: 'lorehunter', tier: 'bronze', icon: 'Search', requirement: 51, xpBonus: 100, displayOrder: 13 },
  { badgeKey: 'lesson_lorehunter_silver', name: 'Lore Hunter', description: 'Seeking knowledge', category: 'lesson', family: 'lorehunter', tier: 'silver', icon: 'Search', requirement: 57, xpBonus: 130, displayOrder: 14 },
  { badgeKey: 'lesson_lorehunter_gold', name: 'Lore Hunter', description: 'Seeking knowledge', category: 'lesson', family: 'lorehunter', tier: 'gold', icon: 'Search', requirement: 63, xpBonus: 165, displayOrder: 15 },
  { badgeKey: 'lesson_lorehunter_platinum', name: 'Lore Hunter', description: 'Seeking knowledge', category: 'lesson', family: 'lorehunter', tier: 'platinum', icon: 'Search', requirement: 70, xpBonus: 205, displayOrder: 16 },
  
  // KNOWLEDGE KNIGHT FAMILY (77, 84, 91, 100)
  { badgeKey: 'lesson_knowledgeknight_bronze', name: 'Knowledge Knight', description: 'Defender of learning', category: 'lesson', family: 'knowledgeknight', tier: 'bronze', icon: 'Sword', requirement: 77, xpBonus: 150, displayOrder: 17 },
  { badgeKey: 'lesson_knowledgeknight_silver', name: 'Knowledge Knight', description: 'Defender of learning', category: 'lesson', family: 'knowledgeknight', tier: 'silver', icon: 'Sword', requirement: 84, xpBonus: 190, displayOrder: 18 },
  { badgeKey: 'lesson_knowledgeknight_gold', name: 'Knowledge Knight', description: 'Defender of learning', category: 'lesson', family: 'knowledgeknight', tier: 'gold', icon: 'Sword', requirement: 91, xpBonus: 235, displayOrder: 19 },
  { badgeKey: 'lesson_knowledgeknight_platinum', name: 'Knowledge Knight', description: 'Defender of learning', category: 'lesson', family: 'knowledgeknight', tier: 'platinum', icon: 'Sword', requirement: 100, xpBonus: 290, displayOrder: 20 },
  
  // KNOWLEDGE LORD FAMILY (106, 113, 119, 125)
  { badgeKey: 'lesson_knowledgelord_bronze', name: 'Knowledge Lord', description: 'Master of lessons', category: 'lesson', family: 'knowledgelord', tier: 'bronze', icon: 'Crown', requirement: 106, xpBonus: 200, displayOrder: 21 },
  { badgeKey: 'lesson_knowledgelord_silver', name: 'Knowledge Lord', description: 'Master of lessons', category: 'lesson', family: 'knowledgelord', tier: 'silver', icon: 'Crown', requirement: 113, xpBonus: 255, displayOrder: 22 },
  { badgeKey: 'lesson_knowledgelord_gold', name: 'Knowledge Lord', description: 'Master of lessons', category: 'lesson', family: 'knowledgelord', tier: 'gold', icon: 'Crown', requirement: 119, xpBonus: 320, displayOrder: 23 },
  { badgeKey: 'lesson_knowledgelord_platinum', name: 'Knowledge Lord', description: 'Master of lessons', category: 'lesson', family: 'knowledgelord', tier: 'platinum', icon: 'Crown', requirement: 125, xpBonus: 400, displayOrder: 24 },
  
  // THE ONE WHO KNOWS FAMILY (131, 137, 143, 150)
  { badgeKey: 'lesson_theonewhoknows_bronze', name: 'The One Who Knows', description: 'Ultimate learner', category: 'lesson', family: 'theonewhoknows', tier: 'bronze', icon: 'Star', requirement: 131, xpBonus: 350, displayOrder: 25 },
  { badgeKey: 'lesson_theonewhoknows_silver', name: 'The One Who Knows', description: 'Ultimate learner', category: 'lesson', family: 'theonewhoknows', tier: 'silver', icon: 'Star', requirement: 137, xpBonus: 450, displayOrder: 26 },
  { badgeKey: 'lesson_theonewhoknows_gold', name: 'The One Who Knows', description: 'Ultimate learner', category: 'lesson', family: 'theonewhoknows', tier: 'gold', icon: 'Star', requirement: 143, xpBonus: 600, displayOrder: 27 },
  { badgeKey: 'lesson_theonewhoknows_platinum', name: 'The One Who Knows', description: 'Ultimate learner', category: 'lesson', family: 'theonewhoknows', tier: 'platinum', icon: 'Star', requirement: 150, xpBonus: 1000, displayOrder: 28 },
]

// ============================================
// COURSE BADGES (20 Total)
// ============================================
export const courseBadges = [
  // COURSE NOVICE FAMILY (1, 2, 3, 4)
  { badgeKey: 'course_novice_bronze', name: 'Course Novice', description: 'First course conquered', category: 'course', family: 'novice', tier: 'bronze', icon: 'GraduationCap', requirement: 1, xpBonus: 50, displayOrder: 1 },
  { badgeKey: 'course_novice_silver', name: 'Course Novice', description: 'First course conquered', category: 'course', family: 'novice', tier: 'silver', icon: 'GraduationCap', requirement: 2, xpBonus: 75, displayOrder: 2 },
  { badgeKey: 'course_novice_gold', name: 'Course Novice', description: 'First course conquered', category: 'course', family: 'novice', tier: 'gold', icon: 'GraduationCap', requirement: 3, xpBonus: 100, displayOrder: 3 },
  { badgeKey: 'course_novice_platinum', name: 'Course Novice', description: 'First course conquered', category: 'course', family: 'novice', tier: 'platinum', icon: 'GraduationCap', requirement: 4, xpBonus: 130, displayOrder: 4 },
  
  // COURSE SQUIRE FAMILY (6, 8, 10, 12)
  { badgeKey: 'course_squire_bronze', name: 'Course Squire', description: 'Apprentice learner', category: 'course', family: 'squire', tier: 'bronze', icon: 'Shield', requirement: 6, xpBonus: 100, displayOrder: 5 },
  { badgeKey: 'course_squire_silver', name: 'Course Squire', description: 'Apprentice learner', category: 'course', family: 'squire', tier: 'silver', icon: 'Shield', requirement: 8, xpBonus: 140, displayOrder: 6 },
  { badgeKey: 'course_squire_gold', name: 'Course Squire', description: 'Apprentice learner', category: 'course', family: 'squire', tier: 'gold', icon: 'Shield', requirement: 10, xpBonus: 185, displayOrder: 7 },
  { badgeKey: 'course_squire_platinum', name: 'Course Squire', description: 'Apprentice learner', category: 'course', family: 'squire', tier: 'platinum', icon: 'Shield', requirement: 12, xpBonus: 235, displayOrder: 8 },
  
  // COURSE KNIGHT FAMILY (14, 17, 20, 23)
  { badgeKey: 'course_knight_bronze', name: 'Course Knight', description: 'Course champion', category: 'course', family: 'knight', tier: 'bronze', icon: 'Trophy', requirement: 14, xpBonus: 175, displayOrder: 9 },
  { badgeKey: 'course_knight_silver', name: 'Course Knight', description: 'Course champion', category: 'course', family: 'knight', tier: 'silver', icon: 'Trophy', requirement: 17, xpBonus: 230, displayOrder: 10 },
  { badgeKey: 'course_knight_gold', name: 'Course Knight', description: 'Course champion', category: 'course', family: 'knight', tier: 'gold', icon: 'Trophy', requirement: 20, xpBonus: 295, displayOrder: 11 },
  { badgeKey: 'course_knight_platinum', name: 'Course Knight', description: 'Course champion', category: 'course', family: 'knight', tier: 'platinum', icon: 'Trophy', requirement: 23, xpBonus: 370, displayOrder: 12 },
  
  // COURSE LORD FAMILY (26, 29, 32, 35)
  { badgeKey: 'course_lord_bronze', name: 'Course Lord', description: 'Course master', category: 'course', family: 'lord', tier: 'bronze', icon: 'Castle', requirement: 26, xpBonus: 275, displayOrder: 13 },
  { badgeKey: 'course_lord_silver', name: 'Course Lord', description: 'Course master', category: 'course', family: 'lord', tier: 'silver', icon: 'Castle', requirement: 29, xpBonus: 355, displayOrder: 14 },
  { badgeKey: 'course_lord_gold', name: 'Course Lord', description: 'Course master', category: 'course', family: 'lord', tier: 'gold', icon: 'Castle', requirement: 32, xpBonus: 450, displayOrder: 15 },
  { badgeKey: 'course_lord_platinum', name: 'Course Lord', description: 'Course master', category: 'course', family: 'lord', tier: 'platinum', icon: 'Castle', requirement: 35, xpBonus: 560, displayOrder: 16 },
  
  // COURSE ARCHLORD FAMILY (37, 40, 42, 45)
  { badgeKey: 'course_archlord_bronze', name: 'Course Archlord', description: 'Ultimate course conqueror', category: 'course', family: 'archlord', tier: 'bronze', icon: 'Gem', requirement: 37, xpBonus: 450, displayOrder: 17 },
  { badgeKey: 'course_archlord_silver', name: 'Course Archlord', description: 'Ultimate course conqueror', category: 'course', family: 'archlord', tier: 'silver', icon: 'Gem', requirement: 40, xpBonus: 600, displayOrder: 18 },
  { badgeKey: 'course_archlord_gold', name: 'Course Archlord', description: 'Ultimate course conqueror', category: 'course', family: 'archlord', tier: 'gold', icon: 'Gem', requirement: 42, xpBonus: 800, displayOrder: 19 },
  { badgeKey: 'course_archlord_platinum', name: 'Course Archlord', description: 'Ultimate course conqueror', category: 'course', family: 'archlord', tier: 'platinum', icon: 'Gem', requirement: 45, xpBonus: 1200, displayOrder: 20 },
]

// ============================================
// PROGRAM BADGES (16 Total)
// ============================================
export const programBadges = [
  // PROGRAM BARON FAMILY (1, 2, 3, 4)
  { badgeKey: 'program_baron_bronze', name: 'Program Baron', description: 'First program complete', category: 'program', family: 'baron', tier: 'bronze', icon: 'Award', requirement: 1, xpBonus: 150, displayOrder: 1 },
  { badgeKey: 'program_baron_silver', name: 'Program Baron', description: 'First program complete', category: 'program', family: 'baron', tier: 'silver', icon: 'Award', requirement: 2, xpBonus: 225, displayOrder: 2 },
  { badgeKey: 'program_baron_gold', name: 'Program Baron', description: 'First program complete', category: 'program', family: 'baron', tier: 'gold', icon: 'Award', requirement: 3, xpBonus: 310, displayOrder: 3 },
  { badgeKey: 'program_baron_platinum', name: 'Program Baron', description: 'First program complete', category: 'program', family: 'baron', tier: 'platinum', icon: 'Award', requirement: 4, xpBonus: 410, displayOrder: 4 },
  
  // PROGRAM VISCOUNT FAMILY (5, 6, 7, 8)
  { badgeKey: 'program_viscount_bronze', name: 'Program Viscount', description: 'Program achiever', category: 'program', family: 'viscount', tier: 'bronze', icon: 'Medal', requirement: 5, xpBonus: 350, displayOrder: 5 },
  { badgeKey: 'program_viscount_silver', name: 'Program Viscount', description: 'Program achiever', category: 'program', family: 'viscount', tier: 'silver', icon: 'Medal', requirement: 6, xpBonus: 460, displayOrder: 6 },
  { badgeKey: 'program_viscount_gold', name: 'Program Viscount', description: 'Program achiever', category: 'program', family: 'viscount', tier: 'gold', icon: 'Medal', requirement: 7, xpBonus: 585, displayOrder: 7 },
  { badgeKey: 'program_viscount_platinum', name: 'Program Viscount', description: 'Program achiever', category: 'program', family: 'viscount', tier: 'platinum', icon: 'Medal', requirement: 8, xpBonus: 725, displayOrder: 8 },
  
  // PROGRAM DUKE FAMILY (9, 10, 11, 12)
  { badgeKey: 'program_duke_bronze', name: 'Program Duke', description: 'Program expert', category: 'program', family: 'duke', tier: 'bronze', icon: 'Crown', requirement: 9, xpBonus: 550, displayOrder: 9 },
  { badgeKey: 'program_duke_silver', name: 'Program Duke', description: 'Program expert', category: 'program', family: 'duke', tier: 'silver', icon: 'Crown', requirement: 10, xpBonus: 700, displayOrder: 10 },
  { badgeKey: 'program_duke_gold', name: 'Program Duke', description: 'Program expert', category: 'program', family: 'duke', tier: 'gold', icon: 'Crown', requirement: 11, xpBonus: 870, displayOrder: 11 },
  { badgeKey: 'program_duke_platinum', name: 'Program Duke', description: 'Program expert', category: 'program', family: 'duke', tier: 'platinum', icon: 'Crown', requirement: 12, xpBonus: 1060, displayOrder: 12 },
  
  // PROGRAM ARCHDUKE FAMILY (13, 14, 15, 16)
  { badgeKey: 'program_archduke_bronze', name: 'Program Archduke', description: 'Program legend', category: 'program', family: 'archduke', tier: 'bronze', icon: 'Sparkles', requirement: 13, xpBonus: 850, displayOrder: 13 },
  { badgeKey: 'program_archduke_silver', name: 'Program Archduke', description: 'Program legend', category: 'program', family: 'archduke', tier: 'silver', icon: 'Sparkles', requirement: 14, xpBonus: 1100, displayOrder: 14 },
  { badgeKey: 'program_archduke_gold', name: 'Program Archduke', description: 'Program legend', category: 'program', family: 'archduke', tier: 'gold', icon: 'Sparkles', requirement: 15, xpBonus: 1400, displayOrder: 15 },
  { badgeKey: 'program_archduke_platinum', name: 'Program Archduke', description: 'Program legend', category: 'program', family: 'archduke', tier: 'platinum', icon: 'Sparkles', requirement: 16, xpBonus: 2000, displayOrder: 16 },
]

// ============================================
// OTHER BADGES (19 Total)
// ============================================
export const otherBadges = [
  // ACCURACY - PERFECT (100%) - 4 badges
  { badgeKey: 'accuracy_perfect_1', name: 'Flawless Victory', description: 'First perfect quiz', category: 'accuracy', family: 'perfect', tier: 'gold', icon: 'Target', requirement: 1, xpBonus: 100, displayOrder: 1 },
  { badgeKey: 'accuracy_perfect_3', name: 'Triple Crown', description: 'Consistency begins', category: 'accuracy', family: 'perfect', tier: 'gold', icon: 'Zap', requirement: 3, xpBonus: 200, displayOrder: 2 },
  { badgeKey: 'accuracy_perfect_5', name: 'Unbroken Victory', description: 'Perfect streak', category: 'accuracy', family: 'perfect', tier: 'platinum', icon: 'CheckCircle', requirement: 5, xpBonus: 350, displayOrder: 3 },
  { badgeKey: 'accuracy_perfect_10', name: 'Precision Master', description: 'Perfection achieved', category: 'accuracy', family: 'perfect', tier: 'platinum', icon: 'Crosshair', requirement: 10, xpBonus: 600, displayOrder: 4 },
  
  // ACCURACY - EXCELLENT (90%+) - 4 badges
  { badgeKey: 'accuracy_excellent_1', name: 'High Achiever', description: 'Excellence starts', category: 'accuracy', family: 'excellent', tier: 'bronze', icon: 'TrendingUp', requirement: 1, xpBonus: 50, displayOrder: 5 },
  { badgeKey: 'accuracy_excellent_5', name: 'Consistent Excellence', description: 'Reliable performer', category: 'accuracy', family: 'excellent', tier: 'silver', icon: 'BarChart', requirement: 5, xpBonus: 150, displayOrder: 6 },
  { badgeKey: 'accuracy_excellent_10', name: 'Top Performer', description: 'High achiever', category: 'accuracy', family: 'excellent', tier: 'gold', icon: 'Award', requirement: 10, xpBonus: 300, displayOrder: 7 },
  { badgeKey: 'accuracy_excellent_25', name: 'Elite Scholar', description: 'Scholar elite', category: 'accuracy', family: 'excellent', tier: 'platinum', icon: 'Brain', requirement: 25, xpBonus: 500, displayOrder: 8 },
  
  // DIFFICULTY - 3 badges
  { badgeKey: 'difficulty_advanced_5', name: 'Challenge Breaker', description: 'Facing challenges', category: 'difficulty', family: 'advanced', tier: 'silver', icon: 'Mountain', requirement: 5, xpBonus: 200, displayOrder: 1 },
  { badgeKey: 'difficulty_advanced_10', name: 'Conqueror', description: 'Challenge conqueror', category: 'difficulty', family: 'advanced', tier: 'gold', icon: 'Flag', requirement: 10, xpBonus: 400, displayOrder: 2 },
  { badgeKey: 'difficulty_advanced_20', name: 'Master of Difficulty', description: 'Difficulty master', category: 'difficulty', family: 'advanced', tier: 'platinum', icon: 'Flame', requirement: 20, xpBonus: 700, displayOrder: 3 },
  
  // STREAK - 6 badges
  { badgeKey: 'streak_3', name: 'On Fire', description: 'Getting started', category: 'streak', family: 'streak', tier: 'bronze', icon: 'Flame', requirement: 3, xpBonus: 50, displayOrder: 1 },
  { badgeKey: 'streak_7', name: 'Committed', description: 'Building momentum', category: 'streak', family: 'streak', tier: 'silver', icon: 'Calendar', requirement: 7, xpBonus: 100, displayOrder: 2 },
  { badgeKey: 'streak_14', name: 'Dedicated', description: 'Two weeks strong', category: 'streak', family: 'streak', tier: 'silver', icon: 'Clock', requirement: 14, xpBonus: 200, displayOrder: 3 },
  { badgeKey: 'streak_30', name: 'Champion', description: 'Month of learning', category: 'streak', family: 'streak', tier: 'gold', icon: 'Trophy', requirement: 30, xpBonus: 400, displayOrder: 4 },
  { badgeKey: 'streak_60', name: 'Unstoppable', description: 'Two months strong', category: 'streak', family: 'streak', tier: 'gold', icon: 'Rocket', requirement: 60, xpBonus: 600, displayOrder: 5 },
  { badgeKey: 'streak_100', name: 'Legend', description: '100 days of dedication', category: 'streak', family: 'streak', tier: 'platinum', icon: 'Star', requirement: 100, xpBonus: 1000, displayOrder: 6 },
  
  // SPECIAL - 2 badges
  { badgeKey: 'special_complete', name: 'Training Complete', description: 'All programs done', category: 'special', family: 'special', tier: 'platinum', icon: 'CheckCircle2', requirement: 100, xpBonus: 1000, displayOrder: 1 },
  { badgeKey: 'special_certified', name: 'Safety Certified', description: 'Excellence overall', category: 'special', family: 'special', tier: 'platinum', icon: 'ShieldCheck', requirement: 90, xpBonus: 1500, displayOrder: 2 },
]

// ============================================
// COMBINED EXPORT
// ============================================
export const allBadges = [
  ...lessonBadges,
  ...courseBadges,
  ...programBadges,
  ...otherBadges
]

// ============================================
// SEED FUNCTION
// ============================================
export async function seedBadges() {
  console.log('🏅 Seeding badges...')
  
  let created = 0
  let updated = 0
  
  for (const badge of allBadges) {
    const result = await prisma.badge.upsert({
      where: { badgeKey: badge.badgeKey },
      create: badge,
      update: badge
    })
    
    // Check if it was created or updated based on createdAt
    const isNew = result.createdAt.getTime() > Date.now() - 1000
    if (isNew) created++
    else updated++
  }
  
  console.log(`✅ Seeded ${allBadges.length} badges successfully!`)
  console.log(`   - Created: ${created}`)
  console.log(`   - Updated: ${updated}`)
  console.log(`   - Lesson badges: ${lessonBadges.length}`)
  console.log(`   - Course badges: ${courseBadges.length}`)
  console.log(`   - Program badges: ${programBadges.length}`)
  console.log(`   - Other badges: ${otherBadges.length}`)
}

// Run if executed directly
async function main() {
  try {
    await seedBadges()
  } catch (error) {
    console.error('Error seeding badges:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
