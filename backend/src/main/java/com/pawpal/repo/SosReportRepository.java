package com.pawpal.repo;

import com.pawpal.model.SosReport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SosReportRepository extends JpaRepository<SosReport, Long> {

    @EntityGraph(attributePaths = {"createdBy", "helpers"})
    @Query("SELECT r FROM SosReport r")
    List<SosReport> findAllWithRelations();

    @EntityGraph(attributePaths = {"createdBy", "helpers"})
    Optional<SosReport> findById(Long id);

    @EntityGraph(attributePaths = {"createdBy", "helpers"})
    List<SosReport> findByCreatedByIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"createdBy", "helpers"})
    @Query("SELECT r FROM SosReport r WHERE r.category = :category ORDER BY r.createdAt DESC")
    List<SosReport> findByCategoryOrderByCreatedAtDesc(@Param("category") SosReport.SosCategory category);
}
