-- Drop the UNIQUE constraint (not index) on Course.quizId
IF EXISTS (
    SELECT * FROM sys.key_constraints 
    WHERE name = 'Course_quizId_key' 
    AND parent_object_id = OBJECT_ID('Course')
)
BEGIN
    ALTER TABLE [Course] DROP CONSTRAINT [Course_quizId_key];
END

-- Create filtered unique index that allows multiple NULLs
CREATE UNIQUE NONCLUSTERED INDEX [Course_quizId_key]
ON [Course]([quizId])
WHERE [quizId] IS NOT NULL;

-- Drop the UNIQUE constraint on Lesson.quizId
IF EXISTS (
    SELECT * FROM sys.key_constraints 
    WHERE name = 'Lesson_quizId_key' 
    AND parent_object_id = OBJECT_ID('Lesson')
)
BEGIN
    ALTER TABLE [Lesson] DROP CONSTRAINT [Lesson_quizId_key];
END

-- Create filtered unique index that allows multiple NULLs
CREATE UNIQUE NONCLUSTERED INDEX [Lesson_quizId_key]
ON [Lesson]([quizId])
WHERE [quizId] IS NOT NULL;