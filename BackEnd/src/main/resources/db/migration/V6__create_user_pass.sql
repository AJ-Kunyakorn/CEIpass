CREATE TABLE app.user_pass
(
    user_pass_id UNIQUEIDENTIFIER NOT NULL,
    account_id UNIQUEIDENTIFIER NOT NULL,
    pass_id NVARCHAR(64) NOT NULL,
    payment_id UNIQUEIDENTIFIER NOT NULL,
    purchase_datetime DATETIME2(3) NOT NULL CONSTRAINT DF_user_pass_purchase_datetime DEFAULT SYSUTCDATETIME(),
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(16) NOT NULL CONSTRAINT DF_user_pass_status DEFAULT 'UNACTIVATED',
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_user_pass_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_user_pass_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_user_pass PRIMARY KEY (user_pass_id),
    CONSTRAINT UQ_user_pass_payment UNIQUE (payment_id),
    CONSTRAINT FK_user_pass_account FOREIGN KEY (account_id)
        REFERENCES app.visitor_account (account_id),
    CONSTRAINT FK_user_pass_pass FOREIGN KEY (pass_id)
        REFERENCES app.pass_catalog (pass_id),
    CONSTRAINT FK_user_pass_payment FOREIGN KEY (payment_id)
        REFERENCES app.payment (payment_id),
    CONSTRAINT CK_user_pass_status CHECK (status IN ('UNACTIVATED', 'ACTIVE', 'EXPIRED')),
    CONSTRAINT CK_user_pass_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IX_user_pass_account_id ON app.user_pass (account_id);