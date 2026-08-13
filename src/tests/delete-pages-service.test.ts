import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { deletePdfPages } from '../js/tools/delete-pages/service';

async function makeDocument(labels: string[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  labels.forEach((label, index) => {
    const page = pdf.addPage([300 + index, 200]);
    page.drawText(label, { x: 30, y: 100, font, size: 20 });
  });
  return new Uint8Array(await pdf.save());
}

describe('deletePdfPages', () => {
  it('deletes selected pages while preserving the remaining order', async () => {
    const source = await makeDocument(['one', 'two', 'three', 'four']);
    const output = await deletePdfPages(source, [1, 3]);
    const pdf = await PDFDocument.load(output);
    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getPages().map((page) => page.getWidth())).toEqual([300, 302]);
  });

  it('does not mutate the input bytes', async () => {
    const source = await makeDocument(['one', 'two']);
    const before = new Uint8Array(source);
    await deletePdfPages(source, [1]);
    expect(source).toEqual(before);
  });

  it('rejects deleting every page', async () => {
    const source = await makeDocument(['one', 'two']);
    await expect(deletePdfPages(source, [0, 1])).rejects.toMatchObject({
      code: 'INVALID_FILE',
    });
  });

  it('rejects out-of-range page indices', async () => {
    const source = await makeDocument(['one', 'two']);
    await expect(deletePdfPages(source, [2])).rejects.toMatchObject({
      code: 'INVALID_FILE',
    });
  });
});
