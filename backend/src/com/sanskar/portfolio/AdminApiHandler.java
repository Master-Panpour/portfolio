package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Set;

public final class AdminApiHandler implements HttpHandler {
    private static final long MAX_PROFILE_BYTES = 128L * 1024L;
    private static final int MAX_LOG_LINES = 200;

    private final Path profilePath;
    private final Path accessLogPath;
    private final Set<String> allowedOrigins;
    private final AdminSessionStore sessionStore;
    private final AdminRateLimiter rateLimiter = new AdminRateLimiter();

    public AdminApiHandler(Path profilePath, Path accessLogPath, Set<String> allowedOrigins, AdminSessionStore sessionStore) {
        this.profilePath = profilePath;
        this.accessLogPath = accessLogPath;
        this.allowedOrigins = allowedOrigins;
        this.sessionStore = sessionStore;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        SecurityHeaders.apply(exchange, allowedOrigins);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            SecurityHeaders.handlePreflight(exchange);
            return;
        }

        String method = exchange.getRequestMethod();
        String path = normalizePath(exchange.getRequestURI().getPath());

        if (!sessionStore.isConfigured()) {
            ProfileApiHandler.sendJson(exchange, 503, "{\"error\":\"admin_token_required\"}");
            return;
        }

        if ("/api/admin/login".equals(path) && "POST".equalsIgnoreCase(method)) {
            login(exchange);
            return;
        }

        if ("/api/admin/logout".equals(path) && "POST".equalsIgnoreCase(method)) {
            if (!sessionStore.isCsrfAuthorized(exchange)) {
                ProfileApiHandler.sendJson(exchange, 403, "{\"error\":\"csrf_required\"}");
                return;
            }
            logout(exchange);
            return;
        }

        if (!sessionStore.isAuthorized(exchange)) {
            exchange.getResponseHeaders().set("WWW-Authenticate", "Bearer realm=\"Nyxora\"");
            ProfileApiHandler.sendJson(exchange, 401, "{\"error\":\"unauthorized\"}");
            return;
        }

        if ("/api/admin/profile".equals(path) && "GET".equalsIgnoreCase(method)) {
            sendProfile(exchange);
            return;
        }

        if ("/api/admin/profile".equals(path) && "PUT".equalsIgnoreCase(method)) {
            if (!sessionStore.isCsrfAuthorized(exchange)) {
                ProfileApiHandler.sendJson(exchange, 403, "{\"error\":\"csrf_required\"}");
                return;
            }
            updateProfile(exchange);
            return;
        }

        if ("/api/admin/logs".equals(path) && "GET".equalsIgnoreCase(method)) {
            ProfileApiHandler.sendJson(exchange, 200, readAccessLogs());
            return;
        }

