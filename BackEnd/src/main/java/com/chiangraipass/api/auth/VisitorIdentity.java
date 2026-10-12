package com.chiangraipass.api.auth;

import java.util.UUID;

public interface VisitorIdentity {

    UUID accountId();

    String email();

    String displayName();
}
