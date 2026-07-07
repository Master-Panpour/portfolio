package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public final class StaticFileHandler implements HttpHandler {
    private static final Map<String, String> CONTENT_TYPES = new HashMap<String, String>();

    static {
        CONTENT_TYPES.put(".html", "text/html; charset=utf-8");
        CONTENT_TYPES.put(".css", "text/css; charset=utf-8");
        CONTENT_TYPES.put(".js", "application/javascript; charset=utf-8");
        CONTENT_TYPES.put(".json", "application/json; charset=utf-8");
        CONTENT_TYPES.put(".svg", "image/svg+xml");
        CONTENT_TYPES.put(".png", "image/png");
        CONTENT_TYPES.put(".jpg", "image/jpeg");
        CONTENT_TYPES.put(".jpeg", "image/jpeg");
        CONTENT_TYPES.put(".webp", "image/webp");
        CONTENT_TYPES.put(".ico", "image/x-icon");
    }

    private final Path staticRoot;
    private final Set<String> allowedOrigins;
    private final AdminSessionStore adminSessionStore;

    public StaticFileHandler(Path staticRoot, Set<String> allowedOrigins) {
        this(staticRoot, allowedOrigins, null);
    }

    public StaticFileHandler(Path staticRoot, Set<String> allowedOrigins, AdminSessionStore adminSessionStore) {
        this.staticRoot = staticRoot;
        this.allowedOrigins = allowedOrigins;
        this.adminSessionStore = adminSessionStore;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        SecurityHeaders.apply(exchange, allowedOrigins);

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod()) && !"HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
            ProfileApiHandler.sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
            return;
        }

        if (!Files.isDirectory(staticRoot)) {
            ProfileApiHandler.sendJson(exchange, 404, "{\"error\":\"frontend_not_built\"}");
            return;
        }

        Path requested = resolveRequestedPath(exchange);
        if (!requested.startsWith(staticRoot)) {
            ProfileApiHandler.sendJson(exchange, 403, "{\"error\":\"forbidden\"}");
            return;
        }

        String requestedFile = requested.getFileName() == null ? "" : requested.getFileName().toString();
        if ("nyxora.html".equalsIgnoreCase(requestedFile) || "nyxora-login.html".equalsIgnoreCase(requestedFile)) {
            ProfileApiHandler.sendJson(exchange, 404, "{\"error\":\"not_found\"}");
            return;
        }

        if (isProtectedNyxoraAsset(requestedFile) && (adminSessionStore == null || !adminSessionStore.isAuthorized(exchange))) {
            ProfileApiHandler.sendJson(exchange, 404, "{\"error\":\"not_found\"}");
            return;
        }

        if (!Files.isRegularFile(requested)) {
            requested = staticRoot.resolve("index.html").normalize();
        }

        if (!requested.startsWith(staticRoot) || !Files.isRegularFile(requested)) {
            ProfileApiHandler.sendJson(exchange, 404, "{\"error\":\"not_found\"}");
            return;
        }

        byte[] body = Files.readAllBytes(requested);
        exchange.getResponseHeaders().set("Content-Type", contentType(requested));
        exchange.getResponseHeaders().set("Cache-Control", requested.getFileName().toString().equals("index.html")
                ? "no-cache"
                : "public, max-age=31536000, immutable");
        exchange.sendResponseHeaders(200, "HEAD".equalsIgnoreCase(exchange.getRequestMethod()) ? -1 : body.length);
        if (!"HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.getResponseBody().write(body);
        }
        exchange.close();
    }

    private Path resolveRequestedPath(HttpExchange exchange) {
        String rawPath = exchange.getRequestURI().getPath();
        String cleanPath = rawPath == null || rawPath.equals("/") ? "/index.html" : rawPath;
        while (cleanPath.startsWith("/")) {
            cleanPath = cleanPath.substring(1);
        }
        return staticRoot.resolve(cleanPath).normalize();
    }

    private static String contentType(Path path) {
        String fileName = path.getFileName().toString().toLowerCase();
        for (Map.Entry<String, String> entry : CONTENT_TYPES.entrySet()) {
            if (fileName.endsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "application/octet-stream";
    }

    private static boolean isProtectedNyxoraAsset(String fileName) {
        String lowerName = fileName.toLowerCase();
        return lowerName.startsWith("nyxora-") && lowerName.endsWith(".js");
    }
}
