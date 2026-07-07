package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

public final class CspReportHandler implements HttpHandler {
    private static final long MAX_REPORT_BYTES = 16L * 1024L;
    private final Set<String> allowedOrigins;

    public CspReportHandler(Set<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        SecurityHeaders.apply(exchange, allowedOrigins);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            SecurityHeaders.handlePreflight(exchange);
            return;
        }

        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            ProfileApiHandler.sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
            return;
        }

        drainLimited(exchange);
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(204, -1);
        exchange.close();
    }

    private static void drainLimited(HttpExchange exchange) throws IOException {
        try (InputStream input = exchange.getRequestBody()) {
            byte[] buffer = new byte[2048];
            long total = 0;
            int read;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > MAX_REPORT_BYTES) {
                    break;
                }
            }
        }
    }
}
