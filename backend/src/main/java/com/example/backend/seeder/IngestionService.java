package com.example.backend.seeder;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.Document;
import com.example.backend.repository.DocumentChunkRepository;
import com.example.backend.repository.DocumentRepository;
import com.example.backend.repository.EntityMentionRepository;
import com.example.backend.repository.EquipmentRepository;

@Service
public class IngestionService {

    private static final Logger log = LoggerFactory.getLogger(IngestionService.class);

    //--------Chunk Configuration-----------------
    private static final int CHUNK_SIZE_WORDS = 400;
    private static final int CHUNK_OVERLAP_WORDS = 80;

    //---------Known Equipment Tags - used for entity extraction----------------------
    private static final List<String> EQUIPMENT_TAGS = List.of(
        "P-204", "P-101",
        "C-301", 
        "V-12", "V-22",
        "HX-205",
        "T-410",
        "M-115"
    );

    // Pre-compiled patterns : matches any known tag as a whole word
    private static final Pattern EQUIPMENT_PATTERN = Pattern.compile(
        EQUIPMENT_TAGS.stream()
        .map(Pattern::quote)
        .collect(Collectors.joining("|")),
        Pattern.CASE_INSENSITIVE
    );

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final EquipmentRepository equipmentRepository;
    private final EntityMentionRepository entityMentionRepository;

    public IngestionService(DocumentRepository documentRepository, DocumentChunkRepository chunkRepository, EquipmentRepository equipmentRepository, EntityMentionRepository entityMentionRepository){
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.equipmentRepository = equipmentRepository;
        this.entityMentionRepository = entityMentionRepository;
    }

    // PUBLIC API

    

    // STEP 1 - TEXT EXTRACTION
    private String extractText(MultipartFile file) throws IOException {

        String filename = file.getOriginalFilename() != null
        ? file.getOriginalFilename().toLowerCase()
        : "";

        if (filename.endsWith(".pdf")) {
            // TODO: wire in Apache Tika or PDFBox when ready
            throw new UnsupportedOperationException("PDF extraction not yet wired. Add Apache Tika dependency and implement.");
        }

        // .txt and .csv - plain UTF-8 read
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }

    }

    // STEP 2 - DOCUMENT TYPE DETECTION


}
