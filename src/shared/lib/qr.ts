import QRCode from "qrcode";

/** Light margin around the code, in modules (QR spec minimum: 4). */
export const QR_QUIET_ZONE = 4;

export interface QrSvgPath {
  /** Modules per side. */
  readonly size: number;
  /** `viewBox` including the quiet zone. */
  readonly viewBox: string;
  /** One unit square per dark module, for a single `<path>` (colour comes from CSS). */
  readonly path: string;
}

/**
 * QR code geometry for an inline SVG (built at render time, zero client JS). Only the encoder
 * of `qrcode` is used: its own SVG output hardcodes colours, which must come from brand tokens.
 * Error correction "M" (15 %) keeps printed codes scannable with small marks or folds.
 */
export function toQrSvgPath(text: string): QrSvgPath {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const squares: string[] = [];
  for (let y = 0; y < modules.size; y += 1) {
    for (let x = 0; x < modules.size; x += 1) {
      if (modules.get(y, x) === 1) squares.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  const side = modules.size + 2 * QR_QUIET_ZONE;
  return {
    size: modules.size,
    viewBox: `${-QR_QUIET_ZONE} ${-QR_QUIET_ZONE} ${side} ${side}`,
    path: squares.join(""),
  };
}
