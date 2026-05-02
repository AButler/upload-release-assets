import { describe, it, expect, vi, beforeEach } from "vitest";
import { run } from "../src/run.ts";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const {
  mockGetInput,
  mockSetFailed,
  mockDebug,
  mockGetReleaseByTag,
  mockGetRelease,
  mockListReleaseAssets,
  mockDeleteReleaseAsset,
  mockUploadReleaseAsset,
  mockGetOctokit,
  mockContext,
  mockFg,
  mockReadFile,
  mockStat,
  mockMimeLookup,
} = vi.hoisted(() => {
  const mockGetReleaseByTag = vi.fn();
  const mockGetRelease = vi.fn();
  const mockListReleaseAssets = vi.fn();
  const mockDeleteReleaseAsset = vi.fn();
  const mockUploadReleaseAsset = vi.fn();

  const mockOctokit = {
    rest: {
      repos: {
        getReleaseByTag: mockGetReleaseByTag,
        getRelease: mockGetRelease,
        listReleaseAssets: mockListReleaseAssets,
        deleteReleaseAsset: mockDeleteReleaseAsset,
        uploadReleaseAsset: mockUploadReleaseAsset,
      },
    },
  };

  return {
    mockGetInput: vi.fn(),
    mockSetFailed: vi.fn(),
    mockDebug: vi.fn(),
    mockGetReleaseByTag,
    mockGetRelease,
    mockListReleaseAssets,
    mockDeleteReleaseAsset,
    mockUploadReleaseAsset,
    mockGetOctokit: vi.fn(() => mockOctokit),
    mockContext: {
      repo: { owner: "test-owner", repo: "test-repo" },
      payload: { release: { id: 99 } },
    },
    mockFg: vi.fn(),
    mockReadFile: vi.fn(() => Promise.resolve(Buffer.from("file-content"))),
    mockStat: vi.fn(() => Promise.resolve({ size: 12 })),
    mockMimeLookup: vi.fn(() => "text/plain"),
  };
});

vi.mock("@actions/core", () => ({
  getInput: mockGetInput,
  setFailed: mockSetFailed,
  debug: mockDebug,
}));

vi.mock("@actions/github", () => ({
  getOctokit: mockGetOctokit,
  context: mockContext,
}));

vi.mock("fast-glob", () => ({ default: mockFg }));

vi.mock("fs/promises", () => ({
  readFile: mockReadFile,
  stat: mockStat,
}));

vi.mock("mime-types", () => ({
  default: {
    lookup: mockMimeLookup,
  },
}));

// ── Test helpers ──────────────────────────────────────────────────────────────

function setupInputs(
  files: string,
  releaseId = "",
  releaseTag = "",
  token = "test-token",
) {
  mockGetInput.mockImplementation((name: string) => {
    if (name === "files") return files;
    if (name === "release-id") return releaseId;
    if (name === "release-tag") return releaseTag;
    if (name === "repo-token") return token;
    return "";
  });
}

