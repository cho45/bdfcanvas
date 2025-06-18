export class BDFFont {
	constructor() {
		this.init.apply(this, arguments);
	}

	init(bdf) {
		this.glyphs = {};
		this.properties = {};
		this.parse(bdf);
	}

	parse(bdf) {
		const lines = bdf.split(/\n/);

		let glyph = null, properties = null;
		for (let i = 0, len = lines.length; i < len; i++) {
			const line = lines[i];

			if (glyph) {
				if (line !== 'ENDCHAR') {
					if (!glyph['BITMAP']) {
						const d = line.split(' ');
						switch (d[0]) {
						case 'ENCODING':
							glyph['ENCODING'] = +d[1];
							break;
						case 'SWIDTH':
							glyph['SWIDTH'] = {
								x: +d[1],
								y: +d[2]
							};
							break;
						case 'DWIDTH':
							glyph['DWIDTH'] = {
								x: +d[1],
								y: +d[2]
							};
							break;
						case 'BBX':
							glyph['BBw']  = +d[1];
							glyph['BBh']  = +d[2];
							glyph['BBox'] = +d[3];
							glyph['BBoy'] = +d[4];
							break;
						case 'ATTRIBUTES':
							break;
						case 'BITMAP':
							glyph['BITMAP'] = [];
							break;
						}
					} else {
						glyph['BITMAP'].bits = line.length * 4;
						glyph['BITMAP'].push(parseInt(line, 16));
					}
				} else {
					this.glyphs[glyph['ENCODING']] = glyph;
					glyph = null;
				}
			} else if (properties) {
				if (line !== 'ENDPROPERTIES') {
					const d = line.split(' ', 2);
					properties[ d[0] ] = (d[1][0] === '"') ? d[1].substring(1, d[1].length - 2): +d[1];
				} else {
					this.properties = properties;
					properties = null;
				}
			} else {
				const d = line.split(' ');
				switch (d[0]) {
				case 'COMMENT': break;
				case 'FONT':
					this['FONT'] = d[1];
					break;
				case 'SIZE':
					this['SIZE'] = {
						size : +d[1],
						xres : +d[2],
						yres : +d[3]
					};
					break;
				case 'FONTBOUNDINGBOX':
					this['FONTBOUNDINGBOX'] = {
						w : +d[1],
						h : +d[2],
						x : +d[3],
						y : +d[4]
					};
					break;
				case 'STARTPROPERTIES':
					properties = {};
					break;
				case 'CHARS':
					this['CHARS'] = +d[1];
					break;
				case 'STARTCHAR':
					glyph = {};
					break;
				case 'ENDCHAR':
					break;
				}
			}
		}
	}

	getGlyphOf(c) {
		return this.glyphs[ c ] || this.glyphs[ this.properties['DEFAULT_CHAR'] ];
	}

	drawChar(ctx, c, bx, by, t) {
		let g = this.getGlyphOf(c);
		if (t) {
			const f = function () {};
			f.prototype = g;
			g = new f();
			g = t(g);
		}
		const n = g['BBw'];
		const b = g['BITMAP'];
		const ox = bx + g['BBox'] - 1;
		const oy = by - g['BBoy'] - g['BBh'] + 1;
		for (let y = 0, len = b.length; y < len; y++) {
			const l = b[y];
			for (let i = b.bits, x = 0; i >= 0; i--, x++) {
				if (l >> i & 0x01 == 1) {
					ctx.fillRect(ox + x, oy + y, 1, 1);
				}
			}
		}
		return { x: bx + g['DWIDTH'].x, y : by + g['DWIDTH'].y };
	}

	measureText(text) {
		const ret = {
			width: 0,
			height: 0
		};
		for (let i = 0, len = text.length; i < len; i++) {
			const c = text[i].charCodeAt(0);
			const g = this.getGlyphOf(c);
			ret.width += g['DWIDTH'].x;
			ret.height += g['DWIDTH'].y;
		}
		return ret;
	}

	drawText(ctx, text, x, y, t) {
		for (let i = 0, len = text.length; i < len; i++) {
			const c = text[i].charCodeAt(0);
			const r = this.drawChar(ctx, c, x, y, t);
			x = r.x; y = r.y;
		}
		return { x: x, y: y };
	}

	drawEdgeText(ctx, text, x, y, t) {
		this.drawText(ctx, text, x, y, function (g) {
			const bitmap = new Array(g['BITMAP'].length + 2);
			bitmap.bits = g['BITMAP'].bits + 2;
			for (let i = -1, len = bitmap.length; i < len; i++) {
				bitmap[i+1] =
					g['BITMAP'][i]   | g['BITMAP'][i]   >> 1 | g['BITMAP'][i]   >> 2 |
					g['BITMAP'][i+1] | g['BITMAP'][i+1] >> 1 | g['BITMAP'][i+1] >> 2 |
					g['BITMAP'][i-1] | g['BITMAP'][i-1] >> 1 | g['BITMAP'][i-1] >> 2 ;
			}
			g['BITMAP'] = bitmap;
			g['BBox']  += -3;
			g['BBoy']  +=  1;
			return g;
		});
	}
}