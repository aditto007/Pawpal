package com.pawpal.repo;

import com.pawpal.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    List<Organization> findByType(Organization.OrganizationType type);

    List<Organization> findByCityIgnoreCase(String city);

    List<Organization> findByTypeAndCityIgnoreCase(Organization.OrganizationType type, String city);

    List<Organization> findByName(String name);

    List<Organization> findAllByOrderByNameAsc();
}
