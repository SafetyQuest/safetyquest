BEGIN TRY
    BEGIN TRAN;

    -- AlterTable: Add password tracking fields to User table
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[User]') AND name = 'mustChangePassword')
    BEGIN
        ALTER TABLE [dbo].[User] 
        ADD [mustChangePassword] BIT NOT NULL CONSTRAINT [User_mustChangePassword_df] DEFAULT 1;
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[User]') AND name = 'lastPasswordChange')
    BEGIN
        ALTER TABLE [dbo].[User] 
        ADD [lastPasswordChange] DATETIME2;
    END

    COMMIT TRAN;

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    THROW;

END CATCH