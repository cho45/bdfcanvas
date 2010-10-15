#!node
var fs = require('fs');
var sys = require('sys');

MockCanvasContext2d = function () { this.init.apply(this, arguments) };
MockCanvasContext2d.prototype = {
	init : function (width, height) {
		this.width = width;
		this.height = height;
		var bitmap = new Array(height);
		for (var y = 0; y < height; y++) {
			bitmap[y] = new Array(width);
			for (var x = 0; x < width; x++) {
				bitmap[y][x] = 0;
			}
		}
		this.bitmap = bitmap;
		this.fillStyle = 1;
	},

	fillRect : function (sx, sy, w, h) {
		var bitmap = this.bitmap;
		var ex = sx + w, ey = sy + h;
		for (var y = sy; y < ey; y++) {
			for (var x = sx; x < ex; x++) {
				try {
					bitmap[y][x] = this.fillStyle;
				} catch (e) {}
			}
		}
	},

	clearRect : function (sx, sy, w, h) {
		var bitmap = this.bitmap;
		var ex = sx + w, ey = sy + h;
		for (var y = sy; y < ey; y++) {
			for (var x = sx; x < ex; x++) {
				try {
					bitmap[y][x] = 0;
				} catch (e) {}
			}
		}
	},

	dumpBitMap : function (sx, sy, w, h) {
		var ret = [];
		var bitmap = this.bitmap;
		var ex = sx + w, ey = sy + h;
		for (var y = sy; y < ey; y++) {
			var line = "";
			for (var x = sx; x < ex; x++) {
				try {
					line += bitmap[y][x] ? '#' : '.';
				} catch (e) {
					line += ' ';
				}
			}
			ret.push(line);
		}
		return ret;
	}
};

function sameBitmap (got, expected) {
	got = got.join("\n");
	expected = expected.join("\n");
	if (got == expected) {
		console.log("ok");
	} else {
		console.log("ng");
		console.log("got:");
		console.log(got.replace(/^/mg, '\t '));
		console.log("expected:");
		console.log(expected.replace(/^/mg, '\t '));
	}
}

var data = fs.readFileSync('bdffont.js', 'ascii');
var bdf  = fs.readFileSync('mplus_f10r.bdf', 'ascii');
eval(data);

var ctx  = new MockCanvasContext2d(20, 20);
var font = new BDFFont(bdf);

font.drawChar(ctx, 'A'.charCodeAt(0), 1, 10);

sameBitmap(
	ctx.dumpBitMap(0, 4, 7, 7),
	[
		"...#...",
		"...#...",
		"..#.#..",
		"..#.#..",
		".#####.",
		".#...#.",
		".#...#.",
	]
);

ctx.clearRect(0, 0, 20, 20);

font.drawText(ctx, 'for', 1, 10);

sameBitmap(
	ctx.dumpBitMap(0, 4, 19, 7),
	[
		"....##.............",
		"...#...............",
		"...#....###..#.##..",
		".#####.#...#.##..#.",
		"...#...#...#.#.....",
		"...#...#...#.#.....",
		"...#....###..#....."
	]
);

font.drawEdgeText(ctx, 'for', 1, 10);

sameBitmap(
	ctx.dumpBitMap(0, 3, 19, 9),
	[
		"...####............",
		"..#####............",
		"..################.",
		"###################",
		"###################",
		"#########.#########",
		"..###.#########....",
		"..###.#########....",
		"..###..########...."
	]
);

ctx.fillStyle = 1;
font.drawEdgeText(ctx, 'for', 1, 10);
ctx.fillStyle = 0;
font.drawText(ctx, 'for', 1, 10);

sameBitmap(
	ctx.dumpBitMap(0, 3, 19, 9),
	[
		"...####............",
		"..##..#............",
		"..#.##############.",
		"###.####...##.#..##",
		"#.....#.###.#..##.#",
		"###.###.#.#.#.#####",
		"..#.#.#.###.#.#....",
		"..#.#.##...##.#....",
		"..###..########...."
	]
);