        ProfileApiHandler.sendJson(exchange, 404, "{\"error\":\"not_found\"}");
    }

    private void login(HttpExchange exchange) throws IOException {
        if (rateLimiter.isBlocked(exchange)) {
            ProfileApiHandler.sendJson(exchange, 429, "{\"error\":\"too_many_attempts\"}");
            return;
        }

        byte[] body = readLimitedBody(exchange, 512L);
        if (body == null) {
            return;
        }

        String token = new String(body, ProfileApiHandler.UTF_8).trim();
        if (!sessionStore.tokenMatches(token)) {
            rateLimiter.recordFailure(exchange);
            ProfileApiHandler.sendJson(exchange, 401, "{\"error\":\"unauthorized\"}");
            return;
        }

        rateLimiter.reset(exchange);
        String sessionId = sessionStore.createSession();
        String csrfToken = sessionStore.createCsrfToken(sessionId);
        exchange.getResponseHeaders().add("Set-Cookie", sessionStore.createCookie(sessionId));
        exchange.getResponseHeaders().add("Set-Cookie", sessionStore.createCsrfCookie(csrfToken));
        ProfileApiHandler.sendJson(exchange, 200, "{\"status\":\"authenticated\"}");
    }

    private void logout(HttpExchange exchange) throws IOException {
        sessionStore.expireSession(exchange);
        exchange.getResponseHeaders().add("Set-Cookie", sessionStore.clearCookie());
        exchange.getResponseHeaders().add("Set-Cookie", sessionStore.clearCsrfCookie());
        ProfileApiHandler.sendJson(exchange, 200, "{\"status\":\"logged_out\"}");
    }

    private void sendProfile(HttpExchange exchange) throws IOException {
        if (!Files.isRegularFile(profilePath)) {
            ProfileApiHandler.sendJson(exchange, 404, "{\"error\":\"profile_not_found\"}");
            return;
        }

        long size = Files.size(profilePath);
        if (size <= 0 || size > MAX_PROFILE_BYTES) {
            ProfileApiHandler.sendJson(exchange, 500, "{\"error\":\"profile_size_invalid\"}");
            return;
        }

        byte[] body = Files.readAllBytes(profilePath);
        if (!looksLikeJsonObject(body)) {
            ProfileApiHandler.sendJson(exchange, 500, "{\"error\":\"profile_format_invalid\"}");
            return;
        }

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(200, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }

    private void updateProfile(HttpExchange exchange) throws IOException {
        byte[] body = readLimitedBody(exchange, MAX_PROFILE_BYTES);
        if (body == null) {
            return;
        }

        if (!looksLikeJsonObject(body)) {
            ProfileApiHandler.sendJson(exchange, 400, "{\"error\":\"profile_format_invalid\"}");
            return;
        }

        Path parent = profilePath.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }

        if (Files.isRegularFile(profilePath)) {
            Files.copy(profilePath, profilePath.resolveSibling(profilePath.getFileName().toString() + ".bak"),
                    StandardCopyOption.REPLACE_EXISTING);
        }

        Path tempPath = profilePath.resolveSibling(profilePath.getFileName().toString() + ".tmp");
        Files.write(tempPath, body, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        try {
            Files.move(tempPath, profilePath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException ex) {
            Files.move(tempPath, profilePath, StandardCopyOption.REPLACE_EXISTING);
        }

        ProfileApiHandler.sendJson(exchange, 200, "{\"status\":\"saved\"}");
    }

    private byte[] readLimitedBody(HttpExchange exchange, long maxBytes) throws IOException {
        try (InputStream input = exchange.getRequestBody();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            long total = 0;
            int read;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > maxBytes) {
                    ProfileApiHandler.sendJson(exchange, 413, "{\"error\":\"payload_too_large\"}");
                    return null;
                }
                output.write(buffer, 0, read);
            }
            return output.toByteArray();
        }
    }

    private String readAccessLogs() throws IOException {
        if (!Files.isRegularFile(accessLogPath)) {
            return "[]";
        }

        Deque<String> tail = new ArrayDeque<String>();
        try (BufferedReader reader = Files.newBufferedReader(accessLogPath, ProfileApiHandler.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
                    continue;
                }
                tail.addLast(trimmed);
                if (tail.size() > MAX_LOG_LINES) {
                    tail.removeFirst();
                }
            }
        }

        StringBuilder builder = new StringBuilder("[");
        boolean first = true;
        for (String line : tail) {
            if (!first) {
                builder.append(',');
            }
            builder.append(line);
            first = false;
        }
        builder.append(']');
        return builder.toString();
    }

    private static boolean looksLikeJsonObject(byte[] body) {
        String content = new String(body, ProfileApiHandler.UTF_8).trim();
        return content.startsWith("{") && content.endsWith("}");
    }

    private static String normalizePath(String path) {
        if (path == null || path.isEmpty()) {
            return "/api/admin";
        }
        return path.endsWith("/") && path.length() > 1 ? path.substring(0, path.length() - 1) : path;
    }
}
