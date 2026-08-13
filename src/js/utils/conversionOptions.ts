export type CompressionPreset = 'balanced' | 'smaller' | 'quality';
export type ImageExportFormat = 'jpg' | 'png';

const compressionPresets = {
  balanced: { scale: 1.5, quality: 0.72 },
  smaller: { scale: 1.15, quality: 0.48 },
  quality: { scale: 2, quality: 0.86 },
} as const;

export function getCompressionPreset(preset: string) {
  return compressionPresets[preset as CompressionPreset] ?? compressionPresets.balanced;
}

export function getPdfImageExportOptions(format: string) {
  if (format === 'png') {
    return {
      mimeType: 'image/png',
      extension: 'png',
      zipName: 'pdf-pages-png.zip',
      quality: undefined,
    };
  }

  return {
    mimeType: 'image/jpeg',
    extension: 'jpg',
    zipName: 'pdf-pages-jpg.zip',
    quality: 0.9,
  };
}

export function makeUploadId(index: number): string {
  return `upload-${index + 1}`;
}

export function getImagePdfPageSize(width: number, height: number) {
  const maxSide = 841.89; // A4 long edge in PDF points.
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: width * scale, height: height * scale };
}
