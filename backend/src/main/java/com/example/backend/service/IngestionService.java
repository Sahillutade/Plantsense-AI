package com.example.backend.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.Document;
import com.example.backend.model.DocumentChunk;
import com.example.backend.model.EntityMention;
import com.example.backend.model.Equipment;
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
    @Transactional
    public Document ingest(MultipartFile file, String sourcePath) throws IOException {

        String filename = file.getOriginalFilename();
        log.info("Starting ingestion: {}", filename);

        String rawText = extractText(file);
        String docType = detectDocType(filename);

        Document doc = saveDocument(filename, docType, rawText, sourcePath);
        List<DocumentChunk> chunks = chunkAndSave(doc, rawText);
        extractAndSaveEntityMentions(doc, rawText);

        log.info("Ingested '{}' -> {} chunks, docType={}", filename, chunks.size(), docType);
        return doc;

    }

    @Transactional
    public Document ingest(String filename, String rawText, String sourcePath) {

        log.info("Starting ingestion (text): {}", filename);
 
        String docType = detectDocType(filename);
        Document doc   = saveDocument(filename, docType, rawText, sourcePath);
        chunkAndSave(doc, rawText);
        extractAndSaveEntityMentions(doc, rawText);
 
        log.info("Ingested '{}' → docType={}", filename, docType);
        return doc;

    }
    

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
    private String detectDocType(String filename) {

        if(filename == null) return "UNKNOWN";
        String f = filename.toUpperCase();

        if(f.startsWith("SOP_")) return "SOP";
        if(f.startsWith("INCIDENT_")) return "INCIDENT";
        if(f.startsWith("INSPECTION_")) return "INSPECTION";
        if(f.startsWith("COMPLIANCE_")) return "COMPLIANCE";
        if(f.startsWith("OEM_")) return "OEM_MANUAL";
        if(f.startsWith("WORK_ORDER")
            || f.endsWith("WORK_ORDERS.CSV")) return "WORK_ORDER";
        if (f.equals("EQUIPMENT.CSV")) return "EQUIPMENT";
        
        return "UNKNOWN";

    }

    // STEP 3 - PERSIST DOCUMENT
    private Document saveDocument(String filename, String docType, String rawText, String sourcePath) {

        Document doc = new Document();
        doc.setFilename(filename);
        doc.setDocType(docType);
        doc.setRawText(rawText);
        doc.setSourcePath(sourcePath);

        return documentRepository.save(doc);

    }

    // STEP 4 - CHUNKING
    private List<DocumentChunk> chunkAndSave(Document doc, String rawText) {

        String[] words = rawText.split("\\s+");
        int stepSize = CHUNK_SIZE_WORDS - CHUNK_OVERLAP_WORDS;
        List<DocumentChunk> saved = new ArrayList<>();
        int chunkIndex = 0;

        for(int start = 0; start<words.length; start += stepSize) {
            int end = Math.min(start + CHUNK_SIZE_WORDS, words.length);
            String chunkText = String.join(" ", Arrays.copyOfRange(words, start, end));

            DocumentChunk chunk = new DocumentChunk();
            chunk.setDocument(doc);
            chunk.setChunkText(chunkText);
            chunk.setChunkIndex(chunkIndex++);

            saved.add(chunkRepository.save(chunk));

            if(end == words.length) break;
        }

        return saved;

    }

    // STEP 5 - ENTITY MENTION EXTRACTION
    private void extractAndSaveEntityMentions(Document doc, String rawText) {

        Matcher matcher = EQUIPMENT_PATTERN.matcher(rawText);

        Set<String> savedTags = new HashSet<>();

        while (matcher.find()) {
            String tag = matcher.group().toUpperCase();
            if(savedTags.contains(tag)) continue;

            Optional<Equipment> equipOpt = equipmentRepository.findById(tag);

            if(equipOpt.isEmpty()) {
                log.warn("Equipment tag '{}' found in document but not in equipment table - skipping", tag);
                continue;
            }

            int start = Math.max(0, matcher.start() - 60);
            int end = Math.min(rawText.length(), matcher.end() + 60);
            String ctx = "..." + rawText.substring(start, end).trim() + "...";

            EntityMention mention = new EntityMention();
            mention.setDocument(doc);
            mention.setEquipment(equipOpt.get());
            mention.setMentionContext(ctx);

            try {
                entityMentionRepository.save(mention);
                savedTags.add(tag);
                log.debug("EntityMention saved: doc={} tag={}", doc.getFilename(), tag);
            }
            catch (Exception e){
                log.warn("Kipping duplicate EntityMention: doc={} tag={}", doc.getFilename(), tag);
            }
        }

    }

}
