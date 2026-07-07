package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class AdminRateLimiter {
    private static final int MAX_FAILURES = 5;
    private static final long WINDOW_MILLIS = 10L * 60L * 1000L;

    private final Map<String, LoginWindow> windows = new ConcurrentHashMap<String, LoginWindow>();

    public boolean isBlocked(HttpExchange exchange) {
        String key = key(exchange);
        LoginWindow window = windows.get(key);
        if (window == null || window.expiresAt < System.currentTimeMillis()) {
            windows.remove(key);
            return false;
        }
        return window.failures >= MAX_FAILURES;
    }

    public void recordFailure(HttpExchange exchange) {
        String key = key(exchange);
        long now = System.currentTimeMillis();
        windows.compute(key, (ignored, current) -> {
            if (current == null || current.expiresAt < now) {
                return new LoginWindow(1, now + WINDOW_MILLIS);
            }
            return new LoginWindow(current.failures + 1, current.expiresAt);
        });
    }

    public void reset(HttpExchange exchange) {
        windows.remove(key(exchange));
    }

    private static String key(HttpExchange exchange) {
        if (exchange.getRemoteAddress() == null || exchange.getRemoteAddress().getAddress() == null) {
            return "unknown";
        }
        return exchange.getRemoteAddress().getAddress().getHostAddress();
    }

    private static final class LoginWindow {
        private final int failures;
        private final long expiresAt;

        private LoginWindow(int failures, long expiresAt) {
            this.failures = failures;
            this.expiresAt = expiresAt;
        }
    }
}
