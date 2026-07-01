package com.example.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "entity_mentions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"document_id", "equipment_tag"})
)
public class EntityMention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_tag", nullable = false)
    private Equipment equipment;

    @Column(name = "mention_context", columnDefinition = "TEXT")
    private String mentionContext;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
    }

    public Equipment getEquipment() {
        return equipment;
    }

    public void setEquipment(Equipment equipment) {
        this.equipment = equipment;
    }

    public String getMentionContext() {
        return mentionContext;
    }

    public void setMentionContext(String mentionContext) {
        this.mentionContext = mentionContext;
    }

    public EntityMention() {
    }

    public EntityMention(Long id, Document document, Equipment equipment, String mentionContext) {
        this.id = id;
        this.document = document;
        this.equipment = equipment;
        this.mentionContext = mentionContext;
    }

}
