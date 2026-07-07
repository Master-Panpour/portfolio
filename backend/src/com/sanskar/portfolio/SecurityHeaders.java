package com.sanskar.portfolio;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.Set;

public final class SecurityHeaders {
    private static final String CSP = "default-src 'self'; "
            + "script-src 'self'; "
            + "style-src 'self'; "
            + "img-src 'self' data:; "
            + "font-src 'self'; "
            + "media-src 'self'; "
            + "manifest-src 'self'; "
            + "connect-src 'self' http://localhost:8080 http://127.0.0.1:8080; "
            + "frame-src 'none'; "
            + "object-src 'none'; "
            + "base-uri 'none'; "
            + "frame-ancestors 'none'; "
            + "form-action 'none'; "
            + "script-src-attr 'none'; "
            + "worker-src 'none'; "
            + "report-uri /api/csp-report";

    private SecurityHeaders() {
    }

    public static void apply(HttpExchange exchange, Set<String> allowedOrigins) {
        Headers headers = exchange.getResponseHeaders();
        headers.set("Content-Security-Policy", CSP);
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("X-Frame-Options", "DENY");
        headers.set("X-DNS-Prefetch-Control", "off");
        headers.set("X-Permitted-Cross-Domain-Policies", "none");
        headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
        headers.set("Cross-Origin-Resource-Policy", "same-site");
        headers.set("Cross-Origin-Opener-Policy", "same-origin");
        headers.set("Origin-Agent-Cluster", "?1");

        String requestOrigin = exchange.getRequestHeaders().getFirst("Origin");
        if (requestOrigin != null && allowedOrigins.contains(requestOrigin)) {
            headers.set("Access-Control-Allow-Origin", requestOrigin);
            headers.set("Vary", "Origin");
            headers.set("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
            headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            headers.set("Access-Control-Max-Age", "600");
        }
    }

    public static void handlePreflight(HttpExchange exchange) throws IOException {
        exchange.sendResponseHeaders(204, -1);
        exchange.close();
    }
}
