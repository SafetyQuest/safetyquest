/*
  Warnings:

  - A unique constraint covering the columns `[quizId]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[quizId]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[User] ADD [roleId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(500),
    [isSystem] BIT NOT NULL CONSTRAINT [Role_isSystem_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Role_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name]),
    CONSTRAINT [Role_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Permission] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [resource] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Permission_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Permission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permission_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[RolePermission] (
    [id] NVARCHAR(1000) NOT NULL,
    [roleId] NVARCHAR(1000) NOT NULL,
    [permissionId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [RolePermission_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [RolePermission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RolePermission_roleId_permissionId_key] UNIQUE NONCLUSTERED ([roleId],[permissionId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_slug_idx] ON [dbo].[Role]([slug]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Role_isSystem_idx] ON [dbo].[Role]([isSystem]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_resource_idx] ON [dbo].[Permission]([resource]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_action_idx] ON [dbo].[Permission]([action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Permission_resource_action_idx] ON [dbo].[Permission]([resource], [action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RolePermission_roleId_idx] ON [dbo].[RolePermission]([roleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RolePermission_permissionId_idx] ON [dbo].[RolePermission]([permissionId]);

-- ✅ Guarded index creation: Only create Course_quizId_key if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'Course_quizId_key'
      AND object_id = OBJECT_ID('[dbo].[Course]')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [Course_quizId_key]
    ON [dbo].[Course]([quizId])
    WHERE [quizId] IS NOT NULL;
END;

-- ✅ Guarded index creation: Only create Lesson_quizId_key if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'Lesson_quizId_key'
      AND object_id = OBJECT_ID('[dbo].[Lesson]')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [Lesson_quizId_key]
    ON [dbo].[Lesson]([quizId])
    WHERE [quizId] IS NOT NULL;
END;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_permissionId_fkey] FOREIGN KEY ([permissionId]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW;

END CATCH