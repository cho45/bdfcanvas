export interface Glyph {
  ENCODING: number;
  SWIDTH: {
    x: number;
    y: number;
  };
  DWIDTH: {
    x: number;
    y: number;
  };
  BBw: number;
  BBh: number;
  BBox: number;
  BBoy: number;
  BITMAP: number[] & { bits: number };
}

export interface FontSize {
  size: number;
  xres: number;
  yres: number;
}

export interface FontBoundingBox {
  w: number;
  h: number;
  x: number;
  y: number;
}

export interface FontProperties {
  [key: string]: string | number;
  DEFAULT_CHAR?: number;
}

export interface TextMeasurement {
  width: number;
  height: number;
}

export interface DrawPosition {
  x: number;
  y: number;
}

export interface CanvasRenderingContext2D {
  fillRect(x: number, y: number, width: number, height: number): void;
  fillStyle: string | CanvasGradient | CanvasPattern;
}

export type GlyphTransform = (glyph: Glyph) => Glyph;

export declare class BDFFont {
  glyphs: { [encoding: number]: Glyph };
  properties: FontProperties;
  FONT?: string;
  SIZE?: FontSize;
  FONTBOUNDINGBOX?: FontBoundingBox;
  CHARS?: number;

  constructor(bdfData: string);

  init(bdfData: string): void;
  parse(bdfData: string): void;
  
  getGlyphOf(charCode: number): Glyph | undefined;
  
  drawChar(
    ctx: CanvasRenderingContext2D,
    charCode: number,
    x: number,
    y: number,
    transform?: GlyphTransform
  ): DrawPosition;
  
  measureText(text: string): TextMeasurement;
  
  drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    transform?: GlyphTransform
  ): DrawPosition;
  
  drawEdgeText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    transform?: GlyphTransform
  ): void;
}