export const VIRTUAL_PROGRAM_PREFIX = 'course-'

export function makeVirtualProgramId(courseId: string) {
  return `${VIRTUAL_PROGRAM_PREFIX}${courseId}`
}

export function isVirtualProgram(programId: string) {
  return programId.startsWith(VIRTUAL_PROGRAM_PREFIX)
}

export function extractCourseId(programId: string) {
  return programId.replace(VIRTUAL_PROGRAM_PREFIX, '')
}
