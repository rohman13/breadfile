import { describe, expect, it } from 'vitest';
import { categories } from '../js/config/tools';
import {
  getCompressionPreset,
  getPdfImageExportOptions,
  getImagePdfPageSize,
  makeUploadId,
} from '../js/utils/conversionOptions';

const visibleTools = categories.flatMap(category => category.tools);

describe('BreadFile conversion tools', () => {
  it('exposes the three recommended tools in the focused toolbox', () => {
    expect(visibleTools.map(tool => tool.id)).toEqual(expect.arrayContaining([
      'compress',
      'image-to-pdf',
      'pdf-to-images',
    ]));
  });

  it('maps friendly compression choices to safe raster settings', () => {
    expect(getCompressionPreset('balanced')).toEqual({ scale: 1.5, quality: 0.72 });
    expect(getCompressionPreset('smaller')).toEqual({ scale: 1.15, quality: 0.48 });
    expect(getCompressionPreset('quality')).toEqual({ scale: 2, quality: 0.86 });
  });

  it('creates PDF image export options with predictable names', () => {
    expect(getPdfImageExportOptions('png')).toEqual({
      mimeType: 'image/png',
      extension: 'png',
      zipName: 'pdf-pages-png.zip',
      quality: undefined,
    });
    expect(getPdfImageExportOptions('jpg')).toEqual({
      mimeType: 'image/jpeg',
      extension: 'jpg',
      zipName: 'pdf-pages-jpg.zip',
      quality: 0.9,
    });
  });

  it('gives duplicate image uploads distinct internal IDs', () => {
    expect(makeUploadId(0)).not.toBe(makeUploadId(1));
  });

  it('fits large photos onto printable PDF pages without distortion', () => {
    expect(getImagePdfPageSize(4032, 3024)).toEqual({ width: 841.89, height: 631.4175 });
    expect(getImagePdfPageSize(3024, 4032)).toEqual({ width: 631.4175, height: 841.89 });
  });
});
