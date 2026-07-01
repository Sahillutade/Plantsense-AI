package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.Equipment;

public interface EquipmentRepository extends JpaRepository<Equipment, String> {

}
