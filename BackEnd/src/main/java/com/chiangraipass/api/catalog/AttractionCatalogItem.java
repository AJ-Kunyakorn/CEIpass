package com.chiangraipass.api.catalog;

public record AttractionCatalogItem(
        String partnerId,
        String name,
        String location,
        String category,
        String imageUrl,
        String accessibilityInformation,
        boolean eligibleForPass) {
}
