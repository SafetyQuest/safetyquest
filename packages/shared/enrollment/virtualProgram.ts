/**
 * Virtual program helpers
 * A virtual program is a course exposed as a program
 */

export function makeVirtualProgramId(courseId: string): string {
    return `course-${courseId}`
  }
  
  export function isVirtualProgram(programId: string): boolean {
    return programId.startsWith('course-')
  }
  
  export function extractCourseId(programId: string): string {
    if (!isVirtualProgram(programId)) {
      throw new Error('Not a virtual program')
    }
  
    return programId.replace('course-', '')
  }
  