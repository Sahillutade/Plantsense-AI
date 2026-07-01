package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.WorkOrder;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, String> {

    List<WorkOrder> findByEquipmentEquipmentTagOrderByDateOpenedDesc(String equipmentTag);

    @Query("""
        SELECT w FROM WorkOrder w
        WHERE w.equipment.equipmentTag = :tag
        AND w.type = 'Corrective'
        ORDER BY w.dateOpened DESC
    """)
    List<WorkOrder> findCorrectiveByEquipmentTag(@Param("tag") String tag);

}
