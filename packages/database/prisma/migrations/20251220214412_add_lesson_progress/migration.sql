/*
  Warnings:

  - A unique constraint covering the columns `[quizId]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[quizId]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[LessonProgress] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [lessonId] NVARCHAR(1000) NOT NULL,
    [currentStepIndex] INT NOT NULL CONSTRAINT [LessonProgress_currentStepIndex_df] DEFAULT 0,
    [completedSteps] NVARCHAR(max) NOT NULL,
    [accumulatedXp] INT NOT NULL CONSTRAINT [LessonProgress_accumulatedXp_df] DEFAULT 0,
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [LessonProgress_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [lastActivityAt] DATETIME2 NOT NULL,
    CONSTRAINT [LessonProgress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LessonProgress_userId_lessonId_key] UNIQUE NONCLUSTERED ([userId],[lessonId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonProgress_userId_idx] ON [dbo].[LessonProgress]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonProgress_lessonId_idx] ON [dbo].[LessonProgress]([lessonId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonProgress_lastActivityAt_idx] ON [dbo].[LessonProgress]([lastActivityAt]);

-- AddForeignKey
ALTER TABLE [dbo].[LessonProgress] ADD CONSTRAINT [LessonProgress_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LessonProgress] ADD CONSTRAINT [LessonProgress_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[Lesson]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
