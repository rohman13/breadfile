import { describe, expect, it } from 'vitest';
import { canvasRectToPdfRect, isSupportedSignatureImage } from '../js/utils/signature';

describe('Sign PDF helpers', () => {
  it('accepts supported signature and stamp images under 10 MB', () => {
    expect(isSupportedSignatureImage({ type: 'image/png', size: 1024 })).toBe(true);
    expect(isSupportedSignatureImage({ type: 'image/jpeg', size: 1024 })).toBe(true);
    expect(isSupportedSignatureImage({ type: 'image/webp', size: 1024 })).toBe(true);
  });

  it('rejects unsupported or oversized uploads', () => {
    expect(isSupportedSignatureImage({ type: 'image/svg+xml', size: 1024 })).toBe(false);
    expect(isSupportedSignatureImage({ type: 'image/png', size: 10 * 1024 * 1024 + 1 })).toBe(false);
  });

  it('uses the PDF.js viewport conversion for rotated pages', () => {
    const viewport = {
      convertToPdfPoint(x: number, y: number): [number, number] {
        return [600 - y, x];
      },
    };

    expect(canvasRectToPdfRect(viewport, { x: 10, y: 20, width: 100, height: 40 })).toEqual({
      x: 540,
      y: 10,
      width: 40,
      height: 100,
    });
  });
});
