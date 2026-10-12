CREATE TABLE app.visitor_account
(
    account_id UNIQUEIDENTIFIER NOT NULL,
    email NVARCHAR(254) NOT NULL,
    normalized_email NVARCHAR(254) NOT NULL,
    display_name NVARCHAR(120) NOT NULL,
    password_hash NVARCHAR(100) NULL,
    privacy_notice_version NVARCHAR(80) NOT NULL,
    privacy_notice_acknowledged_at DATETIME2(3) NOT NULL,
    account_status VARCHAR(16) NOT NULL CONSTRAINT DF_visitor_account_status DEFAULT 'ACTIVE',
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_visitor_account_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_visitor_account_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_visitor_account PRIMARY KEY (account_id),
    CONSTRAINT UQ_visitor_account_normalized_email UNIQUE (normalized_email),
    CONSTRAINT CK_visitor_account_status CHECK (account_status IN ('ACTIVE', 'LOCKED', 'CLOSED'))
);

CREATE TABLE app.visitor_external_identity
(
    provider VARCHAR(32) NOT NULL,
    provider_subject NVARCHAR(255) NOT NULL,
    account_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_visitor_external_identity_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_visitor_external_identity PRIMARY KEY (provider, provider_subject),
    CONSTRAINT UQ_visitor_external_identity_account_provider UNIQUE (account_id, provider),
    CONSTRAINT FK_visitor_external_identity_account FOREIGN KEY (account_id)
        REFERENCES app.visitor_account (account_id)
);
