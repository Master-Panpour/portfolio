package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class AdminSessionStore {
    private static final String COOKIE_NAME = "NYXORA_SESSION";
    private static final String CSRF_COOKIE_NAME = "NYXORA_CSRF";
    private static final long SESSION_TTL_MILLIS = 30L * 60L * 1000L;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final String adminToken;
    private final Map<String, Long> sessions = new ConcurrentHashMap<String, Long>();
    private final Map<String, String> csrfTokens = new ConcurrentHashMap<String, String>();

    public AdminSessionStore(String adminToken) {
        this.adminToken = adminToken;
    }

    public boolean isConfigured() {
        return adminToken != null && adminToken.trim().length() >= 24;
    }

    public boolean isAuthorized(HttpExchange exchange) {
        return isBearerAuthorized(exchange) || isSessionAuthorized(exchange);
    }

    public boolean isBearerAuthorized(HttpExchange exchange) {
        if (!isConfigured()) {
            return false;
        }
        String authorization = exchange.getRequestHeaders().getFirst("Authorization");
        return authorization != null && constantTimeEquals("Bearer " + adminToken.trim(), authorization.trim());
    }

    public boolean isSessionAuthorized(HttpExchange exchange) {
        String sessionId = readCookie(exchange, COOKIE_NAME);
        if (sessionId == null) {
            return false;
        }
        Long expiresAt = sessions.get(sessionId);
        if (expiresAt == null) {
            return false;
        }
        if (expiresAt < System.currentTimeMillis()) {
            sessions.remove(sessionId);
            csrfTokens.remove(sessionId);
            return false;
        }
        sessions.put(sessionId, System.currentTimeMillis() + SESSION_TTL_MILLIS);
        return true;
    }

    public boolean isCsrfAuthorized(HttpExchange exchange) {
        String sessionId = readCookie(exchange, COOKIE_NAME);
        String expectedToken = sessionId == null ? null : csrfTokens.get(sessionId);
        String actualToken = exchange.getRequestHeaders().getFirst("X-CSRF-Token");
        return expectedToken != null && actualToken != null && constantTimeEquals(expectedToken, actualToken.trim());
    }

    public boolean tokenMatches(String candidate) {
        return isConfigured() && candidate != null && constantTimeEquals(adminToken.trim(), candidate.trim());
    }

    public String createSession() {
        pruneExpiredSessions();
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String sessionId = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(sessionId, System.currentTimeMillis() + SESSION_TTL_MILLIS);
        return sessionId;
    }

    public String createCsrfToken(String sessionId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String csrfToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        csrfTokens.put(sessionId, csrfToken);
        return csrfToken;
    }

    public void expireSession(HttpExchange exchange) {
        String sessionId = readCookie(exchange, COOKIE_NAME);
        if (sessionId != null) {
            sessions.remove(sessionId);
            csrfTokens.remove(sessionId);
        }
    }

    public String createCookie(String sessionId) {
        return COOKIE_NAME + "=" + sessionId + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + (SESSION_TTL_MILLIS / 1000L);
    }

    public String clearCookie() {
        return COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
    }

    public String createCsrfCookie(String csrfToken) {
        return CSRF_COOKIE_NAME + "=" + csrfToken + "; Path=/; SameSite=Strict; Max-Age=" + (SESSION_TTL_MILLIS / 1000L);
    }

    public String clearCsrfCookie() {
        return CSRF_COOKIE_NAME + "=; Path=/; SameSite=Strict; Max-Age=0";
    }

    private void pruneExpiredSessions() {
        long now = Instant.now().toEpochMilli();
        Iterator<Map.Entry<String, Long>> iterator = sessions.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Long> entry = iterator.next();
            if (entry.getValue() < now) {
                String sessionId = entry.getKey();
                iterator.remove();
                csrfTokens.remove(sessionId);
            }
        }
    }

    private static String readCookie(HttpExchange exchange, String cookieName) {
        String cookieHeader = exchange.getRequestHeaders().getFirst("Cookie");
        if (cookieHeader == null || cookieHeader.trim().isEmpty()) {
            return null;
        }

        String[] cookies = cookieHeader.split(";");
        for (String cookie : cookies) {
            String[] parts = cookie.trim().split("=", 2);
            if (parts.length == 2 && cookieName.equals(parts[0].trim())) {
                return parts[1].trim();
            }
        }
        return null;
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        int diff = expected.length() ^ actual.length();
        int max = Math.max(expected.length(), actual.length());
        for (int index = 0; index < max; index += 1) {
            char expectedChar = index < expected.length() ? expected.charAt(index) : 0;
            char actualChar = index < actual.length() ? actual.charAt(index) : 0;
            diff |= expectedChar ^ actualChar;
        }
        return diff == 0;
    }
}
