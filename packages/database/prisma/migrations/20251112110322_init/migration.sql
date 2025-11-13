BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'LEARNER',
    [section] NVARCHAR(1000),
    [department] NVARCHAR(1000),
    [supervisor] NVARCHAR(1000),
    [manager] NVARCHAR(1000),
    [designation] NVARCHAR(1000),
    [userTypeId] NVARCHAR(1000),
    [xp] INT NOT NULL CONSTRAINT [User_xp_df] DEFAULT 0,
    [level] INT NOT NULL CONSTRAINT [User_level_df] DEFAULT 1,
    [streak] INT NOT NULL CONSTRAINT [User_streak_df] DEFAULT 0,
    [lastActivity] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[UserType] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserType_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [UserType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserType_name_key] UNIQUE NONCLUSTERED ([name]),
    CONSTRAINT [UserType_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Program] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [Program_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Program_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Program_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Program_title_key] UNIQUE NONCLUSTERED ([title]),
    CONSTRAINT [Program_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[UserTypeProgramAssignment] (
    [id] NVARCHAR(1000) NOT NULL,
    [userTypeId] NVARCHAR(1000) NOT NULL,
    [programId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserTypeProgramAssignment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [UserTypeProgramAssignment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserTypeProgramAssignment_userTypeId_programId_key] UNIQUE NONCLUSTERED ([userTypeId],[programId])
);

-- CreateTable
CREATE TABLE [dbo].[ProgramAssignment] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [programId] NVARCHAR(1000) NOT NULL,
    [source] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [ProgramAssignment_isActive_df] DEFAULT 1,
    [assignedBy] NVARCHAR(1000),
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [ProgramAssignment_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProgramAssignment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProgramAssignment_userId_programId_source_key] UNIQUE NONCLUSTERED ([userId],[programId],[source])
);

-- CreateTable
CREATE TABLE [dbo].[Course] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [difficulty] NVARCHAR(1000) NOT NULL CONSTRAINT [Course_difficulty_df] DEFAULT 'Beginner',
    [quizId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Course_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Course_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Course_title_key] UNIQUE NONCLUSTERED ([title]),
    CONSTRAINT [Course_slug_key] UNIQUE NONCLUSTERED ([slug]),
    CONSTRAINT [Course_quizId_key] UNIQUE NONCLUSTERED ([quizId])
);

-- CreateTable
CREATE TABLE [dbo].[ProgramCourse] (
    [id] NVARCHAR(1000) NOT NULL,
    [programId] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [ProgramCourse_order_df] DEFAULT 0,
    CONSTRAINT [ProgramCourse_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProgramCourse_programId_courseId_key] UNIQUE NONCLUSTERED ([programId],[courseId])
);

-- CreateTable
CREATE TABLE [dbo].[Lesson] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [difficulty] NVARCHAR(1000) NOT NULL CONSTRAINT [Lesson_difficulty_df] DEFAULT 'Beginner',
    [quizId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Lesson_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Lesson_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Lesson_title_key] UNIQUE NONCLUSTERED ([title]),
    CONSTRAINT [Lesson_slug_key] UNIQUE NONCLUSTERED ([slug]),
    CONSTRAINT [Lesson_quizId_key] UNIQUE NONCLUSTERED ([quizId])
);

-- CreateTable
CREATE TABLE [dbo].[CourseLesson] (
    [id] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [lessonId] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [CourseLesson_order_df] DEFAULT 0,
    CONSTRAINT [CourseLesson_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CourseLesson_courseId_lessonId_key] UNIQUE NONCLUSTERED ([courseId],[lessonId])
);

