package com.example.backend.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "equipment")
public class Equipment {

    @Id
    @Column(name = "equipment_tag", nullable = false, length = 20)
    private String equipmentTag;

    @Column(name = "equipment_type", nullable = false)
    private String equipmentType;

    @Column(name = "location")
    private String location;

    @Column(name = "installed_date")
    private LocalDate installedDate;

    @Column(name = "manufacturer")
    private String manufacturer;

    @Column(name = "model")
    private String model;

    @Column(name = "criticality")
    private String criticality;

    @OneToMany(mappedBy = "equipment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkOrder> workOrders = new ArrayList<>();

    @OneToMany(mappedBy = "equipment", cascade = CascadeType.ALL)
    private List<EntityMention> entityMentions = new ArrayList<>();

    public String getEquipmentTag() {
        return equipmentTag;
    }

    public void setEquipmentTag(String equipmentTag) {
        this.equipmentTag = equipmentTag;
    }

    public String getEquipmentType() {
        return equipmentType;
    }

    public void setEquipmentType(String equipmentType) {
        this.equipmentType = equipmentType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDate getInstalledDate() {
        return installedDate;
    }

    public void setInstalledDate(LocalDate installedDate) {
        this.installedDate = installedDate;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getCriticality() {
        return criticality;
    }

    public void setCriticality(String criticality) {
        this.criticality = criticality;
    }

    public List<WorkOrder> getWorkOrders() {
        return workOrders;
    }

    public void setWorkOrders(List<WorkOrder> workOrders) {
        this.workOrders = workOrders;
    }

    public List<EntityMention> getEntityMentions() {
        return entityMentions;
    }

    public void setEntityMentions(List<EntityMention> entityMentions) {
        this.entityMentions = entityMentions;
    }

    public Equipment() {
    }

    public Equipment(String equipmentTag, String equipmentType, String location, LocalDate installedDate,
            String manufacturer, String model, String criticality, List<WorkOrder> workOrders,
            List<EntityMention> entityMentions) {
        this.equipmentTag = equipmentTag;
        this.equipmentType = equipmentType;
        this.location = location;
        this.installedDate = installedDate;
        this.manufacturer = manufacturer;
        this.model = model;
        this.criticality = criticality;
        this.workOrders = workOrders;
        this.entityMentions = entityMentions;
    }

}
