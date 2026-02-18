package com.pawpal.web;

import com.pawpal.model.Organization;
import com.pawpal.repo.OrganizationRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clinics")
public class ClinicController {

    private final OrganizationRepository organizationRepository;

    public ClinicController(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    @GetMapping
    public List<Organization> allOrganizations(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String area, // Keep for backward compatibility
            @RequestParam(required = false) Boolean openNow) {
        
        List<Organization> organizations;
        
        // Filter by type and city if provided
        if (type != null && city != null) {
            try {
                Organization.OrganizationType orgType = Organization.OrganizationType.valueOf(type.toUpperCase());
                organizations = organizationRepository.findByTypeAndCityIgnoreCase(orgType, city);
            } catch (IllegalArgumentException e) {
                organizations = organizationRepository.findByCityIgnoreCase(city);
            }
        } else if (type != null) {
            try {
                Organization.OrganizationType orgType = Organization.OrganizationType.valueOf(type.toUpperCase());
                organizations = organizationRepository.findByType(orgType);
            } catch (IllegalArgumentException e) {
                organizations = organizationRepository.findAll();
            }
        } else if (city != null) {
            organizations = organizationRepository.findByCityIgnoreCase(city);
        } else {
            organizations = organizationRepository.findAll();
        }
        
        // Backward compatibility: filter by area (maps to city)
        if (area != null && city == null) {
            organizations = organizations.stream()
                    .filter(org -> org.getCity().equalsIgnoreCase(area))
                    .collect(Collectors.toList());
        }
        
        // Filter by open hours if requested (only for clinics)
        if (openNow != null && openNow) {
            LocalTime now = LocalTime.now();
            organizations = organizations.stream()
                    .filter(org -> {
                        if (org.getType() != Organization.OrganizationType.CLINIC) {
                            return false;
                        }
                        if (org.getOpenHours() == null || org.getCloseHours() == null) {
                            return false;
                        }
                        try {
                            LocalTime open = LocalTime.parse(org.getOpenHours());
                            LocalTime close = LocalTime.parse(org.getCloseHours());
                            return now.isAfter(open) && now.isBefore(close);
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
        }
        
        return organizations;
    }
}
