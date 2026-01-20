/*
  Warnings:

  - A unique constraint covering the columns `[quizId]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[quizId]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- ================================
-- Create UserTypeCourseAssignment table
-- ================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserTypeCourseAssignment')
BEGIN
    CREATE TABLE [dbo].[UserTypeCourseAssignment] (
        [id] NVARCHAR(1000) NOT NULL,
        [userTypeId] NVARCHAR(1000) NOT NULL,
        [courseId] NVARCHAR(1000) NOT NULL,
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserTypeCourseAssignment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [UserTypeCourseAssignment_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [UserTypeCourseAssignment_userTypeId_courseId_key] UNIQUE NONCLUSTERED ([userTypeId],[courseId])
    );
END;

-- ================================
-- Create CourseAssignment table
-- ================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CourseAssignment')
BEGIN
    CREATE TABLE [dbo].[CourseAssignment] (
        [id] NVARCHAR(1000) NOT NULL,
        [userId] NVARCHAR(1000) NOT NULL,
        [courseId] NVARCHAR(1000) NOT NULL,
        [source] NVARCHAR(1000) NOT NULL,
        [isActive] BIT NOT NULL CONSTRAINT [CourseAssignment_isActive_df] DEFAULT 1,
        [assignedBy] NVARCHAR(1000),
        [assignedAt] DATETIME2 NOT NULL CONSTRAINT [CourseAssignment_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [CourseAssignment_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [CourseAssignment_userId_courseId_source_key] UNIQUE NONCLUSTERED ([userId],[courseId],[source])
    );
END;

-- ================================
-- Create indexes for UserTypeCourseAssignment
-- ================================
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'UserTypeCourseAssignment_userTypeId_idx' 
    AND object_id = OBJECT_ID('[dbo].[UserTypeCourseAssignment]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [UserTypeCourseAssignment_userTypeId_idx] 
    ON [dbo].[UserTypeCourseAssignment]([userTypeId]);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'UserTypeCourseAssignment_courseId_idx' 
    AND object_id = OBJECT_ID('[dbo].[UserTypeCourseAssignment]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [UserTypeCourseAssignment_courseId_idx] 
    ON [dbo].[UserTypeCourseAssignment]([courseId]);
END;

-- ================================
-- Create indexes for CourseAssignment
-- ================================
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'CourseAssignment_userId_idx' 
    AND object_id = OBJECT_ID('[dbo].[CourseAssignment]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [CourseAssignment_userId_idx] 
    ON [dbo].[CourseAssignment]([userId]);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'CourseAssignment_courseId_idx' 
    AND object_id = OBJECT_ID('[dbo].[CourseAssignment]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [CourseAssignment_courseId_idx] 
    ON [dbo].[CourseAssignment]([courseId]);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'CourseAssignment_isActive_idx' 
    AND object_id = OBJECT_ID('[dbo].[CourseAssignment]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [CourseAssignment_isActive_idx] 
    ON [dbo].[CourseAssignment]([isActive]);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'CourseAssignment_source_idx' 
    AND object_id = OBJECT_ID('[dbo].[CourseAssignment]')
)
BEGIN
    CREATE NONCLUSTERED INDEX [CourseAssignment_source_idx] 
    ON [dbo].[CourseAssignment]([source]);
END;

-- ================================
-- REMOVED: Course.quizId and Lesson.quizId unique constraints
-- These are handled by existing migrations with filtered indexes
-- ================================

-- ================================
-- Add foreign keys for UserTypeCourseAssignment
-- ================================
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'UserTypeCourseAssignment_userTypeId_fkey'
)
BEGIN
    ALTER TABLE [dbo].[UserTypeCourseAssignment] 
    ADD CONSTRAINT [UserTypeCourseAssignment_userTypeId_fkey] 
    FOREIGN KEY ([userTypeId]) REFERENCES [dbo].[UserType]([id]) 
    ON DELETE CASCADE ON UPDATE CASCADE;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'UserTypeCourseAssignment_courseId_fkey'
)
BEGIN
    ALTER TABLE [dbo].[UserTypeCourseAssignment] 
    ADD CONSTRAINT [UserTypeCourseAssignment_courseId_fkey] 
    FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) 
    ON DELETE CASCADE ON UPDATE CASCADE;
END;

-- ================================
-- Add foreign keys for CourseAssignment
-- ================================
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'CourseAssignment_userId_fkey'
)
BEGIN
    ALTER TABLE [dbo].[CourseAssignment] 
    ADD CONSTRAINT [CourseAssignment_userId_fkey] 
    FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) 
    ON DELETE CASCADE ON UPDATE CASCADE;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'CourseAssignment_courseId_fkey'
)
BEGIN
    ALTER TABLE [dbo].[CourseAssignment] 
    ADD CONSTRAINT [CourseAssignment_courseId_fkey] 
    FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) 
    ON DELETE CASCADE ON UPDATE CASCADE;
END;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH