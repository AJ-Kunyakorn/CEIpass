package com.chiangraipass.api.auth;

import java.util.UUID;

public record VisitorAccount(UUID accountId, String email, String displayName, String passwordHash) {
}
