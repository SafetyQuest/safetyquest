BEGIN TRY
    BEGIN TRAN;

    -- ================================
    -- Only create Course_quizId_key if it doesn't exist
    -- ================================
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

    -- ================================
    -- Only create Lesson_quizId_key if it doesn't exist
    -- ================================
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

    -- ================================
    -- Drop default constraint on User.role if it exists
    -- ================================
    DECLARE @constraint_name NVARCHAR(256);
    DECLARE @sql NVARCHAR(MAX);

    SELECT @constraint_name = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c 
        ON dc.parent_object_id = c.object_id 
       AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('[dbo].[User]')
      AND c.name = 'role';

    IF @constraint_name IS NOT NULL
    BEGIN
        SET @sql = N'ALTER TABLE [dbo].[User] DROP CONSTRAINT ' + QUOTENAME(@constraint_name);
        EXEC sp_executesql @sql;
    END;

    -- ================================
    -- Make User.role nullable
    -- ================================
    ALTER TABLE [dbo].[User]
    ALTER COLUMN [role] NVARCHAR(1000) NULL;

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    THROW;
END CATCH;