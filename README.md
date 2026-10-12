# Chiang Rai Pass

Chiang Rai Pass is a planned mobile-first web application for tourists. Its key goals are to display dynamic QR codes quickly, remain useful when connectivity is unstable, process payments reliably, and prevent QR redemption fraud.

> **Project status:** Foundation and visitor UI scaffold. Email/password authentication is implemented; Google/Apple OAuth is environment-configured but requires provider credentials. The public catalog API is implemented but not yet connected to the sample UI. Payments, history, and venue redemption are not implemented. The PWA caches its static app shell; dynamic QR display/offline caching waits for the authenticated QR API contract.

## Product and architecture goals

- Display the visitor's current QR code in under one second for the agreed measurement conditions.
- Provide a useful offline experience without implying that an unverified payment or redemption succeeded.
- Integrate payment providers such as PromptPay through trusted server-side flows.
- Process payment webhooks securely, durably, and idempotently.
- Prevent multiple successful redemptions of the same QR code, including simultaneous scans.
- Maintain auditable transactions and partner revenue splits.

## Documentation

- [Architecture blueprint](docs/architecture.md): logical components, critical flows, security and consistency requirements, proposed project layout, and implementation decisions to make.
- [Development workflow](docs/development-workflow.md): branch naming, pull request expectations, and a phased implementation sequence.
- [Visitor app feature](docs/visitor-app-feature.md): five-screen navigation, current preview behavior, offline QR limits, and the backend contracts needed for live data.
- [Authentication setup](docs/authentication.md): email/password sessions, Google/Apple OAuth configuration, privacy-notice gating, and production prerequisites.

## Starter stack

- **Front end:** plain HTML, CSS, and JavaScript in `FrontEnd/`; served as static files during development, with a PWA app-shell cache.
- **Back end:** Java 21 and Spring Boot 3.5 in `BackEnd/`.
- **Database:** Microsoft SQL Server; versioned Flyway migrations live in the backend classpath at `BackEnd/src/main/resources/db/migration/`.

## Run locally

Prerequisites: Java 21, Maven 3.9+, and SQL Server 2022 or a compatible SQL Server instance.

1. Create a development database using [Database/bootstrap.sql](Database/bootstrap.sql). For a local SQL Server install with `sqlcmd`:

   ```powershell
   sqlcmd -S localhost -U sa -P $env:MSSQL_SA_PASSWORD -C -d master -i Database/bootstrap.sql
   ```

   `MSSQL_SA_PASSWORD` is an environment variable you set locally; do not commit its value.

2. From the repository root, configure the backend connection and start the API:

   ```powershell
   $env:DB_URL = "jdbc:sqlserver://localhost:1433;databaseName=CEIPass;encrypt=true;trustServerCertificate=true"
   $env:DB_USERNAME = "sa"
   $env:DB_PASSWORD = $env:MSSQL_SA_PASSWORD
   mvn -f BackEnd/pom.xml spring-boot:run
   ```

   The API applies Flyway migrations on startup. Check it at `http://localhost:8080/api/v1/health`.

3. Serve `FrontEnd/` at `http://localhost:5500` with a static-file development server, such as the VS Code Live Server extension. The visitor UI calls the API at `http://localhost:8080`; configure `FrontEnd/js/config.js` if your local API address differs. The five screens and sample catalog/cart work in the browser. Public catalog and authentication endpoints are implemented. Apply Flyway migrations by starting the backend against SQL Server. New registrations remain disabled until a reviewed privacy notice is published and explicitly configured; provider sign-in additionally requires provider credentials. See [Authentication setup](docs/authentication.md). Payment, history, and authenticated QR issuance still need implementation.

4. Run backend tests with `mvn -f BackEnd/pom.xml test`.

The local SQL Server connection above trusts the local development certificate. Use a properly validated TLS certificate and environment-specific secrets outside development.
