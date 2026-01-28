/**
 * Tests for .max() constraints on RPC validation schemas
 * Focus: DoS prevention via unbounded strings in response schemas
 */

import { describe, it, expect } from "vitest";
import {
  getCampaignReportStatsResponseSchema,
  staleOpportunityRecordSchema,
  checkSimilarOpportunitiesResponseSchema,
} from "../rpc";
import { z } from "zod";

describe("RPC Response .max() Constraints", () => {
  describe("getCampaignReportStatsResponseSchema - activity_type_counts keys", () => {
    it("should accept activity_type_counts with keys at max length (50 chars)", () => {
      const validResponse = {
        campaign_options: [],
        sales_rep_options: [],
        activity_type_counts: {
          ["a".repeat(50)]: 10,
        },
      };
      expect(() => getCampaignReportStatsResponseSchema.parse(validResponse)).not.toThrow();
    });

    it("should reject activity_type_counts with key over max length (51 chars)", () => {
      const invalidResponse = {
        campaign_options: [],
        sales_rep_options: [],
        activity_type_counts: {
          ["a".repeat(51)]: 10,
        },
      };
      expect(() => getCampaignReportStatsResponseSchema.parse(invalidResponse)).toThrow(z.ZodError);
    });
  });

  describe("staleOpportunityRecordSchema - string fields", () => {
    it("should accept all string fields at max length", () => {
      const validRecord = {
        id: 1,
        name: "a".repeat(500),
        stage: "a".repeat(50),
        customer_organization_name: "a".repeat(255),
        last_activity_date: "2024-01-01T00:00:00Z",
        days_inactive: 30,
        stage_threshold: 14,
        is_stale: true,
      };
      expect(() => staleOpportunityRecordSchema.parse(validRecord)).not.toThrow();
    });

    it("should reject name over max length (501 chars)", () => {
      const invalidRecord = {
        id: 1,
        name: "a".repeat(501),
        stage: "new_lead",
        customer_organization_name: null,
        last_activity_date: null,
        days_inactive: 0,
        stage_threshold: 14,
        is_stale: false,
      };
      expect(() => staleOpportunityRecordSchema.parse(invalidRecord)).toThrow(z.ZodError);
    });

    it("should reject stage over max length (51 chars)", () => {
      const invalidRecord = {
        id: 1,
        name: "Test Opportunity",
        stage: "a".repeat(51),
        customer_organization_name: null,
        last_activity_date: null,
        days_inactive: 0,
        stage_threshold: 14,
        is_stale: false,
      };
      expect(() => staleOpportunityRecordSchema.parse(invalidRecord)).toThrow(z.ZodError);
    });

    it("should reject customer_organization_name over max length (256 chars)", () => {
      const invalidRecord = {
        id: 1,
        name: "Test Opportunity",
        stage: "new_lead",
        customer_organization_name: "a".repeat(256),
        last_activity_date: null,
        days_inactive: 0,
        stage_threshold: 14,
        is_stale: false,
      };
      expect(() => staleOpportunityRecordSchema.parse(invalidRecord)).toThrow(z.ZodError);
    });
  });

  describe("checkSimilarOpportunitiesResponseSchema - string fields", () => {
    it("should accept opportunity name at max length (500 chars)", () => {
      const validResponse = [
        {
          id: 1,
          name: "a".repeat(500),
          stage: "new_lead",
          similarity_score: 0.85,
          principal_organization_name: null,
          customer_organization_name: null,
        },
      ];
      expect(() => checkSimilarOpportunitiesResponseSchema.parse(validResponse)).not.toThrow();
    });

    it("should reject opportunity name over max length (501 chars)", () => {
      const invalidResponse = [
        {
          id: 1,
          name: "a".repeat(501),
          stage: "new_lead",
          similarity_score: 0.85,
          principal_organization_name: null,
          customer_organization_name: null,
        },
      ];
      expect(() => checkSimilarOpportunitiesResponseSchema.parse(invalidResponse)).toThrow(
        z.ZodError
      );
    });

    it("should reject stage over max length (51 chars)", () => {
      const invalidResponse = [
        {
          id: 1,
          name: "Test Opportunity",
          stage: "a".repeat(51),
          similarity_score: 0.85,
          principal_organization_name: null,
          customer_organization_name: null,
        },
      ];
      expect(() => checkSimilarOpportunitiesResponseSchema.parse(invalidResponse)).toThrow(
        z.ZodError
      );
    });

    it("should reject principal_organization_name over max length (256 chars)", () => {
      const invalidResponse = [
        {
          id: 1,
          name: "Test Opportunity",
          stage: "new_lead",
          similarity_score: 0.85,
          principal_organization_name: "a".repeat(256),
          customer_organization_name: null,
        },
      ];
      expect(() => checkSimilarOpportunitiesResponseSchema.parse(invalidResponse)).toThrow(
        z.ZodError
      );
    });

    it("should reject customer_organization_name over max length (256 chars)", () => {
      const invalidResponse = [
        {
          id: 1,
          name: "Test Opportunity",
          stage: "new_lead",
          similarity_score: 0.85,
          principal_organization_name: null,
          customer_organization_name: "a".repeat(256),
        },
      ];
      expect(() => checkSimilarOpportunitiesResponseSchema.parse(invalidResponse)).toThrow(
        z.ZodError
      );
    });
  });
});
