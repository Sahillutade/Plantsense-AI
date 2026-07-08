package com.example.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.EntityMention;
import com.example.backend.model.WorkOrder;
import com.example.backend.repository.DocumentRepository;
import com.example.backend.repository.EntityMentionRepository;
import com.example.backend.repository.WorkOrderRepository;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final WorkOrderRepository workOrderRepository;
    private final EntityMentionRepository entityMentionRepository;

    public DocumentController(DocumentRepository documentRepository, WorkOrderRepository workOrderRepository,
            EntityMentionRepository entityMentionRepository) {
        this.documentRepository = documentRepository;
        this.workOrderRepository = workOrderRepository;
        this.entityMentionRepository = entityMentionRepository;
    }

    // GET /api/documents
    // Returns lightweight document list for corpus sidebar.
    // Does NOT include raw_text — frontend doesn't need full content here.
    @GetMapping("/documents")
    public ResponseEntity<?> listDocuments() {

        List<Map<String, Object>> docs = documentRepository.findAll()
        .stream()
        .map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("filename", d.getFilename());
            m.put("docType", d.getDocType());
            m.put("uploadAt", d.getUploadedAt().toString());
            return m;
        })
        .toList();

        return ResponseEntity.ok(docs);

    }

    // GET /api/documents/stats
    // Returns counts shown in the top summary strip:
    // "4 documents indexed  2 assets tracked  1 open flag"
    @GetMapping("/documents/stats")
    public ResponseEntity<?> stats() {

        long docCount = documentRepository.count();
        long equipCount = workOrderRepository.findAll()
        .stream()
        .map(w -> w.getEquipment().getEquipmentTag())
        .distinct().count();

        // "Open flags" = corrective work orders with no root cause resolved
        // Simple heuristic: corrective WOs with root_cause = "N/A" or null
        long openFlags = workOrderRepository.findAll()
        .stream()
        .filter(w -> "Corrective".equals(w.getType()) && (w.getRootCause() == null || w.getRootCause().equals("N/A")))
        .count();

        return ResponseEntity.ok(Map.of(
            "documentsIndexed", docCount,
            "assetsTracked", equipCount,
            "openFlags", openFlags
        ));

    }

    // GET /api/equipment/{tag}
    // Returns asset context panel data for a detected equipment tag.
    // Called by frontend when a query response mentions an equipment tag.
    @GetMapping("/equipment/{tag}")
    public ResponseEntity<?> equipmentDetail(@PathVariable String tag) {

        List<WorkOrder> orders = workOrderRepository.findByEquipmentEquipmentTagOrderByDateOpenedDesc(tag);

        if(orders.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "equipmentTag", tag,
                "message", "No work order history found for " + tag
            ));
        }

        // Last failure — most recent corrective WO
        WorkOrder lastFailure =orders.stream()
        .filter(w -> "Corrective".equals(w.getType()))
        .findFirst()
        .orElse(null);

        // Similar incidents count — all corrective WOs
        long correctiveCount = orders.stream()
        .filter(w -> "Corrective".equals(w.getType()))
        .count();

        // Next inspection — most recent inspection WO date + 6 months (simple heuristic)
        WorkOrder lastInspection = orders.stream()
        .filter(w -> "Inspection".equals(w.getType()))
        .findFirst()
        .orElse(null);

        String nextInspection = lastInspection != null
        ? lastInspection.getDateClosed().plusMonths(6).toString()
        : "Not scheduled";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("equipmentTag", tag);
        result.put("totalWorkOrders", orders.size());
        result.put("correctiveCount", correctiveCount);
        result.put("nextInspection", nextInspection);

        if (lastFailure != null) {
            result.put("lastFailure", Map.of(
                "workOrderId", lastFailure.getWorkOrderId(),
                "date", lastFailure.getDateOpened().toString(),
                "description", lastFailure.getDescription(),
                "rootCause", lastFailure.getRootCause() != null
                ? lastFailure.getRootCause() : "N/A",
                "downtimeHours", lastFailure.getDowntimeHours()
            ));
        }

        return ResponseEntity.ok(result);

    }

    // GET /api/equipment/{tag}/docs
    // Returns all documents that mention this equipment tag.
    // Powers "related documents" list in the asset context panel.
    @GetMapping("/equipment/{tag}/docs")
    public ResponseEntity<?> equipmentDocs(@PathVariable String tag) {

        List<EntityMention> mentions = entityMentionRepository.findByEquipmentEquipmentTag(tag);

        List<Map<String, Object>> docs = mentions.stream()
        .map(m -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("documentId", m.getDocument().getId());
            entry.put("filename", m.getDocument().getFilename());
            entry.put("docType", m.getDocument().getDocType());
            entry.put("excerpt", m.getMentionContext());
            return entry;
        })
        .toList();

        return ResponseEntity.ok(docs);

    }

}
