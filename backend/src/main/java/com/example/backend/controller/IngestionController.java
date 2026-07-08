package com.example.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.Document;
import com.example.backend.service.IngestionService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class IngestionController {

    private final IngestionService ingestionService;

    public IngestionController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    // POST /api/ingest
    @PostMapping("/ingest")
    public ResponseEntity<?> ingest(@RequestParam("file") MultipartFile file) {

        if(file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }

        String filename = file.getOriginalFilename();
        String ext = filename != null && filename.contains(".") ? filename.substring(filename.lastIndexOf(".")).toLowerCase() : "";

        if(!ext.equals(".txt") && !ext.equals(".csv") && !ext.equals(".pdf")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file type. Accepted: .txt, .csv, .pdf"));
        }

        try {
            String sourcePath = "uploads/" + filename;
            Document doc = ingestionService.ingest(file, sourcePath);

            return ResponseEntity.ok(Map.of(
                "id", doc.getId(),
                "filename", doc.getFilename(),
                "docType", doc.getDocType(),
                "uploadedAt", doc.getUploadedAt().toString(),
                "message", "Ingestion successful"
            ));
        }
        catch (UnsupportedOperationException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Ingestion failed: " + e.getMessage()));
        }

    }

}
