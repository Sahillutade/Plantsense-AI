package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.EntityMention;

public interface EntityMentionRepository extends JpaRepository<EntityMention, Long> {

    List<EntityMention> findByEquipmentEquipmentTag(String equipmentTag);

    List<EntityMention> findByDocumentId(Long documentId);

}
