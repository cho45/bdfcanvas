export class MockCanvasContext2d {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		const bitmap = new Array(height);
		for (let y = 0; y < height; y++) {
			bitmap[y] = new Array(width);
			for (let x = 0; x < width; x++) {
				bitmap[y][x] = 0;
			}
		}
		this.bitmap = bitmap;
		this.fillStyle = 1;
	}

	fillRect(sx, sy, w, h) {
		const bitmap = this.bitmap;
		const ex = sx + w, ey = sy + h;
		for (let y = sy; y < ey; y++) {
			for (let x = sx; x < ex; x++) {
				try {
					bitmap[y][x] = this.fillStyle;
				} catch (e) {
					// no warnings
				}
			}
		}
	}

	clearRect(sx, sy, w, h) {
		const bitmap = this.bitmap;
		const ex = sx + w, ey = sy + h;
		for (let y = sy; y < ey; y++) {
			for (let x = sx; x < ex; x++) {
				try {
					bitmap[y][x] = 0;
				} catch (e) {
					// no warnings
				}
			}
		}
	}

	dumpBitMap(sx, sy, w, h) {
		const ret = [];
		const bitmap = this.bitmap;
		const ex = sx + w, ey = sy + h;
		for (let y = sy; y < ey; y++) {
			let line = "";
			for (let x = sx; x < ex; x++) {
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
}