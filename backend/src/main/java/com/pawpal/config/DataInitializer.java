package com.pawpal.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pawpal.model.Organization;
import com.pawpal.repo.OrganizationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Override
    public void run(String... args) throws Exception {
        // Sync clinics from JSON (adds new ones if missing)
        syncClinicsData();

        // Sync pet shops from JSON
        syncPetShopsData();

        // Sync NGOs from JSON
        syncNGOsData();

        // Sync pet hostels from JSON
        syncPetHostelsData();

        // Always check and add NGOs and Shelters if they don't exist
        long ngoCount = organizationRepository.findByType(Organization.OrganizationType.NGO).size();
        if (ngoCount == 0) {
            System.out.println("No NGOs found, adding sample NGOs...");
            addSampleNGOs();
        }

        long shelterCount = organizationRepository.findByType(Organization.OrganizationType.SHELTER).size();
        if (shelterCount == 0) {
            System.out.println("No shelters found, adding sample shelters...");
            addSampleShelters();
        }

        // Always check and add Pet Shops if they don't exist
        long petShopCount = organizationRepository.findByType(Organization.OrganizationType.PET_SHOP).size();
        if (petShopCount == 0) {
            System.out.println("No pet shops found, adding sample pet shops...");
            addSamplePetShops();
        }

        // Always check and add Pet Hostels if they don't exist
        long petHostelCount = organizationRepository.findByType(Organization.OrganizationType.PET_HOSTEL).size();
        if (petHostelCount == 0) {
            System.out.println("No pet hostels found, adding sample pet hostels...");
            addSamplePetHostels();
        }
    }

    private void syncClinicsData() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        InputStream is = getClass().getResourceAsStream("/data/clinics.json");

        if (is == null) {
            System.out.println("No clinics.json found, skipping data sync");
            return;
        }

        // Read clinic format
        List<Map<String, Object>> clinicList = mapper.readValue(is, new TypeReference<>() {
        });

        // Map area to city (assuming area is like "Dhanmondi", "Banani", "Uttara" which
        // are areas in Dhaka)
        Map<String, String> areaToCity = new HashMap<>();
        areaToCity.put("Dhanmondi", "Dhaka");
        areaToCity.put("Banani", "Dhaka");
        areaToCity.put("Uttara", "Dhaka");
        areaToCity.put("Mirpur 2", "Dhaka"); // Add Mirpur mappings
        areaToCity.put("Mirpur", "Dhaka");
        areaToCity.put("Gulshan", "Dhaka");
        areaToCity.put("Bashundhara Residential", "Dhaka");

        int addedCount = 0;
        for (Map<String, Object> clinicData : clinicList) {
            String name = (String) clinicData.get("name");

            // Check if clinic already exists
            List<Organization> existing = organizationRepository.findByName(name);
            Organization org;

            if (!existing.isEmpty()) {
                org = existing.get(0);
                // System.out.println("Updating existing clinic: " + name);
            } else {
                org = new Organization();
                org.setName(name);
                org.setType(Organization.OrganizationType.CLINIC);
                addedCount++;
            }

            String area = (String) clinicData.get("area");
            org.setCity(areaToCity.getOrDefault(area, area != null ? area : "Dhaka"));
            org.setAddress(area != null ? area + ", " + org.getCity() : org.getCity());

            org.setPhone((String) clinicData.get("phone"));
            org.setOpenHours((String) clinicData.get("open"));
            org.setCloseHours((String) clinicData.get("close"));

            if (clinicData.containsKey("latitude") && clinicData.containsKey("longitude")) {
                try {
                    Object latObj = clinicData.get("latitude");
                    Object lonObj = clinicData.get("longitude");
                    double lat = 0;
                    double lon = 0;

                    if (latObj instanceof Number) {
                        lat = ((Number) latObj).doubleValue();
                    } else if (latObj instanceof String) {
                        lat = Double.parseDouble((String) latObj);
                    }

                    if (lonObj instanceof Number) {
                        lon = ((Number) lonObj).doubleValue();
                    } else if (lonObj instanceof String) {
                        lon = Double.parseDouble((String) lonObj);
                    }

                    org.setLatitude(lat);
                    org.setLongitude(lon);
                    System.out.println("Loaded coordinates for " + name + ": " + lat + ", " + lon);
                } catch (Exception e) {
                    System.err.println("Error parsing coordinates for " + name + ": " + e.getMessage());
                    // Fallback to default if parsing fails
                    if (org.getCity().equals("Dhaka")) {
                        org.setLatitude(23.8103);
                        org.setLongitude(90.4125);
                    }
                }
            } else if (org.getCity().equals("Dhaka")) {
                org.setLatitude(23.8103);
                org.setLongitude(90.4125);
                System.out.println("Using default Dhaka coordinates for " + name);
            }
            organizationRepository.save(org);
        }

        if (addedCount > 0) {
            System.out.println("Added " + addedCount + " new clinics from JSON");
        }
    }

    private void syncPetShopsData() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        InputStream is = getClass().getResourceAsStream("/data/pet_shops.json");

        if (is == null) {
            System.out.println("No pet_shops.json found, skipping data sync");
            return;
        }

        List<Map<String, Object>> shopList = mapper.readValue(is, new TypeReference<>() {
        });

        int addedCount = 0;
        for (Map<String, Object> shopData : shopList) {
            String name = (String) shopData.get("name");

            List<Organization> existing = organizationRepository.findByName(name);
            Organization org;

            if (!existing.isEmpty()) {
                org = existing.get(0);
            } else {
                org = new Organization();
                org.setName(name);
                org.setType(Organization.OrganizationType.PET_SHOP);
                addedCount++;
            }

            String area = (String) shopData.get("area");
            org.setCity(area != null ? area : "Dhaka");

            // Use specific address if provided, otherwise construct from area
            String address = (String) shopData.get("address");
            if (address != null && !address.isEmpty()) {
                org.setAddress(address);
            } else {
                org.setAddress(area + ", " + org.getCity());
            }

            org.setPhone((String) shopData.get("phone"));
            org.setOpenHours((String) shopData.get("open"));
            org.setCloseHours((String) shopData.get("close"));

            if (shopData.containsKey("latitude") && shopData.containsKey("longitude")) {
                try {
                    org.setLatitude(((Number) shopData.get("latitude")).doubleValue());
                    org.setLongitude(((Number) shopData.get("longitude")).doubleValue());
                } catch (Exception e) {
                    System.err.println("Error parsing coordinates for " + name);
                }
            }

            organizationRepository.save(org);
        }

        if (addedCount > 0) {
            System.out.println("Added " + addedCount + " new pet shops from JSON");
        }
    }

    private void syncNGOsData() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        InputStream is = getClass().getResourceAsStream("/data/ngos.json");

        if (is == null) {
            System.out.println("No ngos.json found, skipping data sync");
            return;
        }

        List<Map<String, Object>> ngoList = mapper.readValue(is, new TypeReference<>() {
        });

        int addedCount = 0;
        for (Map<String, Object> ngoData : ngoList) {
            String name = (String) ngoData.get("name");

            List<Organization> existing = organizationRepository.findByName(name);
            Organization org;

            if (!existing.isEmpty()) {
                org = existing.get(0);
            } else {
                org = new Organization();
                org.setName(name);
                org.setType(Organization.OrganizationType.NGO);
                addedCount++;
            }

            String address = (String) ngoData.get("address");
            org.setAddress(address != null ? address : (String) ngoData.get("area"));
            org.setCity((String) ngoData.get("city"));
            org.setPhone((String) ngoData.get("phone"));

            // Note: Website is in JSON but not in Organization entity yet. Ignoring for
            // now.

            if (ngoData.containsKey("latitude") && ngoData.containsKey("longitude")) {
                try {
                    org.setLatitude(((Number) ngoData.get("latitude")).doubleValue());
                    org.setLongitude(((Number) ngoData.get("longitude")).doubleValue());
                } catch (Exception e) {
                    System.err.println("Error parsing coordinates for " + name);
                }
            }

            organizationRepository.save(org);
        }

        if (addedCount > 0) {
            System.out.println("Added " + addedCount + " new NGOs from JSON");
        }
    }

    private void syncPetHostelsData() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        InputStream is = getClass().getResourceAsStream("/data/pet_hostels.json");

        if (is == null) {
            System.out.println("No pet_hostels.json found, skipping data sync");
            return;
        }

        List<Map<String, Object>> hostelList = mapper.readValue(is, new TypeReference<>() {
        });

        int addedCount = 0;
        for (Map<String, Object> hostelData : hostelList) {
            String name = (String) hostelData.get("name");

            List<Organization> existing = organizationRepository.findByName(name);
            Organization org;

            if (!existing.isEmpty()) {
                org = existing.get(0);
            } else {
                org = new Organization();
                org.setName(name);
                org.setType(Organization.OrganizationType.PET_HOSTEL);
                addedCount++;
            }

            String address = (String) hostelData.get("address");
            org.setAddress(address != null ? address : (String) hostelData.get("area"));
            org.setCity((String) hostelData.get("city"));
            org.setPhone((String) hostelData.get("phone"));

            if (hostelData.containsKey("latitude") && hostelData.containsKey("longitude")) {
                try {
                    org.setLatitude(((Number) hostelData.get("latitude")).doubleValue());
                    org.setLongitude(((Number) hostelData.get("longitude")).doubleValue());
                } catch (Exception e) {
                    System.err.println("Error parsing coordinates for " + name);
                }
            }

            organizationRepository.save(org);
        }

        if (addedCount > 0) {
            System.out.println("Added " + addedCount + " new pet hostels from JSON");
        }
    }

    private void addSampleNGOs() {
        // NGO 1 - Dhaka
        Organization ngo1 = new Organization();
        ngo1.setName("Paws for Hope Foundation");
        ngo1.setType(Organization.OrganizationType.NGO);
        ngo1.setAddress("House 45, Road 12, Dhanmondi");
        ngo1.setCity("Dhaka");
        ngo1.setPhone("+8801712345679");
        ngo1.setLatitude(23.7456);
        ngo1.setLongitude(90.3733);
        organizationRepository.save(ngo1);

        // NGO 2 - Chittagong
        Organization ngo2 = new Organization();
        ngo2.setName("Animal Welfare Society");
        ngo2.setType(Organization.OrganizationType.NGO);
        ngo2.setAddress("Agrabad Commercial Area, Block C");
        ngo2.setCity("Chittagong");
        ngo2.setPhone("+8801811223345");
        ngo2.setLatitude(22.3569);
        ngo2.setLongitude(91.7832);
        organizationRepository.save(ngo2);

        // NGO 3 - Sylhet
        Organization ngo3 = new Organization();
        ngo3.setName("Compassionate Paws Bangladesh");
        ngo3.setType(Organization.OrganizationType.NGO);
        ngo3.setAddress("Zindabazar, Main Road");
        ngo3.setCity("Sylhet");
        ngo3.setPhone("+8801911223346");
        ngo3.setLatitude(24.8949);
        ngo3.setLongitude(91.8687);
        organizationRepository.save(ngo3);

        System.out.println("Added 3 sample NGOs");
    }

    private void addSampleShelters() {
        // Shelter 1 - Dhaka
        Organization shelter1 = new Organization();
        shelter1.setName("Happy Tails Animal Shelter");
        shelter1.setType(Organization.OrganizationType.SHELTER);
        shelter1.setAddress("Plot 23, Sector 7, Uttara");
        shelter1.setCity("Dhaka");
        shelter1.setPhone("+8801712345680");
        shelter1.setLatitude(23.8759);
        shelter1.setLongitude(90.3795);
        organizationRepository.save(shelter1);

        // Shelter 2 - Rajshahi
        Organization shelter2 = new Organization();
        shelter2.setName("Safe Haven Pet Shelter");
        shelter2.setType(Organization.OrganizationType.SHELTER);
        shelter2.setAddress("Kazla, Rajshahi University Area");
        shelter2.setCity("Rajshahi");
        shelter2.setPhone("+8801811223347");
        shelter2.setLatitude(24.3636);
        shelter2.setLongitude(88.6241);
        organizationRepository.save(shelter2);

        // Shelter 3 - Khulna
        Organization shelter3 = new Organization();
        shelter3.setName("Furry Friends Rescue Center");
        shelter3.setType(Organization.OrganizationType.SHELTER);
        shelter3.setAddress("Sonadanga Residential Area, Block B");
        shelter3.setCity("Khulna");
        shelter3.setPhone("+8801911223348");
        shelter3.setLatitude(22.8088);
        shelter3.setLongitude(89.5603);
        organizationRepository.save(shelter3);

        System.out.println("Added 3 sample Shelters");
    }

    private void addSamplePetShops() {
        // Pet Shop 1 - Dhaka
        Organization shop1 = new Organization();
        shop1.setName("Pawfect Pet Supplies");
        shop1.setType(Organization.OrganizationType.PET_SHOP);
        shop1.setAddress("House 78, Road 7, Dhanmondi");
        shop1.setCity("Dhaka");
        shop1.setPhone("+8801712345681");
        shop1.setLatitude(23.7456);
        shop1.setLongitude(90.3733);
        shop1.setOpenHours("09:00");
        shop1.setCloseHours("20:00");
        organizationRepository.save(shop1);

        // Pet Shop 2 - Chittagong
        Organization shop2 = new Organization();
        shop2.setName("Furry Friends Pet Store");
        shop2.setType(Organization.OrganizationType.PET_SHOP);
        shop2.setAddress("GEC Circle, Agrabad");
        shop2.setCity("Chittagong");
        shop2.setPhone("+8801811223349");
        shop2.setLatitude(22.3569);
        shop2.setLongitude(91.7832);
        shop2.setOpenHours("10:00");
        shop2.setCloseHours("21:00");
        organizationRepository.save(shop2);

        // Pet Shop 3 - Sylhet
        Organization shop3 = new Organization();
        shop3.setName("Happy Paws Pet Shop");
        shop3.setType(Organization.OrganizationType.PET_SHOP);
        shop3.setAddress("Zindabazar, Main Road");
        shop3.setCity("Sylhet");
        shop3.setPhone("+8801911223350");
        shop3.setLatitude(24.8949);
        shop3.setLongitude(91.8687);
        shop3.setOpenHours("09:00");
        shop3.setCloseHours("19:00");
        organizationRepository.save(shop3);

        // Pet Shop 4 - Dhaka (Gulshan)
        Organization shop4 = new Organization();
        shop4.setName("Premium Pet Foods & Accessories");
        shop4.setType(Organization.OrganizationType.PET_SHOP);
        shop4.setAddress("Gulshan 2, Circle 1");
        shop4.setCity("Dhaka");
        shop4.setPhone("+8801712345682");
        shop4.setLatitude(23.7947);
        shop4.setLongitude(90.4144);
        shop4.setOpenHours("08:00");
        shop4.setCloseHours("22:00");
        organizationRepository.save(shop4);

        // Pet Shop 5 - Rajshahi
        Organization shop5 = new Organization();
        shop5.setName("Pet Paradise Store");
        shop5.setType(Organization.OrganizationType.PET_SHOP);
        shop5.setAddress("Shaheb Bazar, Main Road");
        shop5.setCity("Rajshahi");
        shop5.setPhone("+8801811223351");
        shop5.setLatitude(24.3636);
        shop5.setLongitude(88.6241);
        shop5.setOpenHours("09:00");
        shop5.setCloseHours("20:00");
        organizationRepository.save(shop5);

        // Pet Shop 6 - Khulna
        Organization shop6 = new Organization();
        shop6.setName("Best Friend Pet Supplies");
        shop6.setType(Organization.OrganizationType.PET_SHOP);
        shop6.setAddress("Sonadanga, Main Road");
        shop6.setCity("Khulna");
        shop6.setPhone("+8801911223352");
        shop6.setLatitude(22.8088);
        shop6.setLongitude(89.5603);
        shop6.setOpenHours("09:00");
        shop6.setCloseHours("19:00");
        organizationRepository.save(shop6);

        System.out.println("Added 6 sample Pet Shops");
    }

    private void addSamplePetHostels() {
        // Pet Hostel 1 - Dhaka
        Organization hostel1 = new Organization();
        hostel1.setName("PawStay Pet Hostel");
        hostel1.setType(Organization.OrganizationType.PET_HOSTEL);
        hostel1.setAddress("House 45, Road 27, Dhanmondi");
        hostel1.setCity("Dhaka");
        hostel1.setPhone("+8801712345683");
        hostel1.setLatitude(23.7456);
        hostel1.setLongitude(90.3733);
        hostel1.setOpenHours("08:00");
        hostel1.setCloseHours("20:00");
        organizationRepository.save(hostel1);

        // Pet Hostel 2 - Chittagong
        Organization hostel2 = new Organization();
        hostel2.setName("Comfy Paws Boarding");
        hostel2.setType(Organization.OrganizationType.PET_HOSTEL);
        hostel2.setAddress("Agrabad Commercial Area, Block D");
        hostel2.setCity("Chittagong");
        hostel2.setPhone("+8801811223353");
        hostel2.setLatitude(22.3569);
        hostel2.setLongitude(91.7832);
        hostel2.setOpenHours("09:00");
        hostel2.setCloseHours("19:00");
        organizationRepository.save(hostel2);

        // Pet Hostel 3 - Sylhet
        Organization hostel3 = new Organization();
        hostel3.setName("Happy Tails Pet Boarding");
        hostel3.setType(Organization.OrganizationType.PET_HOSTEL);
        hostel3.setAddress("Zindabazar, Main Road");
        hostel3.setCity("Sylhet");
        hostel3.setPhone("+8801911223354");
        hostel3.setLatitude(24.8949);
        hostel3.setLongitude(91.8687);
        hostel3.setOpenHours("08:00");
        hostel3.setCloseHours("18:00");
        organizationRepository.save(hostel3);

        // Pet Hostel 4 - Dhaka (Gulshan)
        Organization hostel4 = new Organization();
        hostel4.setName("Premium Pet Care Hostel");
        hostel4.setType(Organization.OrganizationType.PET_HOSTEL);
        hostel4.setAddress("Gulshan 1, Road 45");
        hostel4.setCity("Dhaka");
        hostel4.setPhone("+8801712345684");
        hostel4.setLatitude(23.7947);
        hostel4.setLongitude(90.4144);
        hostel4.setOpenHours("07:00");
        hostel4.setCloseHours("21:00");
        organizationRepository.save(hostel4);

        // Pet Hostel 5 - Rajshahi
        Organization hostel5 = new Organization();
        hostel5.setName("Safe Paws Boarding House");
        hostel5.setType(Organization.OrganizationType.PET_HOSTEL);
        hostel5.setAddress("Shaheb Bazar, Main Road");
        hostel5.setCity("Rajshahi");
        hostel5.setPhone("+8801811223355");
        hostel5.setLatitude(24.3636);
        hostel5.setLongitude(88.6241);
        hostel5.setOpenHours("08:00");
        hostel5.setCloseHours("20:00");
        organizationRepository.save(hostel5);

        // Pet Hostel 6 - Khulna
        Organization hostel6 = new Organization();
        hostel6.setName("Furry Friends Boarding");
        hostel6.setType(Organization.OrganizationType.PET_HOSTEL);
        hostel6.setAddress("Sonadanga Residential Area, Block C");
        hostel6.setCity("Khulna");
        hostel6.setPhone("+8801911223356");
        hostel6.setLatitude(22.8088);
        hostel6.setLongitude(89.5603);
        hostel6.setOpenHours("08:00");
        hostel6.setCloseHours("19:00");
        organizationRepository.save(hostel6);

        System.out.println("Added 6 sample Pet Hostels");
    }
}
