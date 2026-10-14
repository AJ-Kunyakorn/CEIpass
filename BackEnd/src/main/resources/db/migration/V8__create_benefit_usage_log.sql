CREATE TABLE app.benefit_usage_log
(
    usage_id UNIQUEIDENTIFIER NOT NULL,
    user_pass_id UNIQUEIDENTIFIER NOT NULL,
    partner_id NVARCHAR(64) NOT NULL,
    benefit_id NVARCHAR(64) NOT NULL,
    checkin_datetime DATETIME2(3) NOT NULL CONSTRAINT DF_benefit_usage_log_checkin DEFAULT SYSUTCDATETIME(),
    validation_status VARCHAR(20) NOT NULL,
    CONSTRAINT PK_benefit_usage_log PRIMARY KEY (usage_id),
    CONSTRAINT FK_benefit_usage_log_user_pass FOREIGN KEY (user_pass_id)
        REFERENCES app.user_pass (user_pass_id),
    CONSTRAINT FK_benefit_usage_log_partner FOREIGN KEY (partner_id)
        REFERENCES app.attraction_catalog (partner_id),
    CONSTRAINT FK_benefit_usage_log_benefit FOREIGN KEY (benefit_id)
        REFERENCES app.benefit (benefit_id),
    CONSTRAINT CK_benefit_usage_log_status
        CHECK (validation_status IN ('VALID_SUCCESS', 'PASS_EXPIRED', 'QUOTA_EXCEEDED'))
);

CREATE INDEX IX_benefit_usage_log_user_pass
    ON app.benefit_usage_log (user_pass_id, checkin_datetime DESC);