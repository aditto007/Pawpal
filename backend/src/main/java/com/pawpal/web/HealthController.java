package com.pawpal.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "OK",
                "service", "Pawpal Backend",
                "version", "0.0.1",
                "uptimeHint", System.currentTimeMillis()
        );
    }
}
