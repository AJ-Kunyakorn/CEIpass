package com.chiangraipass.config;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

public class OAuthPrivacyNoticeFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String noticeVersion = null;
        if (request.getRequestURI().startsWith(request.getContextPath() + "/login/oauth2/code/")) {
            var session = request.getSession(false);
            if (session != null) {
                Object value = session.getAttribute(OAuthPrivacyNoticeContext.SESSION_KEY);
                if (value instanceof String version) noticeVersion = version;
            }
        }

        try (OAuthPrivacyNoticeContext.Scope ignored = OAuthPrivacyNoticeContext.activate(noticeVersion)) {
            filterChain.doFilter(request, response);
        }
    }
}
