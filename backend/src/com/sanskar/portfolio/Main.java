package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

public final class Main {
    private static final int DEFAULT_PORT = 8080;
    private static final CountDownLatch SHUTDOWN_LATCH = new CountDownLatch(1);

    private Main() {
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        int port = getPort();
        Set<String> allowedOrigins = getAllowedOrigins();
        Path profilePath = Paths.get(getEnv("PORTFOLIO_DATA_PATH", "data/profile.json")).toAbsolutePath().normalize();
        Path thmTrackerPath = Paths.get(getEnv("PORTFOLIO_THM_CACHE_PATH", "data/thm-rooms.json")).toAbsolutePath().normalize();
        Path accessLogPath = Paths.get(getEnv("PORTFOLIO_ACCESS_LOG_PATH", "data/access-log.jsonl")).toAbsolutePath().normalize();
        Path staticRoot = Paths.get("frontend/dist").toAbsolutePath().normalize();
        String adminToken = Environment.get("PORTFOLIO_ADMIN_TOKEN");
        AccessLogger accessLogger = new AccessLogger(accessLogPath);
        AdminSessionStore adminSessionStore = new AdminSessionStore(adminToken);

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/api/profile", new LoggedHandler(new ProfileApiHandler(profilePath, allowedOrigins), accessLogger));
        server.createContext("/api/thm", new LoggedHandler(new TryHackMeApiHandler(thmTrackerPath, allowedOrigins), accessLogger));
        server.createContext("/api/admin", new LoggedHandler(new AdminApiHandler(profilePath, accessLogPath, allowedOrigins, adminSessionStore), accessLogger));
        server.createContext("/api/csp-report", new LoggedHandler(new CspReportHandler(allowedOrigins), accessLogger));
        server.createContext("/nyxora", new LoggedHandler(new NyxoraPageHandler(staticRoot, "nyxora.html", true, adminSessionStore, allowedOrigins), accessLogger));
        server.createContext("/nyxora.html", new LoggedHandler(new NyxoraPageHandler(staticRoot, "nyxora.html", true, adminSessionStore, allowedOrigins), accessLogger));
        server.createContext("/not-allowed", new LoggedHandler(new NyxoraPageHandler(staticRoot, "not-allowed.html", false, adminSessionStore, allowedOrigins), accessLogger));
        server.createContext("/not-allowed.html", new LoggedHandler(new NyxoraPageHandler(staticRoot, "not-allowed.html", false, adminSessionStore, allowedOrigins), accessLogger));
        server.createContext("/api/health", new LoggedHandler(exchange -> {
            SecurityHeaders.apply(exchange, allowedOrigins);
            byte[] body = "{\"status\":\"ok\"}".getBytes(ProfileApiHandler.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        }, accessLogger));
        server.createContext("/", new LoggedHandler(new StaticFileHandler(staticRoot, allowedOrigins, adminSessionStore), accessLogger));
        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();

        System.out.println("Portfolio backend listening on http://localhost:" + port);
        System.out.println("Serving profile data from " + profilePath);
        System.out.println("Serving TryHackMe tracker cache from " + thmTrackerPath);
        System.out.println("Writing access logs to " + accessLogPath);
        System.out.println(adminSessionStore.isConfigured()
                ? "Nyxora admin portal enabled at /not-allowed."
                : "Nyxora disabled until PORTFOLIO_ADMIN_TOKEN is set to 24+ characters.");
        SHUTDOWN_LATCH.await();
    }

    private static int getPort() {
        String value = getEnv("PORT", "");
        if (value == null || value.trim().isEmpty()) {
            return DEFAULT_PORT;
        }

        try {
            int port = Integer.parseInt(value);
            if (port < 1024 || port > 65535) {
                throw new IllegalArgumentException("PORT must be between 1024 and 65535");
            }
            return port;
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("PORT must be numeric", ex);
        }
    }

    private static Set<String> getAllowedOrigins() {
        String raw = getEnv("PORTFOLIO_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173");
        if (raw.trim().isEmpty()) {
            return Collections.emptySet();
        }

        Set<String> origins = new LinkedHashSet<String>();
        Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(origin -> origin.startsWith("http://") || origin.startsWith("https://"))
                .forEach(origins::add);
        return Collections.unmodifiableSet(origins);
    }

    private static String getEnv(String key, String fallback) {
        return Environment.get(key, fallback);
    }
}
