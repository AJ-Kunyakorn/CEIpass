CREATE TABLE app.pass_catalog
(
    pass_id NVARCHAR(64) NOT NULL,
    display_name NVARCHAR(120) NOT NULL,
    description NVARCHAR(500) NOT NULL,
    price_minor_units BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    validity_description NVARCHAR(160) NOT NULL,
    is_available BIT NOT NULL CONSTRAINT DF_pass_catalog_is_available DEFAULT 1,
    is_published BIT NOT NULL CONSTRAINT DF_pass_catalog_is_published DEFAULT 0,
    display_order INT NOT NULL CONSTRAINT DF_pass_catalog_display_order DEFAULT 0,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_pass_catalog_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_pass_catalog_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_pass_catalog PRIMARY KEY (pass_id),
    CONSTRAINT CK_pass_catalog_price_positive CHECK (price_minor_units > 0),
    CONSTRAINT CK_pass_catalog_currency_uppercase CHECK (currency = UPPER(currency))
);

CREATE TABLE app.attraction_catalog
(
    partner_id NVARCHAR(64) NOT NULL,
    public_name NVARCHAR(160) NOT NULL,
    location NVARCHAR(240) NOT NULL,
    category NVARCHAR(100) NOT NULL,
    image_url NVARCHAR(2048) NULL,
    accessibility_information NVARCHAR(1000) NULL,
    is_pass_eligible BIT NOT NULL CONSTRAINT DF_attraction_catalog_is_pass_eligible DEFAULT 0,
    is_published BIT NOT NULL CONSTRAINT DF_attraction_catalog_is_published DEFAULT 0,
    display_order INT NOT NULL CONSTRAINT DF_attraction_catalog_display_order DEFAULT 0,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_attraction_catalog_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_attraction_catalog_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_attraction_catalog PRIMARY KEY (partner_id)
);
