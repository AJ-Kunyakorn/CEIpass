package com.chiangraipass.api.catalog;

import java.util.List;

import com.chiangraipass.config.CorsConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CatalogController.class)
@Import(CorsConfiguration.class)
class CatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CatalogRepository catalogRepository;

    @Test
    void returnsAvailablePassesWithIntegerMinorUnitPrices() throws Exception {
        given(catalogRepository.findPublishedPasses()).willReturn(List.of(
                new PassCatalogItem(
                        "day-pass",
                        "Day Pass",
                        "Valid for one day",
                        29900,
                        "THB",
                        "1 day",
                        false)));

        mockMvc.perform(get("/api/v1/catalog/passes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("day-pass"))
                .andExpect(jsonPath("$[0].priceMinorUnits").value(29900))
                .andExpect(jsonPath("$[0].currency").value("THB"))
                .andExpect(jsonPath("$[0].available").value(false));
    }

    @Test
    void returnsPublishedAttractionsWithPartnerEligibility() throws Exception {
        given(catalogRepository.findPublishedAttractions()).willReturn(List.of(
                new AttractionCatalogItem(
                        "partner-1",
                        "Published Partner",
                        "Chiang Rai",
                        "Museum",
                        null,
                        null,
                        true)));

        mockMvc.perform(get("/api/v1/catalog/attractions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].partnerId").value("partner-1"))
                .andExpect(jsonPath("$[0].name").value("Published Partner"))
                .andExpect(jsonPath("$[0].eligibleForPass").value(true));
    }
}