-- CreateTable
CREATE TABLE [dbo].[LessonStep] (
    [id] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [contentType] NVARCHAR(1000),
    [contentData] NVARCHAR(max),
    [gameType] NVARCHAR(1000),
    [gameConfig] NVARCHAR(max),
    [lessonId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [LessonStep_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Quiz] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [passingScore] INT NOT NULL CONSTRAINT [Quiz_passingScore_df] DEFAULT 80,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Quiz_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Quiz_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Quiz_title_key] UNIQUE NONCLUSTERED ([title]),
    CONSTRAINT [Quiz_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[QuizQuestion] (
    [id] NVARCHAR(1000) NOT NULL,
    [quizId] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL,
    [difficulty] INT NOT NULL CONSTRAINT [QuizQuestion_difficulty_df] DEFAULT 3,
    [gameType] NVARCHAR(1000) NOT NULL,
    [gameConfig] NVARCHAR(max) NOT NULL,
    [points] INT NOT NULL CONSTRAINT [QuizQuestion_points_df] DEFAULT 10,
    CONSTRAINT [QuizQuestion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Tag] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Tag_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tag_name_key] UNIQUE NONCLUSTERED ([name]),
    CONSTRAINT [Tag_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[CourseTag] (
    [id] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [tagId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CourseTag_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CourseTag_courseId_tagId_key] UNIQUE NONCLUSTERED ([courseId],[tagId])
);

-- CreateTable
CREATE TABLE [dbo].[LessonTag] (
    [id] NVARCHAR(1000) NOT NULL,
    [lessonId] NVARCHAR(1000) NOT NULL,
    [tagId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [LessonTag_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LessonTag_lessonId_tagId_key] UNIQUE NONCLUSTERED ([lessonId],[tagId])
);

-- CreateTable
CREATE TABLE [dbo].[LessonAttempt] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [lessonId] NVARCHAR(1000) NOT NULL,
    [quizScore] INT NOT NULL,
    [quizMaxScore] INT NOT NULL,
    [passed] BIT NOT NULL,
    [timeSpent] INT,
    [completedAt] DATETIME2 NOT NULL CONSTRAINT [LessonAttempt_completedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [LessonAttempt_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LessonAttempt_userId_lessonId_key] UNIQUE NONCLUSTERED ([userId],[lessonId])
);

-- CreateTable
CREATE TABLE [dbo].[CourseAttempt] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [quizScore] INT NOT NULL,
    [quizMaxScore] INT NOT NULL,
    [passed] BIT NOT NULL,
    [completedAt] DATETIME2 NOT NULL CONSTRAINT [CourseAttempt_completedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CourseAttempt_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CourseAttempt_userId_courseId_key] UNIQUE NONCLUSTERED ([userId],[courseId])
);

-- CreateTable
CREATE TABLE [dbo].[QuizAttempt] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [quizId] NVARCHAR(1000) NOT NULL,
    [score] INT NOT NULL,
    [maxScore] INT NOT NULL,
    [passed] BIT NOT NULL,
    [answers] NVARCHAR(max) NOT NULL,
    [completedAt] DATETIME2 NOT NULL CONSTRAINT [QuizAttempt_completedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [QuizAttempt_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Badge] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [iconUrl] NVARCHAR(1000),
    [criteria] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Badge_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Badge_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Badge_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[UserBadge] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [badgeId] NVARCHAR(1000) NOT NULL,
    [awardedAt] DATETIME2 NOT NULL CONSTRAINT [UserBadge_awardedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [UserBadge_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserBadge_userId_badgeId_key] UNIQUE NONCLUSTERED ([userId],[badgeId])
);

-- CreateTable
CREATE TABLE [dbo].[RefresherSchedule] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [programId] NVARCHAR(1000) NOT NULL,
    [nextDue] DATETIME2 NOT NULL,
    [intervalMonths] INT NOT NULL,
    [lastSent] DATETIME2,
    CONSTRAINT [RefresherSchedule_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefresherSchedule_userId_programId_key] UNIQUE NONCLUSTERED ([userId],[programId])
);

-- CreateTable
CREATE TABLE [dbo].[EmailLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [to] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [template] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [metadata] NVARCHAR(max),
    [sentAt] DATETIME2 NOT NULL CONSTRAINT [EmailLog_sentAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [EmailLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_email_idx] ON [dbo].[User]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_userTypeId_idx] ON [dbo].[User]([userTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_department_idx] ON [dbo].[User]([department]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_section_idx] ON [dbo].[User]([section]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserType_slug_idx] ON [dbo].[UserType]([slug]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Program_slug_idx] ON [dbo].[Program]([slug]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Program_isActive_idx] ON [dbo].[Program]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserTypeProgramAssignment_userTypeId_idx] ON [dbo].[UserTypeProgramAssignment]([userTypeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserTypeProgramAssignment_programId_idx] ON [dbo].[UserTypeProgramAssignment]([programId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramAssignment_userId_idx] ON [dbo].[ProgramAssignment]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramAssignment_programId_idx] ON [dbo].[ProgramAssignment]([programId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramAssignment_isActive_idx] ON [dbo].[ProgramAssignment]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramAssignment_source_idx] ON [dbo].[ProgramAssignment]([source]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Course_slug_idx] ON [dbo].[Course]([slug]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Course_difficulty_idx] ON [dbo].[Course]([difficulty]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramCourse_programId_idx] ON [dbo].[ProgramCourse]([programId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramCourse_courseId_idx] ON [dbo].[ProgramCourse]([courseId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ProgramCourse_order_idx] ON [dbo].[ProgramCourse]([order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Lesson_slug_idx] ON [dbo].[Lesson]([slug]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Lesson_difficulty_idx] ON [dbo].[Lesson]([difficulty]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CourseLesson_courseId_idx] ON [dbo].[CourseLesson]([courseId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CourseLesson_lessonId_idx] ON [dbo].[CourseLesson]([lessonId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CourseLesson_order_idx] ON [dbo].[CourseLesson]([order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonStep_lessonId_idx] ON [dbo].[LessonStep]([lessonId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonStep_order_idx] ON [dbo].[LessonStep]([order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Quiz_slug_idx] ON [dbo].[Quiz]([slug]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Quiz_type_idx] ON [dbo].[Quiz]([type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuizQuestion_quizId_idx] ON [dbo].[QuizQuestion]([quizId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuizQuestion_order_idx] ON [dbo].[QuizQuestion]([order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuizQuestion_difficulty_idx] ON [dbo].[QuizQuestion]([difficulty]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Tag_slug_idx] ON [dbo].[Tag]([slug]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CourseTag_courseId_idx] ON [dbo].[CourseTag]([courseId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CourseTag_tagId_idx] ON [dbo].[CourseTag]([tagId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonTag_lessonId_idx] ON [dbo].[LessonTag]([lessonId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonTag_tagId_idx] ON [dbo].[LessonTag]([tagId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonAttempt_userId_idx] ON [dbo].[LessonAttempt]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonAttempt_lessonId_idx] ON [dbo].[LessonAttempt]([lessonId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LessonAttempt_passed_idx] ON [dbo].[LessonAttempt]([passed]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CourseAttempt_userId_idx] ON [dbo].[CourseAttempt]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CourseAttempt_courseId_idx] ON [dbo].[CourseAttempt]([courseId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CourseAttempt_passed_idx] ON [dbo].[CourseAttempt]([passed]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuizAttempt_userId_idx] ON [dbo].[QuizAttempt]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuizAttempt_quizId_idx] ON [dbo].[QuizAttempt]([quizId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [QuizAttempt_passed_idx] ON [dbo].[QuizAttempt]([passed]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Badge_name_idx] ON [dbo].[Badge]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserBadge_userId_idx] ON [dbo].[UserBadge]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserBadge_badgeId_idx] ON [dbo].[UserBadge]([badgeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefresherSchedule_nextDue_idx] ON [dbo].[RefresherSchedule]([nextDue]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RefresherSchedule_userId_idx] ON [dbo].[RefresherSchedule]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailLog_to_idx] ON [dbo].[EmailLog]([to]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailLog_sentAt_idx] ON [dbo].[EmailLog]([sentAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailLog_status_idx] ON [dbo].[EmailLog]([status]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_userTypeId_fkey] FOREIGN KEY ([userTypeId]) REFERENCES [dbo].[UserType]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserTypeProgramAssignment] ADD CONSTRAINT [UserTypeProgramAssignment_userTypeId_fkey] FOREIGN KEY ([userTypeId]) REFERENCES [dbo].[UserType]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserTypeProgramAssignment] ADD CONSTRAINT [UserTypeProgramAssignment_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProgramAssignment] ADD CONSTRAINT [ProgramAssignment_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProgramAssignment] ADD CONSTRAINT [ProgramAssignment_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Course] ADD CONSTRAINT [Course_quizId_fkey] FOREIGN KEY ([quizId]) REFERENCES [dbo].[Quiz]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProgramCourse] ADD CONSTRAINT [ProgramCourse_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProgramCourse] ADD CONSTRAINT [ProgramCourse_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Lesson] ADD CONSTRAINT [Lesson_quizId_fkey] FOREIGN KEY ([quizId]) REFERENCES [dbo].[Quiz]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CourseLesson] ADD CONSTRAINT [CourseLesson_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CourseLesson] ADD CONSTRAINT [CourseLesson_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[Lesson]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LessonStep] ADD CONSTRAINT [LessonStep_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[Lesson]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuizQuestion] ADD CONSTRAINT [QuizQuestion_quizId_fkey] FOREIGN KEY ([quizId]) REFERENCES [dbo].[Quiz]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CourseTag] ADD CONSTRAINT [CourseTag_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CourseTag] ADD CONSTRAINT [CourseTag_tagId_fkey] FOREIGN KEY ([tagId]) REFERENCES [dbo].[Tag]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LessonTag] ADD CONSTRAINT [LessonTag_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[Lesson]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LessonTag] ADD CONSTRAINT [LessonTag_tagId_fkey] FOREIGN KEY ([tagId]) REFERENCES [dbo].[Tag]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LessonAttempt] ADD CONSTRAINT [LessonAttempt_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LessonAttempt] ADD CONSTRAINT [LessonAttempt_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[Lesson]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CourseAttempt] ADD CONSTRAINT [CourseAttempt_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CourseAttempt] ADD CONSTRAINT [CourseAttempt_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuizAttempt] ADD CONSTRAINT [QuizAttempt_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuizAttempt] ADD CONSTRAINT [QuizAttempt_quizId_fkey] FOREIGN KEY ([quizId]) REFERENCES [dbo].[Quiz]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserBadge] ADD CONSTRAINT [UserBadge_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserBadge] ADD CONSTRAINT [UserBadge_badgeId_fkey] FOREIGN KEY ([badgeId]) REFERENCES [dbo].[Badge]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RefresherSchedule] ADD CONSTRAINT [RefresherSchedule_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RefresherSchedule] ADD CONSTRAINT [RefresherSchedule_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
