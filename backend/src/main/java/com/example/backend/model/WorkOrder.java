package com.example.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "work_orders")
public class WorkOrder {

    @Id
    @Column(name = "work_order_id", nullable = false, length = 20)
    private String workOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_tag", nullable = false)
    private Equipment equipment;

    @Column(name = "date_opened")
    private LocalDate dateOpened;

    @Column(name = "date_closed")
    private LocalDate dateClosed;

    @Column(name = "type")
    private String type;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "technician")
    private String technician;

    @Column(name = "downtime_hours")
    private BigDecimal downtimeHours;

    public String getWorkOrderId() {
        return workOrderId;
    }

    public void setWorkOrderId(String workOrderId) {
        this.workOrderId = workOrderId;
    }

    public Equipment getEquipment() {
        return equipment;
    }

    public void setEquipment(Equipment equipment) {
        this.equipment = equipment;
    }

    public LocalDate getDateOpened() {
        return dateOpened;
    }

    public void setDateOpened(LocalDate dateOpened) {
        this.dateOpened = dateOpened;
    }

    public LocalDate getDateClosed() {
        return dateClosed;
    }

    public void setDateClosed(LocalDate dateClosed) {
        this.dateClosed = dateClosed;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String rootCause) {
        this.rootCause = rootCause;
    }

    public String getTechnician() {
        return technician;
    }

    public void setTechnician(String technician) {
        this.technician = technician;
    }

    public BigDecimal getDowntimeHours() {
        return downtimeHours;
    }

    public void setDowntimeHours(BigDecimal downtimeHours) {
        this.downtimeHours = downtimeHours;
    }

    public WorkOrder() {
    }

    public WorkOrder(String workOrderId, Equipment equipment, LocalDate dateOpened, LocalDate dateClosed, String type,
            String description, String rootCause, String technician, BigDecimal downtimeHours) {
        this.workOrderId = workOrderId;
        this.equipment = equipment;
        this.dateOpened = dateOpened;
        this.dateClosed = dateClosed;
        this.type = type;
        this.description = description;
        this.rootCause = rootCause;
        this.technician = technician;
        this.downtimeHours = downtimeHours;
    }

}
