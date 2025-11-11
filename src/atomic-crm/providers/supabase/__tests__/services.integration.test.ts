import { describe, it, expect } from "vitest";
import {
  validationService,
  transformService,
  storageService,
  resourceUsesValidation,
  resourceUsesTransformers,
} from "../unifiedDataProvider";

describe("Service Integration Tests", () => {
  describe("ValidationService Integration", () => {
    it("should be properly wired in unifiedDataProvider", () => {
      expect(validationService).toBeDefined();
      expect(validationService.hasValidation("contacts")).toBe(true);
      expect(validationService.hasValidation("organizations")).toBe(true);
      expect(validationService.hasValidation("opportunities")).toBe(true);
      expect(validationService.hasValidation("unknown")).toBe(false);
    });

    it("resourceUsesValidation should use validationService", () => {
      expect(resourceUsesValidation("contacts")).toBe(true);
      expect(resourceUsesValidation("organizations")).toBe(true);
      expect(resourceUsesValidation("unknown")).toBe(false);
    });
  });

  describe("TransformService Integration", () => {
    it("should be properly wired in unifiedDataProvider", () => {
      expect(transformService).toBeDefined();
      expect(transformService.hasTransform("contacts")).toBe(true);
      expect(transformService.hasTransform("organizations")).toBe(true);
      expect(transformService.hasTransform("contactNotes")).toBe(true);
      expect(transformService.hasTransform("unknown")).toBe(false);
    });

    it("resourceUsesTransformers should use transformService", () => {
      expect(resourceUsesTransformers("contacts")).toBe(true);
      expect(resourceUsesTransformers("organizations")).toBe(true);
      expect(resourceUsesTransformers("unknown")).toBe(false);
    });
  });

  describe("StorageService Integration", () => {
    it("should be properly wired and accessible", () => {
      expect(storageService).toBeDefined();
      expect(storageService.uploadToBucket).toBeDefined();
      expect(typeof storageService.uploadToBucket).toBe("function");
    });
  });
});
