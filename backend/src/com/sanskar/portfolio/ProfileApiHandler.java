package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

public final class ProfileApiHandler implements HttpHandler {
    static final Charset UTF_8 = StandardCharsets.UTF_8;
    private static final long MAX_PROFILE_BYTES = 128L * 1024L;

    private final Path profilePath;
    private final Set<String> allowedOrigins;

    public ProfileApiHandler(Path profilePath, Set<String> allowedOrigins) {
        this.profilePath = profilePath;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        SecurityHeaders.apply(exchange, allowedOrigins);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            SecurityHeaders.handlePreflight(exchange);
            return;
        }

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
            return;
        }

        if (!Files.isRegularFile(profilePath)) {
            sendJson(exchange, 404, "{\"error\":\"profile_not_found\"}");
            return;
        }

        long size = Files.size(profilePath);
        if (size <= 0 || size > MAX_PROFILE_BYTES) {
            sendJson(exchange, 500, "{\"error\":\"profile_size_invalid\"}");
            return;
        }

        byte[] body = Files.readAllBytes(profilePath);
        if (!looksLikeJsonObject(body)) {
            sendJson(exchange, 500, "{\"error\":\"profile_format_invalid\"}");
            return;
        }

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(200, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }

    static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] body = json.getBytes(UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(statusCode, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }

    private static boolean looksLikeJsonObject(byte[] body) {
        String content = new String(body, UTF_8).trim();
        return content.startsWith("{") && content.endsWith("}");
    }
}
