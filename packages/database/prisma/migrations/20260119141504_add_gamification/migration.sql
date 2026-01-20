/*
  Warnings:

  - You are about to drop the column `criteria` on the `Badge` table. All the data in the column will be lost.
  - You are about to drop the column `iconUrl` on the `Badge` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[badgeKey]` on the table `Badge` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `badgeKey` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requirement` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tier` to the `Badge` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [Badge_name_idx] ON [dbo].[Badge];

-- DropIndex
ALTER TABLE [dbo].[Badge] DROP CONSTRAINT [Badge_name_key];

-- AlterTable
ALTER TABLE [dbo].[Badge] DROP COLUMN [criteria],
[iconUrl];
ALTER TABLE [dbo].[Badge] ADD [badgeKey] NVARCHAR(1000) NOT NULL,
[category] NVARCHAR(1000) NOT NULL,
[displayOrder] INT NOT NULL CONSTRAINT [Badge_displayOrder_df] DEFAULT 0,
[family] NVARCHAR(1000),
[icon] NVARCHAR(1000) NOT NULL,
[requirement] INT NOT NULL,
[tier] NVARCHAR(1000) NOT NULL,
[xpBonus] INT NOT NULL CONSTRAINT [Badge_xpBonus_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[User] ADD [excellentQuizCount] INT NOT NULL CONSTRAINT [User_excellentQuizCount_df] DEFAULT 0,
[longestStreak] INT NOT NULL CONSTRAINT [User_longestStreak_df] DEFAULT 0,
[perfectQuizCount] INT NOT NULL CONSTRAINT [User_perfectQuizCount_df] DEFAULT 0;

-- CreateTable
CREATE TABLE [dbo].[UserStats] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [lessonsCompleted] INT NOT NULL CONSTRAINT [UserStats_lessonsCompleted_df] DEFAULT 0,
    [coursesCompleted] INT NOT NULL CONSTRAINT [UserStats_coursesCompleted_df] DEFAULT 0,
    [programsCompleted] INT NOT NULL CONSTRAINT [UserStats_programsCompleted_df] DEFAULT 0,
    [advancedLessons] INT NOT NULL CONSTRAINT [UserStats_advancedLessons_df] DEFAULT 0,
    [perfectQuizzes] INT NOT NULL CONSTRAINT [UserStats_perfectQuizzes_df] DEFAULT 0,
    [excellentQuizzes] INT NOT NULL CONSTRAINT [UserStats_excellentQuizzes_df] DEFAULT 0,
    [currentStreak] INT NOT NULL CONSTRAINT [UserStats_currentStreak_df] DEFAULT 0,
    [longestStreak] INT NOT NULL CONSTRAINT [UserStats_longestStreak_df] DEFAULT 0,
    [totalXp] INT NOT NULL CONSTRAINT [UserStats_totalXp_df] DEFAULT 0,
    [lastCalculated] DATETIME2 NOT NULL,
    CONSTRAINT [UserStats_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserStats_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[Certificate] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [templateUrl] NVARCHAR(1000),
    [level] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [issuedAt] DATETIME2 NOT NULL CONSTRAINT [Certificate_issuedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [pdfUrl] NVARCHAR(1000),
    CONSTRAINT [Certificate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Certificate_userId_level_key] UNIQUE NONCLUSTERED ([userId],[level])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserStats_userId_idx] ON [dbo].[UserStats]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Certificate_userId_idx] ON [dbo].[Certificate]([userId]);

-- CreateIndex
ALTER TABLE [dbo].[Badge] ADD CONSTRAINT [Badge_badgeKey_key] UNIQUE NONCLUSTERED ([badgeKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Badge_badgeKey_idx] ON [dbo].[Badge]([badgeKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Badge_category_idx] ON [dbo].[Badge]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Badge_family_idx] ON [dbo].[Badge]([family]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Badge_tier_idx] ON [dbo].[Badge]([tier]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [UserBadge_awardedAt_idx] ON [dbo].[UserBadge]([awardedAt]);

-- AddForeignKey
ALTER TABLE [dbo].[UserStats] ADD CONSTRAINT [UserStats_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Certificate] ADD CONSTRAINT [Certificate_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
