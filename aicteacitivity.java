import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class aicteacitivity {

    // In-memory store for the demo
    private static final List<String> checkins = new CopyOnWriteArrayList<>();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        // Endpoints
        server.createContext("/api/checkin", aicteacitivity::handleCheckin);
        server.createContext("/api/status", aicteacitivity::handleStatus);
        server.createContext("/api/login", aicteacitivity::handleLogin);
        
        server.start();
        System.out.println("AICTE Backend running on http://localhost:8080");
    }

    private static void handleLogin(HttpExchange ex) throws IOException {
        addCors(ex);
        // THE LINE BELOW WAS MISSING IN YOUR SCREENSHOT
        switch (ex.getRequestMethod().toUpperCase()) { 
            case "OPTIONS" -> ex.sendResponseHeaders(204, -1);
            case "POST" -> {
                String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                System.out.println("Login attempt received: " + body);
                
                String responseJson = "{\"status\":\"success\", \"message\":\"Authentication successful\", \"token\":\"mock-jwt-token-123\"}";
                send(ex, 200, responseJson);
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
                String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                checkins.add(body);
                send(ex, 200, "{\"status\":\"success\",\"message\":\"Check-in recorded\"}");
            }
            default -> ex.sendResponseHeaders(405, -1);
        }
        ex.close();
    }

    private static void handleStatus(HttpExchange ex) throws IOException {
        addCors(ex);
        send(ex, 200, "{\"student\":\"Aditi Singh\",\"points\":75,\"target\":100,\"checkins\":"
                + checkins.size() + "}");
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
