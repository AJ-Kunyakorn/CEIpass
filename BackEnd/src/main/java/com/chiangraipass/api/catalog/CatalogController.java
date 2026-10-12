package com.chiangraipass.api.catalog;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {

    private final CatalogRepository catalogRepository;

    public CatalogController(CatalogRepository catalogRepository) {
        this.catalogRepository = catalogRepository;
    }

    @GetMapping("/passes")
    public List<PassCatalogItem> passes() {
        return catalogRepository.findPublishedPasses();
    }

    @GetMapping("/attractions")
    public List<AttractionCatalogItem> attractions() {
        return catalogRepository.findPublishedAttractions();
    }
}
