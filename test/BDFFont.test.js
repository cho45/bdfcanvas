import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BDFFont } from '../src/index.js';
import { MockCanvasContext2d } from './MockCanvasContext2d.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function assertBitmapEqual(got, expected, message = 'Bitmap should match expected') {
	const gotStr = got.join("\n");
	const expectedStr = expected.join("\n");
	assert.strictEqual(gotStr, expectedStr, message);
}

describe('BDFFont', () => {
	let font;
	let bdfData;

	test('setup', () => {
		bdfData = readFileSync(join(projectRoot, 'mplus_f10r.bdf'), 'ascii');
		font = new BDFFont(bdfData);
	});

	test('should parse BDF font data', () => {
		assert.ok(font.glyphs, 'Font should have glyphs');
		assert.ok(font.properties, 'Font should have properties');
		assert.ok(typeof font.CHARS === 'number', 'Font should have CHARS count');
	});

	test('should draw single character correctly', () => {
		const ctx = new MockCanvasContext2d(20, 20);
		font.drawChar(ctx, 'A'.charCodeAt(0), 1, 10);
		
		const bitmap = ctx.dumpBitMap(0, 4, 7, 7);
		const expected = [
			"...#...",
			"...#...",
			"..#.#..",
			"..#.#..",
			".#####.",
			".#...#.",
			".#...#.",
		];
		
		assertBitmapEqual(bitmap, expected, 'Character A should be drawn correctly');
	});

	test('should measure text dimensions', () => {
		assert.strictEqual(font.measureText('f').width, 6, 'Single character width should be 6');
		assert.strictEqual(font.measureText('for').width, 18, 'Text "for" width should be 18');
		assert.strictEqual(font.measureText('for').height, 0, 'Text "for" height should be 0');
	});

	test('should draw text correctly', () => {
		const ctx = new MockCanvasContext2d(20, 20);
		font.drawText(ctx, 'for', 1, 10);
		
		const bitmap = ctx.dumpBitMap(0, 4, 19, 7);
		const expected = [
			"....##.............",
			"...#...............",
			"...#....###..#.##..",
			".#####.#...#.##..#.",
			"...#...#...#.#.....",
			"...#...#...#.#.....",
			"...#....###..#....."
		];
		
		assertBitmapEqual(bitmap, expected, 'Text "for" should be drawn correctly');
	});

	test('should draw edge text correctly', () => {
		const ctx = new MockCanvasContext2d(20, 20);
		font.drawEdgeText(ctx, 'for', 1, 10);
		
		const bitmap = ctx.dumpBitMap(0, 3, 19, 9);
		const expected = [
			"...####............",
			"..#####............",
			"..################.",
			"###################",
			"###################",
			"#########.#########",
			"..###.#########....",
			"..###.#########....",
			"..###..########...."
		];
		
		assertBitmapEqual(bitmap, expected, 'Edge text "for" should be drawn correctly');
	});

	test('should draw text with edge effect and outline', () => {
		const ctx = new MockCanvasContext2d(20, 20);
		
		// Draw edge text with fill style 1
		ctx.fillStyle = 1;
		font.drawEdgeText(ctx, 'for', 1, 10);
		
		// Draw normal text with fill style 0 (outline effect)
		ctx.fillStyle = 0;
		font.drawText(ctx, 'for', 1, 10);
		
		const bitmap = ctx.dumpBitMap(0, 3, 19, 9);
		const expected = [
			"...####............",
			"..##..#............",
			"..#.##############.",
			"###.####...##.#..##",
			"#.....#.###.#..##.#",
			"###.###.#.#.#.#####",
			"..#.#.#.###.#.#....",
			"..#.#.##...##.#....",
			"..###..########...."
		];
		
		assertBitmapEqual(bitmap, expected, 'Outlined text should be drawn correctly');
	});
});