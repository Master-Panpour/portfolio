package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

public final class NyxoraPageHandler implements HttpHandler {
    private final Path staticRoot;
    private final String pageFile;
    private final boolean requireSession;
    private final AdminSessionStore sessionStore;
    private final Set<String> allowedOrigins;

    public NyxoraPageHandler(Path staticRoot, String pageFile, boolean requireSession,
                             AdminSessionStore sessionStore, Set<String> allowedOrigins) {
        this.staticRoot = staticRoot;
        this.pageFile = pageFile;
        this.requireSession = requireSession;
        this.sessionStore = sessionStore;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        SecurityHeaders.apply(exchange, allowedOrigins);

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod()) && !"HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
            ProfileApiHandler.sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
            return;
        }

        if (!sessionStore.isConfigured()) {
            ProfileApiHandler.sendJson(exchange, 503, "{\"error\":\"admin_token_required\"}");
            return;
        }

        if (requireSession && !sessionStore.isSessionAuthorized(exchange) && !sessionStore.isBearerAuthorized(exchange)) {
            redirect(exchange, "/not-allowed");
            return;
        }

        Path requested = staticRoot.resolve(pageFile).normalize();
        if (!requested.startsWith(staticRoot) || !Files.isRegularFile(requested)) {
            ProfileApiHandler.sendJson(exchange, 404, "{\"error\":\"frontend_not_built\"}");
            return;
        }

        byte[] body = Files.readAllBytes(requested);
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(200, "HEAD".equalsIgnoreCase(exchange.getRequestMethod()) ? -1 : body.length);
        if (!"HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.getResponseBody().write(body);
        }
        exchange.close();
    }

    private static void redirect(HttpExchange exchange, String target) throws IOException {
        exchange.getResponseHeaders().set("Location", target);
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(303, -1);
        exchange.close();
    }
}
