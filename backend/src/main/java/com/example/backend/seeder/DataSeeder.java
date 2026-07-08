package com.example.backend.seeder;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import com.example.backend.model.Equipment;
import com.example.backend.model.WorkOrder;
import com.example.backend.repository.DocumentRepository;
import com.example.backend.repository.EquipmentRepository;
import com.example.backend.repository.WorkOrderRepository;
import com.example.backend.service.IngestionService;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final EquipmentRepository  equipmentRepository;
    private final WorkOrderRepository  workOrderRepository;
    private final DocumentRepository   documentRepository;
    private final IngestionService     ingestionService;
 
    public DataSeeder(
        EquipmentRepository equipmentRepository,
        WorkOrderRepository workOrderRepository,
        DocumentRepository  documentRepository,
        IngestionService    ingestionService
    ) {
        this.equipmentRepository = equipmentRepository;
        this.workOrderRepository = workOrderRepository;
        this.documentRepository  = documentRepository;
        this.ingestionService    = ingestionService;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {

        log.info("DataSeeder starting...");

        seedEquipment();
        seedWorkOrders();
        seedDocuments();

        log.info("DataSeeder complete. equipment={}, workOrders={}, documents={}", equipmentRepository.count(), workOrderRepository.count(), documentRepository.count());

    }

    // EQUIPMENT - hardcoded from equipment.csv
    private void seedEquipment() {

        if(equipmentRepository.count() > 0) {
            log.info("Equipment already seeded - skipping");
            return;
        }

        log.info("Seeding equipment...");

        save(equipment("P-204", "Centrifugal Pump", "Unit 2 - Process Area",  "2018-03-14", "Kirloskar Brothers", "KBL-CP-450", "High"));
        save(equipment("P-101", "Centrifugal Pump", "Unit 1 - Feed Section", "2015-07-22", "Grundfos", "NK-200", "Medium"));
        save(equipment("V-12",  "Pressure Vessel", "Unit 1 - Storage", "2012-11-05", "L&T Heavy Engineering","PV-3000", "High"));
        save(equipment("C-301", "Reciprocating Compressor", "Unit 3 - Compression", "2019-01-30", "Ingersoll Rand", "IR-RC-700", "High"));
        save(equipment("HX-205", "Shell & Tube Heat Exchanger", "Unit 2 - Process Area", "2016-05-18", "Thermax", "TX-HX-150", "Medium"));
        save(equipment("T-410", "Storage Tank", "Tank Farm", "2010-09-01", "Hindustan Tank Works", "HTW-T500", "Low"));
        save(equipment("V-22", "Pressure Relief Valve", "Unit 2 - Process Area", "2018-03-14", "Crosby", "JOS-E", "High"));
        save(equipment("M-115", "Induction Motor", "Unit 1 - Feed Section", "2015-07-22", "Siemens", "1LE1003", "Medium"));

        log.info("Equipment seeded: {} records", equipmentRepository.count());

    }

    private Equipment equipment(String tag, String type, String location, String installedDate, String manufacturer, String model, String criticality) {
        Equipment e = new Equipment();
        e.setEquipmentTag(tag);
        e.setEquipmentType(type);
        e.setLocation(location);
        e.setInstalledDate(LocalDate.parse(installedDate));
        e.setManufacturer(manufacturer);
        e.setModel(model);
        e.setCriticality(criticality);
        return e;
    }

    private void save(Equipment e) {
        if (equipmentRepository.findById(e.getEquipmentTag()).isEmpty()) {
            equipmentRepository.save(e);
        }
    }

    // WORK ORDERS - hardcoded from work_orders.csv
    private void seedWorkOrders() {

        if(workOrderRepository.count() > 0) {
            log.info("Work orders already seeded - skipping");
            return;
        }

        log.info("Seeding work orders...");

        // P-204 history
        wo("WO-3201", "P-204", "2025-08-12", "2025-08-12", "Preventive", "Routine seal inspection - no anomalies found", "N/A", "R. Mehta", BigDecimal.valueOf(0.0));
        wo("WO-3275", "P-204","2025-11-03", "2025-11-04", "Corrective", "Mechanical seal leak detected during shift inspection", "Seal face wear due to dry running", "A. Kulkarni", BigDecimal.valueOf(6.0));
        wo("WO-3381", "P-204", "2026-03-09", "2026-03-10", "Corrective", "Pump failure - high vibration followed by seal rupture", "Mechanical seal degradation; vibration threshold exceeded 5 days prior without flagged inspection", "A. Kulkarni", BigDecimal.valueOf(14.0));
        wo("WO-3390", "P-204", "2026-03-15", "2026-03-15", "Preventive", "Post-repair vibration baseline check", "N/A", "R. Mehta", BigDecimal.valueOf(0.0));
        wo("WO-3402", "P-204", "2026-04-02", "2026-04-02", "Preventive", "30-day post-repair follow-up inspection", "N/A", "A. Kulkarni" , BigDecimal.valueOf(0.0));
 
        // P-101
        wo("WO-2987", "P-101", "2025-05-20", "2025-05-21", "Corrective", "Bearing noise reported by operator", "Bearing wear - lubrication interval exceeded", "S. Iyer", BigDecimal.valueOf(8.0));
 
        // V-12
        wo("WO-2940", "V-12", "2025-04-10", "2025-04-10", "Inspection", "Routine thickness survey - no defects found", "N/A", "Inspection Team", BigDecimal.valueOf(0.0));
        wo("WO-3045","V-12","2025-06-28","2025-06-28","Inspection","External corrosion inspection - quarterly visual check", "N/A", "Inspection Team",BigDecimal.valueOf(0.0));
        wo("WO-3050","V-12","2025-06-30","2025-07-01","Inspection","Annual pressure vessel inspection per PESO requirement", "N/A", "Inspection Team", BigDecimal.valueOf(0.0));
 
        // C-301
        wo("WO-2811","C-301","2023-08-25","2023-08-25","Corrective","Compressor trip on high discharge temperature", "Cooling water strainer fouling - monsoon silt loading", "M. Das", BigDecimal.valueOf(9.0));
        wo("WO-3155","C-301","2025-09-18","2025-09-19","Corrective","Compressor trip on high discharge temperature", "Cooling water flow restriction", "M. Das", BigDecimal.valueOf(10.0));
        wo("WO-3160","C-301","2025-09-25","2025-09-25","Preventive","Strainer inspection frequency increased to biweekly per INC-2025-098", "N/A","M. Das", BigDecimal.valueOf(0.0));
 
        // HX-205
        wo("WO-3299","HX-205","2025-12-01","2025-12-02","Preventive","Tube bundle cleaning - scheduled maintenance",                                       "N/A",                                                                                         "R. Mehta",  BigDecimal.valueOf(4.0));
        wo("WO-3360","HX-205","2026-02-05","2026-02-05","Inspection","Tube bundle thickness check - minor fouling noted",                                  "N/A",                                                                                         "Inspection Team", BigDecimal.valueOf(0.0));
 
        // V-22
        wo("WO-3340","V-22","2026-01-22","2026-01-22","Inspection","Relief valve set-pressure verification",                                               "N/A",                                                                                         "Inspection Team", BigDecimal.valueOf(0.0));
 
        // T-410
        wo("WO-3210","T-410","2025-08-30","2025-08-31","Corrective","High level alarm - level gauge calibration drift",                                    "Instrument calibration drift",                                                                "S. Iyer",    BigDecimal.valueOf(3.0));
        wo("WO-3220","T-410","2025-09-15","2025-09-15","Preventive","Follow-up gauge accuracy verification post-recalibration",                            "N/A",                                                                                         "S. Iyer",    BigDecimal.valueOf(0.0));
 
        // M-115
        wo("WO-3088","M-115","2025-07-14","2025-07-14","Preventive","Motor winding insulation resistance test - within spec",                              "N/A",                                                                                         "R. Mehta",  BigDecimal.valueOf(0.0));

        log.info("Work orders seded: {} records", workOrderRepository.count());

    }

    private void wo( String id, String equipTag, String opened, String closed, String type, String description, String rootCause, String technician, BigDecimal downtimeHours) {
        if(workOrderRepository.findById(id).isPresent()) return;

        Equipment equipment = equipmentRepository.findById(equipTag).orElseThrow(() -> new RuntimeException("Equipment not found: " + equipTag));

        WorkOrder w = new WorkOrder();
        w.setWorkOrderId(id);
        w.setEquipment(equipment);
        w.setDateOpened(LocalDate.parse(opened));
        w.setDateClosed(LocalDate.parse(closed));
        w.setType(type);
        w.setDescription(description);
        w.setRootCause(rootCause);
        w.setTechnician(technician);
        w.setDowntimeHours(downtimeHours);

        workOrderRepository.save(w);
    }

    // DOCUMENTS - loaded from classpath:data/documents/*.txt 
    private void seedDocuments() throws Exception {
        
        if(documentRepository.count() > 0){
            log.info("Documents already seeded - skipping");
            return;
        }

        log.info("Seeding documents from classpath:data/documents/...");

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

        Resource[] resources = resolver.getResources("classpath:data/documents/*.txt");

        if(resources.length == 0) {
            log.warn("No .txt files found in classpath:data/documents/ - make sure you copied synthetic data files to " + "backend/src/main/resources/data/documents");
            return;
        }

        for(Resource resource : resources) {
            String filename = resource.getFilename();
            log.info("Ingestion document: {}", filename);

            String rawText;
            try(BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

                rawText = reader.lines().collect(Collectors.joining("\n"));

            }

            String sourcePath = "data/documents/" + filename;
            ingestionService.ingest(filename, rawText, sourcePath);
        }

        log.info("Documents seeded: {} records", documentRepository.count());

    }

}
