
Vue.use(VueMaterial.default)


Vue.component('bdf-glyph', {
	props: ['font', 'glyph'],
	data: function () {
		return {
			scale: 10,
		}
	},
	template: `
		<canvas class="glyph"></canvas>
	`,

	methods: {
		draw: function () {
			const { ctx } = this;
			const canvas = this.$el;

			canvas.width  = (this.font.FONTBOUNDINGBOX.w + 2) * this.scale;
			canvas.height = (this.font.FONTBOUNDINGBOX.h + 2) * this.scale;

			ctx.save();
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			// draw grid
			ctx.fillStyle = '#000';
			ctx.translate(0, 0);
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
			for (var x = 0; x < canvas.width; x += this.scale) {
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, canvas.height);
				ctx.stroke();
			}
			for (var y = 0; y < canvas.height; y += this.scale) {
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(canvas.width, y);
				ctx.stroke();
			}

			// draw bounding box
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(0, 200, 0, 0.9)';
			ctx.beginPath();
			const originX = this.font.FONTBOUNDINGBOX.x - this.font.FONTBOUNDINGBOX.x + 1;
			const originY = this.font.FONTBOUNDINGBOX.h + this.font.FONTBOUNDINGBOX.y + 1;
			// origin
			ctx.moveTo( (originX + this.font.FONTBOUNDINGBOX.x) * this.scale, (originY - this.font.FONTBOUNDINGBOX.y) * this.scale);
			ctx.lineTo( (originX + this.font.FONTBOUNDINGBOX.x + this.font.FONTBOUNDINGBOX.w) * this.scale, (originY - this.font.FONTBOUNDINGBOX.y) * this.scale);
			ctx.lineTo( (originX + this.font.FONTBOUNDINGBOX.x + this.font.FONTBOUNDINGBOX.w) * this.scale, (originY - this.font.FONTBOUNDINGBOX.y - this.font.FONTBOUNDINGBOX.h) * this.scale);
			ctx.lineTo( (originX + this.font.FONTBOUNDINGBOX.x) * this.scale, (originY - this.font.FONTBOUNDINGBOX.y - this.font.FONTBOUNDINGBOX.h) * this.scale);
			ctx.closePath();
			ctx.stroke();

			ctx.scale(this.scale, this.scale);
			ctx.translate(originX, originY-1);

			ctx.fillStyle = '#f00';
			ctx.fillRect(-0.3/2, 1-0.3/2, 0.3, 0.3);

			ctx.fillStyle = '#000';
			this.font.drawChar(ctx, this.glyph, 0, 0);

			ctx.restore();
		},
	},

	watch: {
		font() {
			this.draw();
		},

		glyph() {
			this.draw();
		}
	},

	mounted: function () {
		this.ctx = this.$el.getContext('2d');
		this.draw();
	}
})

class SourceCodeBuilder {
	constructor() {
		this.ret = "";
		this._indent = [];
	}

	indent(string) {
		this.println(string);
		this._indent.push("\t");
	}

	unindent(string) {
		this._indent.pop();
		this.println(string);
	}

	println(string) {
		const indent = this._indent.join("");
		const replaced = string.replace(/^/gm, indent);
		this.ret += replaced + "\n";
	}

	get result() { return this.ret }
}

new Vue({
	el: '#app',
	data: {
		font: {
			SIZE: {}
		},
		glyphs: [],
	},

	computed: {
		rows: function () {
			if (!this.font.glyphs) return [];
			const max = Math.max(...Object.keys(this.font.glyphs));
			return new Uint16Array(Math.ceil(max / 10)).map( (_,n) => n * 10);
		}
	},

	methods: {
		loadFile: function (file) {
			console.log('loadFile', file);
			const reader = new FileReader();
			reader.onload = () => {
				this.loadFont(reader.result);
			};
			reader.readAsText(file);
		},

		loadFont: function (text) {
			this.font = new BDFFont(text);
			console.log(this.font);
			this.glyphs = Object.keys(this.font.glyphs).map( (n) => ({ n: n, g: this.font.glyphs[n] }));
		},

		hasGlyph: function (n) {
			return !!this.font.glyphs[n];
		},

		generateSource: function () {
			const h = new SourceCodeBuilder();
			const c = new SourceCodeBuilder();

			const width = this.font.FONTBOUNDINGBOX.w;
			const height = this.font.FONTBOUNDINGBOX.h;
			const variableName = `font_${width}x${height}`;

			const bits = Math.ceil(width / 8) * 8;
			const type = `uint${bits}_t`;

			h.println(`// generated with https://cho45.stfuawsc.com/bdfcanvas/bdf-all-glyphs.html`);
			h.println("#include <stdint.h>");
			h.println(`#define ${variableName}_width ${width}`);
			h.println(`#define ${variableName}_height ${height}`);
			h.println("");
			h.println(`extern const ${type} ${variableName}[][${height}];`);
			h.println("");

			c.println(`// generated with https://cho45.stfuawsc.com/bdfcanvas/bdf-all-glyphs.html`);
			c.println(`// ${this.font.FONT}`);
			c.println(`#include "${variableName}.h"`);
			c.println("");
			c.indent(`const ${type} ${variableName}[][${height}] = {`);
			for (let i = 0; i < 128; i++) {
				const glyph = this.font.glyphs[i];
				const bitmap = glyph ? glyph.BITMAP : [];
				c.println('/*');
				c.println(` * ${i} (0x${i.toString(16)})`);
				for (let y = 0; y < height; y++) {
					const n = bitmap[y] || 0;
					c.println(' * ' + (Math.pow(2, bits) + n).toString(2).slice(1).replace(/0/g, '_').replace(/1/g, '*'));
				}
				c.println(" */");
				c.indent("{");
				for (let y = 0; y < height; y++) {
					const n = bitmap[y] || 0;
					c.println('0x' + n.toString(16) + ',');
				}
				c.unindent("},");
			}
			c.unindent(`};`);
			console.log(c.result);

			{
				const blob = new Blob([ c.result ], { type: 'application/octet-stream' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.download = variableName + '.c';
				a.href = url;
				a.click();
				};
			{
				const blob = new Blob([ h.result ], { type: 'application/octet-stream' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.download = variableName + '.h';
				a.href = url;
				a.click();
			};
		},

		fileChanged: function (e) {
			this.loadFile(e.target.files[0]);
		}
	},

	mounted: async function () {
		const font = await (await fetch("./mplus_f10r.bdf")).text();
		this.loadFont(font);

		this.$el.addEventListener("drop", (e) => {
			console.log('drop', e);
			e.preventDefault();

			const item = e.dataTransfer.items[0];
			if (item && item.kind === 'file') {
				const file = item.getAsFile();
				this.loadFile(file);
			}
		});

		this.$el.addEventListener("dragover", (e) => {
			e.preventDefault();
		});
	},
})
