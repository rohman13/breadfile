export type SignatureImageLike = Pick<File, 'type' | 'size'>;

export function isSupportedSignatureImage(file: SignatureImageLike) {
  return ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) && file.size <= 10 * 1024 * 1024;
}

export function canvasRectToPdfRect(
  viewport: { convertToPdfPoint: (x: number, y: number) => [number, number] },
  rect: { x: number; y: number; width: number; height: number },
) {
  const corners = [
    viewport.convertToPdfPoint(rect.x, rect.y),
    viewport.convertToPdfPoint(rect.x + rect.width, rect.y),
    viewport.convertToPdfPoint(rect.x, rect.y + rect.height),
    viewport.convertToPdfPoint(rect.x + rect.width, rect.y + rect.height),
  ];
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}
