import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class aicteacitivity {

    private static final int PORT = 8080;
    private static final int BASE_POINTS = 75;
    private static final int TARGET = 100;
    private static final int POINTS_PER_CHECKIN = 5;

    // In-memory store for the demo (timestamps of check-ins)
    private static final List<String> checkins = new CopyOnWriteArrayList<>();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        server.createContext("/api/checkin", aicteacitivity::handleCheckin);
        server.createContext("/api/status", aicteacitivity::handleStatus);
        server.createContext("/api/login", aicteacitivity::handleLogin);

        server.start();
        System.out.println("AICTE Backend running on http://localhost:" + PORT);
    }

    private static void handleLogin(HttpExchange ex) throws IOException {
        addCors(ex);
        switch (ex.getRequestMethod().toUpperCase()) {
            case "OPTIONS" -> ex.sendResponseHeaders(204, -1);
            case "POST" -> {
                String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                System.out.println("Login attempt received: " + body);
                send(ex, 200, "{\"status\":\"success\",\"message\":\"Authentication successful\","
                        + "\"token\":\"mock-jwt-token-123\"}");
            }
            default -> ex.sendResponseHeaders(405, -1);
        }
        ex.close();
    }

    private static void handleCheckin(HttpExchange ex) throws IOException {
        addCors(ex);
        switch (ex.getRequestMethod().toUpperCase()) {
            case "OPTIONS" -> ex.sendResponseHeaders(204, -1);
            case "POST" -> {
                ex.getRequestBody().readAllBytes(); // read and ignore the body
                checkins.add(Instant.now().toString());
                send(ex, 200, "{\"status\":\"success\",\"message\":\"Check-in recorded\"}");
            }
            default -> ex.sendResponseHeaders(405, -1);
        }
        ex.close();
    }

    private static void handleStatus(HttpExchange ex) throws IOException {
        addCors(ex);
        switch (ex.getRequestMethod().toUpperCase()) {
            case "OPTIONS" -> ex.sendResponseHeaders(204, -1);
            case "GET" -> {
                int count = checkins.size();
                int points = Math.min(TARGET, BASE_POINTS + count * POINTS_PER_CHECKIN);

                // last 5 check-ins, newest first
                StringBuilder recent = new StringBuilder("[");
                int shown = 0;
                for (int i = count - 1; i >= 0 && shown < 5; i--, shown++) {
                    if (shown > 0) recent.append(",");
                    recent.append("\"").append(checkins.get(i)).append("\"");
                }
                recent.append("]");

                send(ex, 200, "{\"student\":\"Aditi Singh\",\"points\":" + points
                        + ",\"target\":" + TARGET
                        + ",\"checkins\":" + count
                        + ",\"recent\":" + recent + "}");
            }
            default -> ex.sendResponseHeaders(405, -1);
        }
        ex.close();
    }

    private static void addCors(HttpExchange ex) {
        Headers h = ex.getResponseHeaders();
        h.set("Access-Control-Allow-Origin", "*");
        h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        h.set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void send(HttpExchange ex, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(code, bytes.length);
        ex.getResponseBody().write(bytes);
    }
}
