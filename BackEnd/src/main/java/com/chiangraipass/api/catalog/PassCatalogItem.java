package com.chiangraipass.api.catalog;

public record PassCatalogItem(
        String id,
        String displayName,
        String description,
        long priceMinorUnits,
        String currency,
        String validityDescription,
        boolean available) {
}
