-- Attendance system database schema
-- Run this to ensure tables exist

-- Create Users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        ID int IDENTITY(1,1) PRIMARY KEY,
        Initials nvarchar(10) NOT NULL UNIQUE,
        FirstName nvarchar(50) NOT NULL,
        LastName nvarchar(50),
        Email nvarchar(255),
        IsActive bit DEFAULT 1,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE()
    );
END

-- Create Attendance table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Attendance' AND xtype='U')
BEGIN
    CREATE TABLE Attendance (
        ID int IDENTITY(1,1) PRIMARY KEY,
        UserInitials nvarchar(10) NOT NULL,
        Date date NOT NULL,
        Status nvarchar(20) NOT NULL DEFAULT 'office', -- 'home', 'office', 'away'
        ConfirmedAt datetime2 NULL,
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE(),
        FOREIGN KEY (UserInitials) REFERENCES Users(Initials),
        UNIQUE(UserInitials, Date)
    );
END

-- Create AnnualLeave table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AnnualLeave' AND xtype='U')
BEGIN
    CREATE TABLE AnnualLeave (
        ID int IDENTITY(1,1) PRIMARY KEY,
        UserInitials nvarchar(10) NOT NULL,
        StartDate date NOT NULL,
        EndDate date NOT NULL,
        LeaveType nvarchar(50) DEFAULT 'Annual Leave',
        ApprovedBy nvarchar(10),
        CreatedAt datetime2 DEFAULT GETDATE(),
        UpdatedAt datetime2 DEFAULT GETDATE(),
        FOREIGN KEY (UserInitials) REFERENCES Users(Initials)
    );
END

-- Insert sample users if Users table is empty
IF NOT EXISTS (SELECT 1 FROM Users)
BEGIN
    INSERT INTO Users (Initials, FirstName, LastName, Email) VALUES
    ('LZ', 'Lukasz', 'Zemanek', 'lukasz@helix.law'),
    ('AX', 'Alex', 'Smith', 'alex@helix.law'),
    ('AN', 'Anouszka', 'Brown', 'anouszka@helix.law'),
    ('BG', 'Bianca', 'Green', 'bianca@helix.law'),
    ('BL', 'Billy', 'Wilson', 'billy@helix.law'),
    ('BR', 'Brendan', 'Davis', 'brendan@helix.law'),
    ('CH', 'Christopher', 'Miller', 'christopher@helix.law'),
    ('ED', 'Edwin', 'Taylor', 'edwin@helix.law'),
    ('IM', 'Imogen', 'Anderson', 'imogen@helix.law'),
    ('IN', 'Indie', 'Thomas', 'indie@helix.law'),
    ('JO', 'Jonathan', 'Jackson', 'jonathan@helix.law'),
    ('JS', 'Joshua', 'White', 'joshua@helix.law'),
    ('KA', 'Kanchel', 'Harris', 'kanchel@helix.law'),
    ('LA', 'Laura', 'Martin', 'laura@helix.law'),
    ('PA', 'Paris', 'Thompson', 'paris@helix.law'),
    ('RI', 'Richard', 'Garcia', 'richard@helix.law'),
    ('RY', 'Ryan', 'Martinez', 'ryan@helix.law'),
    ('SA', 'Sam', 'Robinson', 'sam@helix.law'),
    ('TR', 'Tristan', 'Clark', 'tristan@helix.law'),
    ('ZA', 'Zoe-Ann', 'Rodriguez', 'zoe-ann@helix.law');
END

PRINT 'Attendance database schema created/verified successfully';