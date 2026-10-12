package com.chiangraipass.api.auth;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class VisitorAccountRepository {

    private final JdbcTemplate jdbcTemplate;

    public VisitorAccountRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<VisitorAccount> findByEmail(String email) {
        return jdbcTemplate.query("""
                        SELECT account_id, email, display_name, password_hash
                        FROM app.visitor_account
                        WHERE normalized_email = ? AND account_status = 'ACTIVE'
                        """,
                (result, rowNumber) -> new VisitorAccount(
                        result.getObject("account_id", UUID.class),
                        result.getString("email"),
                        result.getString("display_name"),
                        result.getString("password_hash")),
                normalizeEmail(email)).stream().findFirst();
    }

    public Optional<VisitorAccount> findByExternalIdentity(String provider, String subject) {
        return jdbcTemplate.query("""
                        SELECT account.account_id, account.email, account.display_name, account.password_hash
                        FROM app.visitor_account account
                        INNER JOIN app.visitor_external_identity identity
                            ON identity.account_id = account.account_id
                        WHERE identity.provider = ? AND identity.provider_subject = ?
                          AND account.account_status = 'ACTIVE'
                        """,
                (result, rowNumber) -> new VisitorAccount(
                        result.getObject("account_id", UUID.class),
                        result.getString("email"),
                        result.getString("display_name"),
                        result.getString("password_hash")),
                provider, subject).stream().findFirst();
    }

    public void createEmailAccount(
            UUID accountId,
            String email,
            String displayName,
            String passwordHash,
            String privacyNoticeVersion) {
        jdbcTemplate.update("""
                INSERT INTO app.visitor_account
                    (account_id, email, normalized_email, display_name, password_hash,
                     privacy_notice_version, privacy_notice_acknowledged_at)
                VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME())
                """,
                accountId, email, normalizeEmail(email), displayName, passwordHash, privacyNoticeVersion);
    }

    @Transactional
    public VisitorAccount createOAuthAccount(
            UUID accountId,
            String email,
            String displayName,
            String provider,
            String subject,
            String privacyNoticeVersion) {
        jdbcTemplate.update("""
                INSERT INTO app.visitor_account
                    (account_id, email, normalized_email, display_name, password_hash,
                     privacy_notice_version, privacy_notice_acknowledged_at)
                VALUES (?, ?, ?, ?, NULL, ?, SYSUTCDATETIME())
                """,
                accountId, email, normalizeEmail(email), displayName, privacyNoticeVersion);
        jdbcTemplate.update("""
                INSERT INTO app.visitor_external_identity
                    (provider, provider_subject, account_id)
                VALUES (?, ?, ?)
                """,
                provider, subject, accountId);
        return new VisitorAccount(accountId, email, displayName, null);
    }

    public static String normalizeEmail(String email) {
        return email.strip().toLowerCase(java.util.Locale.ROOT);
    }
}
