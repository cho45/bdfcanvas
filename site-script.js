
function BDFFont () { this.init.apply(this, arguments) };
BDFFont.prototype = {
	init : function (bdf) {
		var self = this;
		self.glyphs = {};
		self.properties = {};
		self.parse(bdf);
	},

	parse : function (bdf) {
		var self = this;
		var lines = bdf.split(/\n/);

		var glyph = null, properties = null;
		for (var i = 0, len = lines.length; i < len; i++) {
			var line = lines[i];

			if (glyph) {
				if (line != 'ENDCHAR') {
					if (!glyph['BITMAP']) {
						var d = line.split(' ');
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
					self.glyphs[glyph['ENCODING']] = glyph;
					glyph = null;
				}
			} else if (properties) {
				if (line != 'ENDPROPERTIES') {
					var d = line.split(' ', 2);
					properties[ d[0] ] = (d[1][0] == '"') ? d[1].substring(1, d[1].length - 2): +d[1];
				} else {
					self.properties = properties;
					properties = null;
				}
			} else {
				var d = line.split(' ');
				switch (d[0]) {
					case 'COMMENT': break;
					case 'FONT':
						self['FONT'] = d[1];
						break;
					case 'SIZE':
						self['SIZE'] = {
							size : +d[1],
							xres : +d[2],
							yres : +d[3]
						};
						break;
					case 'FONTBOUNDINGBOX':
						self['FONTBOUNDINGBOX'] = {
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
						self['CHARS'] = +d[1];
						break;
					case 'STARTCHAR':
						glyph = {};
					case 'ENDCHAR':
						break;
				}
			}
		}
	},

	drawChar : function (ctx, c, bx, by, t) {
		var self = this;
		var g = self.glyphs[ c ] || self.glyphs[ self.properties['DEFAULT_CHAR'] ];
		if (t) {
			var f = function () {};
			f.prototype = g;
			g = new f();
			g = t(g);
		};
		var n = g['BBw'];
		var b = g['BITMAP'];
		var ox = bx + g['BBox'] - 1;
		var oy = by - g['BBoy'] - g['BBh'] + 1;
		for (var y = 0, len = b.length; y < len; y++) {
			var l = b[y];
			for (var i = b.bits, x = 0; i >= 0; i--, x++) {
				if (l >> i & 0x01 == 1) {
					ctx.fillRect(ox + x, oy + y, 1, 1);
				}
			}
		}
		return { x: bx + g['DWIDTH'].x, y : by + g['DWIDTH'].y };
	},

	drawText : function (ctx, text, x, y, t) {
		var self = this;
		for (var i = 0, len = text.length; i < len; i++) {
			var c = text[i].charCodeAt(0);
			var r = self.drawChar(ctx, c, x, y, t);
			x = r.x; y = r.y;
		}
		return { x: x, y: y };
	},

	drawEdgeText : function (ctx, text, x, y, t) {
		var self = this;
		self.drawText(ctx, text, x, y, function (g) {
			var bitmap =  new Array(g['BITMAP'].length + 2);
			bitmap.bits = g['BITMAP'].bits + 2;
			for (var i = -1, len = bitmap.length; i < len; i++) {
				bitmap[i+1] = g['BITMAP'][i]   | g['BITMAP'][i]   >> 1 | g['BITMAP'][i]   >> 2 |
				              g['BITMAP'][i+1] | g['BITMAP'][i+1] >> 1 | g['BITMAP'][i+1] >> 2 |
				              g['BITMAP'][i-1] | g['BITMAP'][i-1] >> 1 | g['BITMAP'][i-1] >> 2 ;
			}
			g['BITMAP'] = bitmap;
			g['BBox']  += -3;
			g['BBoy']  +=  1;
			return g;
		});
	}
};

function drawGlyphs (cb) {
	var canvas = document.getElementById('glyphs');
	var ctx  = canvas.getContext('2d');

	ctx.save();
	ctx.clearRect(0, 0, 1000, 200);
	// draw grid
	ctx.fillStyle = '#000';
	ctx.translate(0, 0);
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
	for (var x = 0; x < 1000; x += 10) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, 200);
		ctx.stroke();
	}
	for (var y = 0; y < 200; y += 10) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(1000, y);
		ctx.stroke();
	}
	ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
	ctx.strokeRect(0, 0, 1000, 200);

	// base line
	ctx.beginPath();
	ctx.moveTo(0, 160);
	ctx.lineTo(1000, 160);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(10, 0);
	ctx.lineTo(10, 200);
	ctx.stroke();

	ctx.scale(10, 10);
	ctx.translate(1, 15);

	ctx.fillStyle = '#f00';
	ctx.fillRect(0, 0, 1, 1);

	cb(ctx);

	ctx.restore();
}

$(function () {
	drawGlyphs(function () { });

	var fontURI = location.hash ? location.hash.substring(1) : './mplus_f10r.bdf';

	$.get(fontURI, function (data) {
	//$.get('./mplus_j10r-unicode.bdf', function (data) {
		var font = new BDFFont(data);
		$('#input1, #edge').bind('change keyup', function () {
			var text = $('#input1').val();
			drawGlyphs(function (ctx) {
				ctx.fillStyle = '#000';
				if ($('#edge:checked').length) {
					font.drawEdgeText(ctx, text, 0, 0);
					ctx.fillStyle = '#fff';
				}
				font.drawText(ctx, text, 0, 0);
			});
		}).keyup();

		new function () {
			var canvas = document.getElementById('canvas');
			var ctx    = canvas.getContext('2d');
			var text   = "All your base are belong to us.\n";
			text += 'The canvas element provides scripts with a resolution-dependent bitmap canvas, which can be used for rendering graphs, game graphics, or other visual images on the fly.';
			
			ctx.fillStyle = '#000';
			var lines  = text.split(/\n/);
			for (var i = 0, len = lines.length; i < len; i++) {
				var line = lines[i];
				font.drawText(ctx, line, 10, 10 + (i * 14));
			}

			ctx.translate(0, i * 14);

			var lines  = text.split(/\n/);
			for (var i = 0, len = lines.length; i < len; i++) {
				var line = lines[i];
				ctx.fillStyle = '#000';
				font.drawEdgeText(ctx, line, 10, 10 + (i * 14));
				ctx.fillStyle = '#fff';
				font.drawText(ctx, line, 10, 10 + (i * 14));
			}
		}

		$('#input2').keyup(function () {
			var text = $(this).val();
			var canvas = document.getElementById('canvas');
			var ctx    = canvas.getContext('2d');
			ctx.fillStyle = '#000';
			ctx.clearRect(0, 4 * 14, 1000, 200);
			font.drawText(ctx, text, 10, 10 + ((1 + 4) * 14));

			font.drawEdgeText(ctx, text, 10, 10 + ((2 + 4) * 14));
			ctx.fillStyle = '#fff';
			font.drawText(ctx, text, 10, 10 + ((2 + 4) * 14));
		}).keyup();
	})
});
