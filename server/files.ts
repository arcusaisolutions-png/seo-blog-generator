import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 8;
export const MAX_EXTRACTED_CHARACTERS = 160_000;

export type UploadedTextFile = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataBase64: string;
};

export type ExtractedTextFile = {
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  extractedText: string;
  wordCount: number;
};

const EXTENSION_MIME_TYPES: Record<string, string[]> = {
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain"],
  markdown: ["text/markdown", "text/plain"],
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

function extensionOf(fileName: string): string {
  const extension = fileName.trim().toLowerCase().split(".").pop() ?? "";
  return extension;
}

function normaliseText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_EXTRACTED_CHARACTERS);
}

function validateUpload(file: UploadedTextFile, buffer: Buffer): string {
  const extension = extensionOf(file.fileName);
  if (!Object.hasOwn(EXTENSION_MIME_TYPES, extension)) {
    throw new Error(`“${file.fileName}” is not supported. Upload a .txt, .md, .pdf, or .docx file.`);
  }
  if (!file.fileName.trim()) throw new Error("Every uploaded file needs a name.");
  if (!Number.isFinite(file.fileSize) || file.fileSize <= 0 || file.fileSize > MAX_UPLOAD_BYTES) {
    throw new Error(`“${file.fileName}” must be between 1 byte and 5 MB.`);
  }
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`“${file.fileName}” could not be read or exceeds the 5 MB limit.`);
  }
  const acceptedMimes = EXTENSION_MIME_TYPES[extension];
  if (file.mimeType && !acceptedMimes.includes(file.mimeType.toLowerCase())) {
    throw new Error(`“${file.fileName}” does not match its declared file type.`);
  }
  if (extension === "pdf" && buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
    throw new Error(`“${file.fileName}” is not a valid PDF.`);
  }
  if (extension === "docx" && buffer.subarray(0, 2).toString("ascii") !== "PK") {
    throw new Error(`“${file.fileName}” is not a valid DOCX file.`);
  }
  return extension;
}

async function extractText(buffer: Buffer, extension: string): Promise<string> {
  if (extension === "txt" || extension === "md" || extension === "markdown") {
    return buffer.toString("utf8");
  }
  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function extractUploadedText(file: UploadedTextFile): Promise<ExtractedTextFile> {
  const buffer = Buffer.from(file.dataBase64, "base64");
  const extension = validateUpload(file, buffer);
  let extractedText: string;
  try {
    extractedText = normaliseText(await extractText(buffer, extension));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown parsing error";
    throw new Error(`Could not extract text from “${file.fileName}”: ${detail}`);
  }
  if (!extractedText) throw new Error(`“${file.fileName}” did not contain extractable text.`);

  return {
    originalFileName: file.fileName,
    mimeType: file.mimeType || EXTENSION_MIME_TYPES[extension][0],
    fileSize: buffer.length,
    extractedText,
    wordCount: extractedText.split(/\s+/).filter(Boolean).length,
  };
}

export async function extractUploadedTexts(files: UploadedTextFile[]): Promise<ExtractedTextFile[]> {
  if (files.length === 0) return [];
  if (files.length > MAX_FILES_PER_REQUEST) {
    throw new Error(`Upload up to ${MAX_FILES_PER_REQUEST} writing samples at a time.`);
  }
  return Promise.all(files.map(extractUploadedText));
}
