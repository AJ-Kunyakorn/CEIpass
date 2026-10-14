CREATE TABLE app.payment
(
    payment_id UNIQUEIDENTIFIER NOT NULL,
    account_id UNIQUEIDENTIFIER NOT NULL,
    pass_id NVARCHAR(64) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(16) NOT NULL CONSTRAINT DF_payment_status DEFAULT 'PENDING',
    payment_datetime DATETIME2(3) NOT NULL CONSTRAINT DF_payment_datetime DEFAULT SYSUTCDATETIME(),
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_payment_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_payment_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_payment PRIMARY KEY (payment_id),
    CONSTRAINT FK_payment_account FOREIGN KEY (account_id)
        REFERENCES app.visitor_account (account_id),
    CONSTRAINT FK_payment_pass FOREIGN KEY (pass_id)
        REFERENCES app.pass_catalog (pass_id),
    CONSTRAINT CK_payment_method CHECK (payment_method IN ('CREDIT_CARD', 'PROMPTPAY')),
    CONSTRAINT CK_payment_status CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED'))
);

CREATE INDEX IX_payment_account_id ON app.payment (account_id);