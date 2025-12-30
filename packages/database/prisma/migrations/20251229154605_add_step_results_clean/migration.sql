/*
  Adding stepResults column to LessonProgress for game state persistence
*/

BEGIN TRY
    BEGIN TRAN;

    -- Add stepResults column
    IF NOT EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'LessonProgress' 
        AND COLUMN_NAME = 'stepResults'
    )
    BEGIN
        ALTER TABLE [dbo].[LessonProgress] ADD [stepResults] NVARCHAR(max);
    END

    -- Add Course.quizId unique constraint (if needed by schema)
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = 'Course_quizId_key' 
        AND object_id = OBJECT_ID('dbo.Course')
    )
    BEGIN
        ALTER TABLE [dbo].[Course] ADD CONSTRAINT [Course_quizId_key] UNIQUE NONCLUSTERED ([quizId]);
    END

    -- Add Lesson.quizId unique constraint (if needed by schema)
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = 'Lesson_quizId_key' 
        AND object_id = OBJECT_ID('dbo.Lesson')
    )
    BEGIN
        ALTER TABLE [dbo].[Lesson] ADD CONSTRAINT [Lesson_quizId_key] UNIQUE NONCLUSTERED ([quizId]);
    END

    -- Add User.roleId index (if needed by schema)
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.indexes 
        WHERE name = 'User_roleId_idx' 
        AND object_id = OBJECT_ID('dbo.User')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX [User_roleId_idx] ON [dbo].[User]([roleId]);
    END

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    THROW
END CATCH