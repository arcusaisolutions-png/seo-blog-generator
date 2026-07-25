import { describe, expect, it } from "vitest";
import { extractUploadedText } from "./files";

describe("writing sample extraction", () => {
  it("extracts and normalizes a text file", async () => {
    const result = await extractUploadedText({
      fileName: "founder-note.txt",
      mimeType: "text/plain",
      fileSize: 30,
      dataBase64: Buffer.from("First line\r\n\r\n\r\nSecond line").toString("base64"),
    });

    expect(result).toMatchObject({
      originalFileName: "founder-note.txt",
      mimeType: "text/plain",
      extractedText: "First line\n\nSecond line",
      wordCount: 4,
    });
  });

  it("rejects an unsupported file type before parsing it", async () => {
    await expect(extractUploadedText({
      fileName: "sample.exe",
      mimeType: "application/octet-stream",
      fileSize: 4,
      dataBase64: Buffer.from("test").toString("base64"),
    })).rejects.toThrow("not supported");
  });
});
