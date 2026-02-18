package com.pawpal.web;

import com.pawpal.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private static final Pattern PHONE_PATTERN = Pattern.compile("^01\\d{9}$");
    private static final Pattern GMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@gmail\\.com$", Pattern.CASE_INSENSITIVE);

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String email = request.get("email");
            String password = request.get("password");
            String phone = request.get("phone");
            String city = request.get("city");

            if (name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and password are required"));
            }

            email = email.trim();
            if (!GMAIL_PATTERN.matcher(email).matches()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please use a valid Gmail address (example: yourname@gmail.com)"));
            }

            if (phone != null && !phone.trim().isEmpty()) {
                String cleanedPhone = phone.replaceAll("\\D", "");
                if (!PHONE_PATTERN.matcher(cleanedPhone).matches()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Phone must be exactly 11 digits, digits-only, and start with 01 (example: 01XXXXXXXXX)"));
                }
                phone = cleanedPhone;
            } else {
                phone = null;
            }

            Map<String, Object> result = authService.signup(name, email, password, phone, city);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            if (email == null || email.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
            }

            Map<String, Object> result = authService.login(email, password);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
}


