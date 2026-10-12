package com.chiangraipass.api.catalog;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CatalogRepository {

    private final JdbcTemplate jdbcTemplate;

    public CatalogRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PassCatalogItem> findPublishedPasses() {
        return jdbcTemplate.query("""
                SELECT pass_id, display_name, description, price_minor_units,
                       currency, validity_description, is_available
                FROM app.pass_catalog
                WHERE is_published = 1
                ORDER BY display_order, pass_id
                """,
                (result, rowNumber) -> new PassCatalogItem(
                        result.getString("pass_id"),
                        result.getString("display_name"),
                        result.getString("description"),
                        result.getLong("price_minor_units"),
                        result.getString("currency"),
                        result.getString("validity_description"),
                        result.getBoolean("is_available")));
    }

    public List<AttractionCatalogItem> findPublishedAttractions() {
        return jdbcTemplate.query("""
                SELECT partner_id, public_name, location, category, image_url,
                       accessibility_information, is_pass_eligible
                FROM app.attraction_catalog
                WHERE is_published = 1
                ORDER BY display_order, partner_id
                """,
                (result, rowNumber) -> new AttractionCatalogItem(
                        result.getString("partner_id"),
                        result.getString("public_name"),
                        result.getString("location"),
                        result.getString("category"),
                        result.getString("image_url"),
                        result.getString("accessibility_information"),
                        result.getBoolean("is_pass_eligible")));
    }
}
