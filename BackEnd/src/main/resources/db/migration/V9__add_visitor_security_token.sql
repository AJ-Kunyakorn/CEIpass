ALTER TABLE app.visitor_account
    ADD security_token NVARCHAR(64) NULL;
GO

UPDATE app.visitor_account
SET security_token = LOWER(CONVERT(NVARCHAR(64), CRYPT_GEN_RANDOM(32), 2))
WHERE security_token IS NULL;
GO

ALTER TABLE app.visitor_account
    ALTER COLUMN security_token NVARCHAR(64) NOT NULL;
GO

ALTER TABLE app.visitor_account
    ADD CONSTRAINT UQ_visitor_account_security_token UNIQUE (security_token);