package com.sanskar.portfolio;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public final class TryHackMeApiHandler implements HttpHandler {
    private static final long MAX_TRACKER_BYTES = 128L * 1024L;
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(4);
    private static final String DISABLED_RESPONSE = "{\"source\":\"disabled\",\"rooms\":[],\"skills\":[]}";

    private final Path trackerCachePath;
    private final Set<String> allowedOrigins;
    private final HttpClient httpClient;
    private final URI feedUri;
    private final Set<String> allowedFeedHosts;
    private final String bearerToken;

    public TryHackMeApiHandler(Path trackerCachePath, Set<String> allowedOrigins) {
        this.trackerCachePath = trackerCachePath;
        this.allowedOrigins = allowedOrigins;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(REQUEST_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        this.feedUri = parseFeedUri(Environment.get("PORTFOLIO_THM_FEED_URL"));
        this.allowedFeedHosts = parseAllowedHosts(Environment.get("PORTFOLIO_THM_ALLOWED_HOSTS"));
        this.bearerToken = cleanToken(Environment.get("PORTFOLIO_THM_TOKEN"));
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        SecurityHeaders.apply(exchange, allowedOrigins);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            SecurityHeaders.handlePreflight(exchange);
            return;
        }

        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            ProfileApiHandler.sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
            return;
        }

        String liveBody = fetchLiveFeed();
        if (liveBody != null) {
            sendTrackerJson(exchange, liveBody);
            return;
        }

        String cachedBody = readCache();
        sendTrackerJson(exchange, cachedBody == null ? DISABLED_RESPONSE : cachedBody);
    }

    private String fetchLiveFeed() {
        if (feedUri == null || !isAllowedFeedUri(feedUri)) {
            return null;
        }

        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder(feedUri)
                    .timeout(REQUEST_TIMEOUT)
                    .GET()
                    .header("Accept", "application/json")
                    .header("User-Agent", "SanskarPortfolioTHMTracker/1.0");

            if (bearerToken != null) {
                builder.header("Authorization", "Bearer " + bearerToken);
            }

            HttpResponse<byte[]> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return null;
            }

            byte[] body = response.body();
            if (!isSafeJson(body)) {
                return null;
            }

            return new String(body, ProfileApiHandler.UTF_8);
        } catch (IOException ex) {
            return null;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return null;
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private String readCache() throws IOException {
        if (!Files.isRegularFile(trackerCachePath)) {
            return null;
        }

        long size = Files.size(trackerCachePath);
        if (size <= 0 || size > MAX_TRACKER_BYTES) {
            return null;
        }

        byte[] body = Files.readAllBytes(trackerCachePath);
        if (!isSafeJson(body)) {
            return null;
        }

        return new String(body, ProfileApiHandler.UTF_8);
    }

    private void sendTrackerJson(HttpExchange exchange, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        byte[] body = json.getBytes(ProfileApiHandler.UTF_8);
        exchange.sendResponseHeaders(200, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }

    private boolean isAllowedFeedUri(URI uri) {
        String scheme = uri.getScheme();
        String host = uri.getHost();
        return "https".equalsIgnoreCase(scheme)
                && host != null
                && allowedFeedHosts.contains(host.toLowerCase(Locale.ROOT))
                && uri.getUserInfo() == null
                && (uri.getRawQuery() == null || uri.getRawQuery().length() <= 512);
    }

    private static boolean isSafeJson(byte[] body) {
        if (body == null || body.length <= 0 || body.length > MAX_TRACKER_BYTES) {
            return false;
        }

        String content = new String(body, ProfileApiHandler.UTF_8).trim();
        return (content.startsWith("{") && content.endsWith("}"))
                || (content.startsWith("[") && content.endsWith("]"));
    }

    private static URI parseFeedUri(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }

        try {
            return URI.create(raw.trim()).normalize();
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static Set<String> parseAllowedHosts(String raw) {
        String hosts = raw == null || raw.trim().isEmpty()
                ? "tryhackme.com,www.tryhackme.com,api.tryhackme.com"
                : raw;
        return Arrays.stream(hosts.split(","))
                .map(String::trim)
                .map(host -> host.toLowerCase(Locale.ROOT))
                .filter(host -> host.matches("[a-z0-9.-]+"))
                .collect(Collectors.toUnmodifiableSet());
    }

    private static String cleanToken(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return null;
        }

        String token = raw.trim();
        return token.matches("[A-Za-z0-9._~+/=-]{10,512}") ? token : null;
    }
}
