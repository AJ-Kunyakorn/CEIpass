ALTER TABLE app.pass_catalog
    ADD duration_days INT NULL;
GO

ALTER TABLE app.pass_catalog
    ADD CONSTRAINT CK_pass_catalog_duration_days CHECK (duration_days IN (1, 3, 5));