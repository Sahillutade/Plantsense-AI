package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.backend.model.Document;


public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByDocType(String docType);

    @Query(
        "SELECT d.id, d.filename, d.docType, d.uploadedAt FROM Document d ORDER BY d.uploadedAt DESC"
    )
    List<Object[]> findAllSummaries();

}
