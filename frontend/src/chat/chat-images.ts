// Picking pictures for a chat message: what counts as an image, reading it as base64 (sent inline to the model).
const BY_MIME: Record<string, string> = { "image/png": "image/png", "image/jpeg": "image/jpeg", "image/gif": "image/gif", "image/webp": "image/webp" };
const BY_NAME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
export const MAX_IMAGE_BYTES = 10_000_000;

/** The media type the daemon accepts for this file, or null when it is not a supported picture. */
export function imageType(file: { type: string; name: string }): string | null {
  if (BY_MIME[file.type]) return BY_MIME[file.type];
  const ext = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase();
  return (ext && BY_NAME[ext]) || null;
}

export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("could not read the picture"));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

/** Supported pictures out of a paste, a drop or a file picker. */
export function imagesFrom(list: DataTransferItemList | FileList | null | undefined): File[] {
  const files: File[] = [];
  if (!list) return files;
  for (const entry of Array.from(list as ArrayLike<DataTransferItem | File>)) {
    const file = entry instanceof File ? entry : entry.kind === "file" ? entry.getAsFile() : null;
    if (file && imageType(file)) files.push(file);
  }
  return files;
}
