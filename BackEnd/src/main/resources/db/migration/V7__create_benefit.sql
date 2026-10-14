CREATE TABLE app.benefit
(
    benefit_id NVARCHAR(64) NOT NULL,
    partner_id NVARCHAR(64) NOT NULL,
    pass_id NVARCHAR(64) NOT NULL,
    benefit_detail NVARCHAR(255) NOT NULL,
    discount_rate DECIMAL(5,2) NOT NULL CONSTRAINT DF_benefit_discount_rate DEFAULT 0.00,
    usage_rule_limit INT NOT NULL CONSTRAINT DF_benefit_usage_rule_limit DEFAULT 1,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_benefit_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_benefit_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_benefit PRIMARY KEY (benefit_id),
    CONSTRAINT FK_benefit_partner FOREIGN KEY (partner_id)
        REFERENCES app.attraction_catalog (partner_id),
    CONSTRAINT FK_benefit_pass FOREIGN KEY (pass_id)
        REFERENCES app.pass_catalog (pass_id),
    CONSTRAINT CK_benefit_discount_rate CHECK (discount_rate BETWEEN 0 AND 100),
    CONSTRAINT CK_benefit_usage_rule_limit CHECK (usage_rule_limit >= 1)
);