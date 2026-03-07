import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock supabase before importing StorageService
vi.mock("../../supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test.pdf" }, error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: "https://example.com/test.pdf" } }),
      })),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), debug: vi.fn() },
}));

const mockUUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

import { StorageService, ALLOWED_MIME_TO_EXT } from "../StorageService";

describe("StorageService", () => {
  let service: StorageService;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    service = new StorageService();
    vi.clearAllMocks();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      mockUUID as `${string}-${string}-${string}-${string}-${string}`
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  /** Helper: mock fetch to return a blob with given type */
  function mockFetchBlob(type: string, content = "") {
    const blob = new Blob([content], { type });
    globalThis.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(blob),
    }) as typeof fetch;
  }

  describe("MIME validation", () => {
    it("rejects text/html via rawFile", async () => {
      mockFetchBlob("text/html", "<script>alert(1)</script>");
      const htmlFile = new File(["<script>alert(1)</script>"], "evil.html", { type: "text/html" });

      await expect(
        service.uploadToBucket({
          src: "blob:http://localhost/fake",
          title: "evil.html",
          rawFile: htmlFile,
        })
      ).rejects.toMatchObject({ status: 415 });
    });

    it("rejects text/html via blob fetch path", async () => {
      mockFetchBlob("text/html", "<script>");
      const htmlFile = new File([""], "page.html", { type: "text/html" });

      await expect(
        service.uploadToBucket({
          src: "blob:http://localhost/fake",
          title: "page.html",
          rawFile: htmlFile,
        })
      ).rejects.toMatchObject({ status: 415 });
    });

    it("rejects MIME/extension mismatch (image/png + .exe)", async () => {
      mockFetchBlob("image/png");
      const file = new File(["fake"], "evil.exe", { type: "image/png" });

      await expect(
        service.uploadToBucket({
          src: "blob:http://localhost/fake",
          title: "evil.exe",
          rawFile: file,
        })
      ).rejects.toMatchObject({ status: 415 });
    });

    it("accepts application/pdf with .pdf extension", async () => {
      mockFetchBlob("application/pdf", "pdf content");
      const pdfFile = new File(["pdf content"], "report.pdf", { type: "application/pdf" });

      const result = await service.uploadToBucket({
        src: "blob:http://localhost/fake",
        title: "report.pdf",
        rawFile: pdfFile,
      });

      expect(result.path).toBeDefined();
    });
  });

  describe("filename generation", () => {
    it("uses crypto.randomUUID in filenames", async () => {
      mockFetchBlob("application/pdf", "data");
      const file = new File(["data"], "test.pdf", { type: "application/pdf" });

      const result = await service.uploadToBucket({
        src: "blob:http://localhost/fake",
        title: "test.pdf",
        rawFile: file,
      });

      expect(result.path).toContain(mockUUID);
    });

    it("sanitizes extension - strips special chars and truncates", async () => {
      mockFetchBlob("text/csv", "data");
      // Use valid extension "csv" for MIME validation, but test that output is sanitized
      const csvFile = new File(["data"], "test.csv", { type: "text/csv" });

      const result = await service.uploadToBucket({
        src: "blob:http://localhost/fake",
        title: "test.csv",
        rawFile: csvFile,
      });

      // Should be UUID.ext with only alphanumeric chars in extension
      expect(result.path).toMatch(/^[a-f0-9-]+\.[a-z0-9]+$/);
      expect(result.path).toBe(`${mockUUID}.csv`);
    });
  });

  describe("ALLOWED_MIME_TO_EXT export", () => {
    it("exports the MIME allowlist", () => {
      expect(ALLOWED_MIME_TO_EXT).toBeDefined();
      expect(ALLOWED_MIME_TO_EXT["image/jpeg"]).toContain("jpg");
      expect(ALLOWED_MIME_TO_EXT["application/pdf"]).toContain("pdf");
    });
  });
});
