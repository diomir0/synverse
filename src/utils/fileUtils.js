/**
 * File utilities for reading and classifying attachments.
 * Images are base64-encoded for Ollama's `images` field.
 * Text files are read as strings and injected into the prompt.
 * PDFs have their text extracted via pdfjs-dist (lazy-loaded).
 */

// pdfjs-dist is lazy-loaded on first PDF use to avoid bundling
// ~800 KB of PDF parsing code into the initial page load.
let _pdfjsLib = null;

async function getPdfjs() {
  if (!_pdfjsLib) {
    const pdfjs = await import("pdfjs-dist");
    const workerModule = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
    _pdfjsLib = pdfjs;
  }
  return _pdfjsLib;
}

// ── Supported file types ──────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "jsonl",
  "xml",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "py",
  "rb",
  "rs",
  "go",
  "java",
  "kt",
  "c",
  "cpp",
  "h",
  "hpp",
  "sh",
  "bash",
  "zsh",
  "bat",
  "ps1",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "sql",
  "r",
  "lua",
  "pl",
  "ex",
  "exs",
  "erl",
  "hs",
  "ml",
  "vim",
  "log",
  "env",
  "gitignore",
  "dockerignore",
  "editorconfig",
  "dockerfile",
  "makefile",
]);

const PDF_EXTENSION = "pdf";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// ── Helpers ──────────────────────────────────────────────────────────

export function getExtension(filename) {
  return (filename || "").split(".").pop().toLowerCase();
}

export function isImageFile(file) {
  if (file.type?.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(getExtension(file.name));
}

export function isTextFile(file) {
  if (file.type?.startsWith("text/")) return true;
  return TEXT_EXTENSIONS.has(getExtension(file.name));
}

export function isPdfFile(file) {
  if (file.type === "application/pdf") return true;
  return getExtension(file.name) === PDF_EXTENSION;
}

export function isSupportedFile(file) {
  return isImageFile(file) || isTextFile(file) || isPdfFile(file);
}

export function fileSizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Readers ─────────────────────────────────────────────────────────

/** Read a file as a data-URL string (base64). */
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Read a file as a UTF-8 text string. */
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Read a file as an ArrayBuffer. */
function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Process an attached file and return a structured attachment object.
 *
 * Returns: { type, name, mimeType, size, data?, textContent?, previewUrl? }
 *
 * - Images:  `data`  = raw base64 string (no data-url prefix), `previewUrl` = full data URL
 * - Text:    `textContent` = file content string
 * - PDF:     `data` = raw base64 string (sent via Ollama `images` field for multimodal models),
 *            `textContent` = extracted text (may be empty if extraction fails; fallback for text-only models)
 */
export async function processFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" exceeds the 20 MB limit`);
  }

  const base = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    mimeType: file.type,
    size: file.size,
  };

  if (isImageFile(file)) {
    const dataUrl = await readAsDataURL(file);
    // Ollama wants raw base64 (no data-url prefix)
    const rawBase64 = dataUrl.split(",")[1];
    return {
      ...base,
      type: "image",
      data: rawBase64,
      previewUrl: dataUrl,
    };
  }

  if (isTextFile(file)) {
    const text = await readAsText(file);
    return {
      ...base,
      type: "text",
      textContent: text,
    };
  }

  if (isPdfFile(file)) {
    // Extract text from the PDF and inject it into the prompt.
    // Ollama's `images` field only supports image MIME types, so PDFs
    // cannot be sent through that channel. Instead, we rely on text
    // extraction which works for text-based PDFs.
    const text = await extractPdfText(file);
    return {
      ...base,
      type: "pdf",
      textContent: text,
    };
  }

  throw new Error(`Unsupported file type: ${file.name}`);
}

/**
 * Extract text from a PDF using pdfjs-dist.
 * Returns the concatenated text of all pages, or an empty string on failure.
 */
async function extractPdfText(file) {
  try {
    const pdfjsLib = await getPdfjs();
    const buffer = await readAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      if (strings.length > 0) {
        pages.push(strings.join(" "));
      }
    }
    return pages.join("\n\n");
  } catch (err) {
    console.warn("PDF text extraction failed:", err);
    return "";
  }
}

/**
 * Build the text that should be injected into the user message content
 * for text/pdf attachments.
 */
export function formatTextAttachments(attachments) {
  if (!attachments || attachments.length === 0) return "";

  const parts = [];
  for (const att of attachments) {
    if (att.type === "text" || att.type === "pdf") {
      if (att.textContent) {
        parts.push(`--- ${att.name} ---\n${att.textContent}\n--- end of ${att.name} ---`);
      } else {
        parts.push(`[Attached file: ${att.name} — content could not be extracted]`);
      }
    }
  }
  return parts.join("\n\n");
}

/**
 * Collect raw base64 data from a message's image attachments.
 * Returns an array of base64 strings ready for Ollama's `images` field.
 *
 * Ollama's `images` field only accepts image MIME types (PNG, JPEG, etc.).
 * PDFs are NOT supported through this channel — their content is instead
 * extracted as text and injected into the prompt by `formatTextAttachments`.
 */
export function collectImages(attachments) {
  if (!attachments) return [];
  return attachments.filter((a) => a.type === "image" && a.data).map((a) => a.data);
}
