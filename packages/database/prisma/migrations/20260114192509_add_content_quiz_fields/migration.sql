BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[LessonAttempt] ADD [contentCompleted] BIT NOT NULL CONSTRAINT [LessonAttempt_contentCompleted_df] DEFAULT 0,
[quizAttempted] BIT NOT NULL CONSTRAINT [LessonAttempt_quizAttempted_df] DEFAULT 0;

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonAttempt_contentCompleted_idx] ON [dbo].[LessonAttempt]([contentCompleted]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
