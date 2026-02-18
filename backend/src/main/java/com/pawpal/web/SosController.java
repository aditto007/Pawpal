package com.pawpal.web;

import com.pawpal.model.SosReport;
import com.pawpal.model.User;
import com.pawpal.repo.SosReportRepository;
import com.pawpal.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/sos")
public class SosController {

    private final SosReportRepository repo;
    private final AuthService authService;
    private static final Pattern PHONE_PATTERN = Pattern.compile("^01\\d{9}$");

    // Set in application.properties. Defaults to a local "uploads" folder.
    // file.upload-dir=F:/Software Projects/Pawpal/backend/uploads
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public SosController(SosReportRepository repo, AuthService authService) {
        this.repo = repo;
        this.authService = authService;
    }

    private Long getUserIdFromRequest(HttpServletRequest request) {
        Object userIdObj = request.getAttribute("userId");
        if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        }
        if (userIdObj instanceof Number) {
            return ((Number) userIdObj).longValue();
        }
        return null;
    }

    /** Create a report (with optional image) - requires authentication */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createReport(@RequestParam(required = false) String name,
            @RequestParam String phone,
            @RequestParam String description,
            @RequestParam(required = false, defaultValue = "OTHER") String category,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String latitude,
            @RequestParam(required = false) String longitude,
            @RequestParam(value = "image", required = false) MultipartFile image,
            HttpServletRequest request)
            throws IOException {

        Long userId = getUserIdFromRequest(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Optional<User> userOpt = authService.getUserById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }

        // Validate phone (required)
        String cleanedPhone = phone == null ? "" : phone.replaceAll("\\D", "");
        if (!PHONE_PATTERN.matcher(cleanedPhone).matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error",
                    "Phone must be exactly 11 digits, digits-only, and start with 01 (example: 01XXXXXXXXX)"));
        }

        SosReport report = new SosReport();
        String resolvedName = (name != null && !name.isBlank())
                ? name
                : Optional.ofNullable(userOpt.get().getName())
                        .filter(n -> !n.isBlank())
                        .orElse("Anonymous Pawpal");
        report.setName(resolvedName);
        report.setPhone(cleanedPhone);
        report.setDescription(description);
        report.setCreatedBy(userOpt.get());
        report.setStatus("active");

        // Set category, default to OTHER if invalid
        try {
            SosReport.SosCategory cat = SosReport.SosCategory.valueOf(category.toUpperCase());
            report.setCategory(cat);
        } catch (IllegalArgumentException e) {
            report.setCategory(SosReport.SosCategory.OTHER);
        }

        // Set location information
        if (address != null && !address.isBlank()) {
            report.setAddress(address);
        }
        if (city != null && !city.isBlank()) {
            report.setCity(city);
        }

        // Handle latitude/longitude (safely parse strings that might be empty)
        if (latitude != null && !latitude.isBlank()) {
            try {
                report.setLatitude(Double.parseDouble(latitude));
            } catch (NumberFormatException e) {
                // Ignore invalid or empty numbers
            }
        }

        if (longitude != null && !longitude.isBlank()) {
            try {
                report.setLongitude(Double.parseDouble(longitude));
            } catch (NumberFormatException e) {
                // Ignore invalid or empty numbers
            }
        }

        if (image != null && !image.isEmpty()) {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);

            String safeName = Path.of(image.getOriginalFilename()).getFileName().toString();
            Path target = dir.resolve(safeName).normalize();

            Files.copy(image.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // Store a web-friendly path the frontend can load (served by WebConfig)
            String webPath = "/uploads/" + safeName.replace("\\", "/");
            report.setImagePath(webPath);
        }

        SosReport savedReport = repo.save(report);
        // Fetch with relationships
        Optional<SosReport> reportWithRelations = repo.findById(savedReport.getId());
        return ResponseEntity.ok(reportWithRelations.orElse(savedReport));
    }

    /** Get all reports, optionally filtered by category */
    @GetMapping
    public List<SosReport> getAll(@RequestParam(required = false) String category) {
        if (category != null && !category.trim().isEmpty()) {
            try {
                SosReport.SosCategory cat = SosReport.SosCategory.valueOf(category.toUpperCase());
                return repo.findByCategoryOrderByCreatedAtDesc(cat);
            } catch (IllegalArgumentException e) {
                // Invalid category, return all
                return repo.findAllWithRelations();
            }
        }
        return repo.findAllWithRelations();
    }

    /** Get reports created by current user */
    @GetMapping("/mine")
    public ResponseEntity<?> getMine(HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        List<SosReport> reports = repo.findByCreatedByIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(reports);
    }

    /** Get one report by ID */
    @GetMapping("/{id}")
    public ResponseEntity<SosReport> getOne(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Mark "I can help" on an SOS report - requires authentication */
    @PostMapping("/{id}/help")
    public ResponseEntity<?> markCanHelp(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Optional<SosReport> reportOpt = repo.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<User> userOpt = authService.getUserById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }

        SosReport report = reportOpt.get();
        User user = userOpt.get();

        // Add user to helpers if not already added
        if (!report.getHelpers().contains(user)) {
            report.getHelpers().add(user);
            repo.save(report);
        }

        return ResponseEntity.ok(Map.of("message", "Successfully marked as helper"));
    }

    /** Update status of own SOS report - requires authentication */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Optional<SosReport> reportOpt = repo.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SosReport report = reportOpt.get();

        // Check if user is the creator of the report
        if (report.getCreatedBy() == null || !report.getCreatedBy().getId().equals(userId)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "You can only update status of your own SOS reports"));
        }

        String status = requestBody.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        report.setStatus(status);
        repo.save(report);

        return ResponseEntity.ok(report);
    }
}
