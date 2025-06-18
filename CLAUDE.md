# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern ESM JavaScript library for parsing BDF (Bitmap Distribution Format) fonts and rendering them to HTML5 Canvas. The library has been modernized with TypeScript support, ESM modules, and comprehensive testing.

## Core Architecture

### Source Structure
- **src/BDFFont.js**: Main ESM module containing the `BDFFont` class
- **src/index.js**: Entry point that exports the BDFFont class
- **types/index.d.ts**: TypeScript type definitions
- **test/**: Modern test suite using Node.js built-in test runner
- **demo/**: Modern ESM-based HTML demos

### Key Features
- Parses BDF font files into internal glyph data structure
- Provides text rendering methods: `drawChar()`, `drawText()`, `drawEdgeText()`
- Handles character encoding and font metrics
- Full TypeScript support with comprehensive type definitions

## Development Commands

- **Run tests**: `npm test` (uses Node.js built-in test runner)  
- **Watch tests**: `npm run test:watch`
- **Type checking**: `npm run typecheck`
- **Linting**: `npm run lint`

## Modern Features

### ESM Module System
- Pure ESM modules with proper `import`/`export` syntax
- Package.json configured with `"type": "module"`
- Modern Node.js 18+ support

### Testing Framework
- Uses Node.js built-in test runner (no external dependencies)
- `MockCanvasContext2d` utility for canvas simulation
- Comprehensive test coverage with bitmap verification
- Tests are in `test/*.test.js` files

### TypeScript Integration
- Complete type definitions in `types/index.d.ts`
- TypeScript compiler for type checking (not transpilation)
- Proper interface definitions for all classes and methods

## Key Classes and Methods

### BDFFont
- `new BDFFont(bdfData: string)`: Parse BDF font data
- `drawText(ctx, text, x, y, transform?)`: Render text to canvas context
- `drawChar(ctx, charCode, x, y, transform?)`: Render single character
- `drawEdgeText(ctx, text, x, y, transform?)`: Render text with edge effect
- `measureText(text): TextMeasurement`: Get text dimensions
- `getGlyphOf(charCode): Glyph`: Get glyph data for character

## Font Data Structure

BDF fonts are parsed into strongly-typed structures:
- Global properties (SIZE, FONTBOUNDINGBOX, etc.)
- Per-glyph data (ENCODING, BITMAP, DWIDTH, BBX dimensions)
- Bitmap data stored as hexadecimal integers with bit information