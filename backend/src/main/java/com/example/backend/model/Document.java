package com.example.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    // Original filename e.g. "SOP_Pump_P204.txt"
    @Column(name = "filename", nullable = false)
    private String filename;
 
    // SOP | WORK_ORDER | INSPECTION | INCIDENT | COMPLIANCE | OEM_MANUAL
    @Column(name = "doc_type", nullable = false)
    private String docType;
 
    // Full extracted text stored here for re-chunking or preview
    @Column(name = "raw_text", columnDefinition = "TEXT", nullable = false)
    private String rawText;
 
    // Relative path inside /data/documents/ or /data/structured/
    @Column(name = "source_path")
    private String sourcePath;
 
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;
 
    // Bidirectional — chunks are the "many" side
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentChunk> chunks = new ArrayList<>();
 
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EntityMention> entityMentions = new ArrayList<>();
 
    @PrePersist
    public void prePersist() {
        this.uploadedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getDocType() {
        return docType;
    }

    public void setDocType(String docType) {
        this.docType = docType;
    }

    public String getRawText() {
        return rawText;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }

    public String getSourcePath() {
        return sourcePath;
    }

    public void setSourcePath(String sourcePath) {
        this.sourcePath = sourcePath;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public List<DocumentChunk> getChunks() {
        return chunks;
    }

    public void setChunks(List<DocumentChunk> chunks) {
        this.chunks = chunks;
    }

    public List<EntityMention> getEntityMentions() {
        return entityMentions;
    }

    public void setEntityMentions(List<EntityMention> entityMentions) {
        this.entityMentions = entityMentions;
    }

    public Document() {
    }

    public Document(Long id, String filename, String docType, String rawText, String sourcePath,
            LocalDateTime uploadedAt, List<DocumentChunk> chunks, List<EntityMention> entityMentions) {
        this.id = id;
        this.filename = filename;
        this.docType = docType;
        this.rawText = rawText;
        this.sourcePath = sourcePath;
        this.uploadedAt = uploadedAt;
        this.chunks = chunks;
        this.entityMentions = entityMentions;
    }

}