function setupRelease(releaseId: number, uploadUrl = "https://upload.url/") {
  mockGetRelease.mockResolvedValue({
    data: { upload_url: uploadUrl, html_url: "https://github.com/release/1" },
  });
  mockListReleaseAssets.mockResolvedValue({ data: [] });
  mockUploadReleaseAsset.mockResolvedValue({});
  return releaseId;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("upload-release-assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.payload = { release: { id: 99 } };
  });

  it("resolves release ID from explicit release-id input", async () => {
    setupInputs("*.txt", "42");
    setupRelease(42);
    mockFg.mockResolvedValue(["file.txt"]);

    await run();

    expect(mockSetFailed).not.toHaveBeenCalled();
    expect(mockGetRelease).toHaveBeenCalledWith(
      expect.objectContaining({ release_id: 42 }),
    );
    expect(mockUploadReleaseAsset).toHaveBeenCalledTimes(1);
  });

  it("resolves release ID via release-tag input", async () => {
    setupInputs("*.txt", "", "v1.0.0");
    mockGetReleaseByTag.mockResolvedValue({ data: { id: 55 } });
    setupRelease(55);
    mockFg.mockResolvedValue(["file.txt"]);

    await run();

    expect(mockSetFailed).not.toHaveBeenCalled();
    expect(mockGetReleaseByTag).toHaveBeenCalledWith(
      expect.objectContaining({ tag: "v1.0.0" }),
    );
    expect(mockGetRelease).toHaveBeenCalledWith(
      expect.objectContaining({ release_id: 55 }),
    );
    expect(mockUploadReleaseAsset).toHaveBeenCalledTimes(1);
  });

  it("resolves release ID from github.context.payload.release.id", async () => {
    setupInputs("*.txt");
    mockContext.payload = { release: { id: 99 } };
    setupRelease(99);
    mockFg.mockResolvedValue(["file.txt"]);

    await run();

    expect(mockSetFailed).not.toHaveBeenCalled();
    expect(mockGetRelease).toHaveBeenCalledWith(
      expect.objectContaining({ release_id: 99 }),
    );
    expect(mockUploadReleaseAsset).toHaveBeenCalledTimes(1);
  });

  it("calls setFailed when release tag is not found", async () => {
    setupInputs("*.txt", "", "v9.9.9");
    mockGetReleaseByTag.mockRejectedValue(new Error("Not Found"));

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith(
      expect.stringContaining("Could not get release id for tag v9.9.9"),
    );
    expect(mockUploadReleaseAsset).not.toHaveBeenCalled();
  });

  it("calls setFailed when no files match the glob", async () => {
    setupInputs("*.xyz", "42");
    setupRelease(42);
    mockFg.mockResolvedValue([]);

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith("No files found");
    expect(mockUploadReleaseAsset).not.toHaveBeenCalled();
  });

  it("calls setFailed when no release context is available", async () => {
    setupInputs("*.txt");
    mockContext.payload = { release: null };

    await run();

    expect(mockSetFailed).toHaveBeenCalled();
    expect(mockUploadReleaseAsset).not.toHaveBeenCalled();
  });

  it("deletes an existing asset with the same name before uploading", async () => {
    setupInputs("*.txt", "42");
    mockGetRelease.mockResolvedValue({
      data: {
        upload_url: "https://upload.url/",
        html_url: "https://github.com/release/1",
      },
    });
    mockListReleaseAssets.mockResolvedValue({
      data: [{ name: "file.txt", id: 777 }],
    });
    mockUploadReleaseAsset.mockResolvedValue({});
    mockFg.mockResolvedValue(["file.txt"]);

    await run();

    expect(mockDeleteReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({ asset_id: 777 }),
    );
    expect(mockUploadReleaseAsset).toHaveBeenCalledTimes(1);
  });

  it("uploads multiple files", async () => {
    setupInputs("*.txt", "42");
    setupRelease(42);
    mockFg.mockResolvedValue(["a.txt", "b.txt", "c.txt"]);

    await run();

    expect(mockSetFailed).not.toHaveBeenCalled();
    expect(mockUploadReleaseAsset).toHaveBeenCalledTimes(3);
  });

  it("splits files input by semicolon and passes all globs to fast-glob", async () => {
    setupInputs("*.txt;*.md", "42");
    setupRelease(42);
    mockFg.mockResolvedValue(["readme.md", "file.txt"]);

    await run();

    expect(mockFg).toHaveBeenCalledWith(["*.txt", "*.md"]);
    expect(mockUploadReleaseAsset).toHaveBeenCalledTimes(2);
  });

  it("filters out empty and whitespace-only patterns from the files input", async () => {
    setupInputs("*.txt;  ;*.md;;  ", "42");
    setupRelease(42);
    mockFg.mockResolvedValue(["file.txt"]);

    await run();

    expect(mockFg).toHaveBeenCalledWith(["*.txt", "*.md"]);
    expect(mockUploadReleaseAsset).toHaveBeenCalledTimes(1);
  });

  it("handles file paths with spaces in their names", async () => {
    setupInputs("dist/**", "42");
    setupRelease(42);
    mockFg.mockResolvedValue(["dist/my file.txt", "path/to/another file.md"]);

    await run();

    expect(mockSetFailed).not.toHaveBeenCalled();
    expect(mockUploadReleaseAsset).toHaveBeenCalledTimes(2);
    expect(mockUploadReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({ name: "my file.txt" }),
    );
    expect(mockUploadReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({ name: "another file.md" }),
    );
  });
});
