package com.chiangraipass.api.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class VisitorUserDetailsService implements UserDetailsService {

    private final VisitorAccountRepository accountRepository;

    public VisitorUserDetailsService(VisitorAccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        VisitorAccount account = accountRepository.findByEmail(email)
                .filter(found -> found.passwordHash() != null)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password."));
        return new EmailVisitorPrincipal(account);
    }
}
