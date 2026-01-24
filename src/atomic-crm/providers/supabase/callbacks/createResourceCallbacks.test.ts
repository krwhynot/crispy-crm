/**
 * Tests for createResourceCallbacks factory with transform composition
 *
 * TDD: Tests define expected behavior for:
 * 1. Transform composition (sequential execution)
 * 2. Backward compatibility (legacy parameters still work)
 * 3. Error handling (throw/log/ignore strategies)
 * 4. Soft delete configuration (legacy boolean + new config object)
 * 5. Read/Write/Delete transform pipelines
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import {
  createResourceCallbacks,
  type Transform,
  type TransformFn,
} from "./createResourceCallbacks";

describe("createResourceCallbacks - Transform Composition", () => {
  let mockDataProvider: DataProvider;

  beforeEach(() => {
    mockDataProvider = {
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };

    // Clear console.error for log tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("backward compatibility", () => {
    it("should work with legacy supportsSoftDelete boolean", async () => {
      const callbacks = createResourceCallbacks({
        resource: "products",
        supportsSoftDelete: true,
      });

      expect(callbacks.resource).toBe("products");
      expect(callbacks.beforeDelete).toBeDefined();
    });

    it("should work with legacy afterReadTransform", async () => {
      const transform = (record: RaRecord) => ({
        ...record,
        custom: "value",
      });

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        afterReadTransform: transform,
      });

      expect(callbacks.afterRead).toBeDefined();

      const record = { id: 1, name: "Test" };
      const result = await callbacks.afterRead!(record, mockDataProvider);

      expect(result).toEqual({ id: 1, name: "Test", custom: "value" });
    });

    it("should work with legacy computedFields", async () => {
      const callbacks = createResourceCallbacks({
        resource: "tasks",
        computedFields: ["assignee_name"],
      });

      const data = { id: 1, title: "Task", assignee_name: "John" };
      const result = await callbacks.beforeSave!(data, mockDataProvider, "tasks");

      expect(result).toEqual({ id: 1, title: "Task" });
      expect(result).not.toHaveProperty("assignee_name");
    });

    it("should work with legacy createDefaults", async () => {
      const callbacks = createResourceCallbacks({
        resource: "tasks",
        createDefaults: { status: "open", priority: 1 },
      });

      const data = { title: "New Task" };
      const result = await callbacks.beforeSave!(data, mockDataProvider, "tasks");

      expect(result).toEqual({
        status: "open",
        priority: 1,
        title: "New Task",
      });
    });
  });

  describe("read transforms", () => {
    it("should apply single read transform function", async () => {
      const transform: TransformFn = (record) => ({
        ...record,
        transformed: true,
      });

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        readTransforms: [transform],
      });

      const record = { id: 1, name: "Test" };
      const result = await callbacks.afterRead!(record, mockDataProvider);

      expect(result).toEqual({ id: 1, name: "Test", transformed: true });
    });

    it("should apply multiple read transforms in sequence", async () => {
      const transform1: TransformFn = (record) => ({
        ...record,
        step1: true,
      });

      const transform2: TransformFn = (record) => ({
        ...record,
        step2: true,
      });

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        readTransforms: [transform1, transform2],
      });

      const record = { id: 1, name: "Test" };
      const result = await callbacks.afterRead!(record, mockDataProvider);

      expect(result).toEqual({
        id: 1,
        name: "Test",
        step1: true,
        step2: true,
      });
    });

    it("should apply Transform objects with metadata", async () => {
      const normalizeTransform: Transform = {
        name: "normalize-emails",
        description: "Ensure email array exists",
        apply: (record) => ({
          ...record,
          email: record.email || [],
        }),
      };

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        readTransforms: [normalizeTransform],
      });

      const record = { id: 1, name: "Test" };
      const result = await callbacks.afterRead!(record, mockDataProvider);

      expect(result).toEqual({ id: 1, name: "Test", email: [] });
    });

    it("should compose read transforms with legacy afterReadTransform", async () => {
      const transform1: TransformFn = (record) => ({
        ...record,
        step1: true,
      });

      const legacy = (record: RaRecord) => ({
        ...record,
        legacy: true,
      });

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        readTransforms: [transform1],
        afterReadTransform: legacy,
      });

      const record = { id: 1, name: "Test" };
      const result = await callbacks.afterRead!(record, mockDataProvider);

      expect(result).toEqual({
        id: 1,
        name: "Test",
        step1: true,
        legacy: true,
      });
    });
  });

  describe("write transforms", () => {
    it("should apply single write transform function", async () => {
      const sanitize: TransformFn = (record) => ({
        ...record,
        name: (record.name as string).trim(),
      });

      const callbacks = createResourceCallbacks({
        resource: "products",
        writeTransforms: [sanitize],
      });

      const data = { name: "  Widget  " };
      const result = await callbacks.beforeSave!(data, mockDataProvider, "products");

      expect(result).toEqual({ name: "Widget" });
    });

    it("should apply multiple write transforms in sequence", async () => {
      const trim: TransformFn = (record) => ({
        ...record,
        name: (record.name as string).trim(),
      });

      const uppercase: TransformFn = (record) => ({
        ...record,
        name: (record.name as string).toUpperCase(),
      });

      const callbacks = createResourceCallbacks({
        resource: "products",
        writeTransforms: [trim, uppercase],
      });

      const data = { name: "  widget  " };
      const result = await callbacks.beforeSave!(data, mockDataProvider, "products");

      expect(result).toEqual({ name: "WIDGET" });
    });

    it("should apply write transforms before computed field stripping", async () => {
      const addDefault: TransformFn = (record) => ({
        ...record,
        status: record.status || "active",
      });

      const callbacks = createResourceCallbacks({
        resource: "products",
        writeTransforms: [addDefault],
        computedFields: ["computed_field"],
      });

      const data = { name: "Test", computed_field: "ignore" };
      const result = await callbacks.beforeSave!(data, mockDataProvider, "products");

      expect(result).toEqual({ name: "Test", status: "active" });
      expect(result).not.toHaveProperty("computed_field");
    });

    it("should apply write transforms before create defaults merge", async () => {
      const normalize: TransformFn = (record) => ({
        ...record,
        name: (record.name as string).toLowerCase(),
      });

      const callbacks = createResourceCallbacks({
        resource: "products",
        writeTransforms: [normalize],
        createDefaults: { status: "draft" },
      });

      const data = { name: "NEW PRODUCT" };
      const result = await callbacks.beforeSave!(data, mockDataProvider, "products");

      expect(result).toEqual({ name: "new product", status: "draft" });
    });
  });

  describe("delete transforms", () => {
    it("should apply delete transforms before soft delete", async () => {
      const audit: TransformFn = (record) => ({
        ...record,
        auditedAt: new Date().toISOString(),
      });

      const callbacks = createResourceCallbacks({
        resource: "activities",
        deleteTransforms: [audit],
        supportsSoftDelete: true,
      });

      const params = {
        id: 1,
        previousData: { id: 1, description: "Task" } as RaRecord,
      };

      await callbacks.beforeDelete!(params, mockDataProvider);

      // Should have called update with the transformed data
      const updateCall = vi.mocked(mockDataProvider.update).mock.calls[0];
      expect(updateCall).toBeDefined();
      expect(updateCall[1]).toHaveProperty("previousData");
    });

    it("should apply multiple delete transforms in sequence", async () => {
      const audit: TransformFn = (record) => ({
        ...record,
        deletedAt: new Date().toISOString(),
      });

      const logReason: TransformFn = (record) => ({
        ...record,
        deletionReason: "user-initiated",
      });

      const callbacks = createResourceCallbacks({
        resource: "activities",
        deleteTransforms: [audit, logReason],
        supportsSoftDelete: true,
      });

      const params = {
        id: 1,
        previousData: { id: 1, description: "Task" } as RaRecord,
      };

      await callbacks.beforeDelete!(params, mockDataProvider);

      // Verify delete was intercepted
      const updateCall = vi.mocked(mockDataProvider.update).mock.calls[0];
      expect(updateCall[0]).toBe("activities");
    });
  });

  describe("soft delete configuration", () => {
    it("should use softDeleteConfig over legacy supportsSoftDelete", async () => {
      const callbacks = createResourceCallbacks({
        resource: "products",
        supportsSoftDelete: true, // legacy
        softDeleteConfig: { enabled: false }, // new config overrides
      });

      // beforeDelete should not be defined
      expect(callbacks.beforeDelete).toBeUndefined();
    });

    it("should use custom soft delete field name", async () => {
      const callbacks = createResourceCallbacks({
        resource: "products",
        softDeleteConfig: {
          enabled: true,
          field: "deleted_at",
          filterOutDeleted: true,
          restoreValue: null,
        },
      });

      const params = {
        id: 1,
        previousData: { id: 1, name: "Product" } as RaRecord,
      };

      await callbacks.beforeDelete!(params, mockDataProvider);

      const updateCall = vi.mocked(mockDataProvider.update).mock.calls[0];
      expect(updateCall[1].data).toHaveProperty("deleted_at");
    });

    it("should use custom soft delete filter field", async () => {
      const callbacks = createResourceCallbacks({
        resource: "products",
        softDeleteConfig: {
          enabled: true,
          field: "deleted_at",
          filterOutDeleted: true,
          restoreValue: null,
        },
      });

      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" as const },
        filter: {},
      };

      const result = await callbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });
  });

  describe("error handling", () => {
    it("should log errors by default", async () => {
      const errorTransform: TransformFn = () => {
        throw new Error("Transform failed");
      };

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        readTransforms: [errorTransform],
        onTransformError: "log",
      });

      const record = { id: 1 };
      expect(async () => {
        await callbacks.afterRead!(record, mockDataProvider);
      }).not.toThrow();

      // console.error should have been called
      expect(console.error).toHaveBeenCalled();
    });

    it("should throw errors when onTransformError is throw", async () => {
      const errorTransform: TransformFn = () => {
        throw new Error("Transform failed");
      };

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        readTransforms: [errorTransform],
        onTransformError: "throw",
      });

      const record = { id: 1 };
      await expect(callbacks.afterRead!(record, mockDataProvider)).rejects.toThrow();
    });

    it("should include transform name in error message for Transform objects", async () => {
      const errorTransform: Transform = {
        name: "my-transform",
        description: "Test transform",
        apply: () => {
          throw new Error("Failed");
        },
      };

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        readTransforms: [errorTransform],
        onTransformError: "log",
      });

      const record = { id: 1 };
      await callbacks.afterRead!(record, mockDataProvider);

      const errorCall = vi.mocked(console.error).mock.calls[0];
      expect(errorCall[0]).toContain("my-transform");
    });
  });

  describe("composition strategy", () => {
    it("should use sequential composition by default", async () => {
      const transform1: TransformFn = (record) => ({
        ...record,
        step: 1,
      });

      const transform2: TransformFn = (record) => ({
        ...record,
        step: (record.step as number) + 1,
      });

      const callbacks = createResourceCallbacks({
        resource: "contacts",
        readTransforms: [transform1, transform2],
        // compositionStrategy defaults to "sequential"
      });

      const record = { id: 1 };
      const result = await callbacks.afterRead!(record, mockDataProvider);

      // If sequential: 1 → 2. If parallel: would be 2 (transform2 overwrites)
      expect(result.step).toBe(2);
    });

    it("should throw for unsupported composition strategies", () => {
      expect(() => {
        createResourceCallbacks({
          resource: "contacts",
          readTransforms: [(r) => r],
          compositionStrategy: "parallel" as unknown as "sequential",
        });
      }).toThrow("Transform composition strategy");
    });
  });

  describe("mixed scenarios", () => {
    it("should compose all transform types together", async () => {
      const readTransform: TransformFn = (record) => ({
        ...record,
        read: true,
      });

      const writeTransform: TransformFn = (record) => ({
        ...record,
        clean: true,
      });

      const callbacks = createResourceCallbacks({
        resource: "products",
        readTransforms: [readTransform],
        writeTransforms: [writeTransform],
        computedFields: ["computed"],
        createDefaults: { status: "new" },
        supportsSoftDelete: true,
      });

      // Test read
      const readRecord = { id: 1 };
      const readResult = await callbacks.afterRead!(readRecord, mockDataProvider);
      expect(readResult).toHaveProperty("read", true);

      // Test write
      const writeData = { title: "Test", computed: "ignore" };
      const writeResult = await callbacks.beforeSave!(writeData, mockDataProvider, "products");
      expect(writeResult).toHaveProperty("clean", true);
      expect(writeResult).toHaveProperty("status", "new");
      expect(writeResult).not.toHaveProperty("computed");

      // Test delete
      expect(callbacks.beforeDelete).toBeDefined();
      expect(callbacks.beforeGetList).toBeDefined();
    });

    it("should handle empty transform arrays with legacy afterReadTransform", async () => {
      const legacy = (record: RaRecord) => ({
        ...record,
        processed: true,
      });

      const callbacks = createResourceCallbacks({
        resource: "products",
        readTransforms: [],
        writeTransforms: [],
        deleteTransforms: [],
        afterReadTransform: legacy,
      });

      const record = { id: 1, name: "Test" };
      const result = await callbacks.afterRead!(record, mockDataProvider);

      expect(result).toEqual({ id: 1, name: "Test", processed: true });
    });

    it("should not create afterRead/beforeSave if no transforms configured", () => {
      const callbacks = createResourceCallbacks({
        resource: "products",
        readTransforms: [],
        writeTransforms: [],
        deleteTransforms: [],
        computedFields: [], // Empty
        createDefaults: {}, // Empty
      });

      // No afterRead since no transforms and no afterReadTransform
      expect(callbacks.afterRead).toBeUndefined();
      // No beforeSave since no writeTransforms, no computedFields, no createDefaults
      expect(callbacks.beforeSave).toBeUndefined();
    });
  });
});
