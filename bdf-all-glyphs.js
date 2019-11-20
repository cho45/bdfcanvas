
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

			canvas.width  = (this.font.FONTBOUNDINGBOX.w + Math.abs(this.font.FONTBOUNDINGBOX.x) + 1) * this.scale;
			canvas.height = (this.font.FONTBOUNDINGBOX.h + Math.abs(this.font.FONTBOUNDINGBOX.y) + 1) * this.scale;

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

			ctx.scale(this.scale, this.scale);
			ctx.translate(this.font.FONTBOUNDINGBOX.x + 1, this.font.FONTBOUNDINGBOX.h + this.font.FONTBOUNDINGBOX.y);

			ctx.fillStyle = '#f00';
			ctx.fillRect(0, 1, 0.3, 0.3);

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
			return new Uint16Array(Math.ceil(this.glyphs.length / 10)).map( (_,n) => n * 10);
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
