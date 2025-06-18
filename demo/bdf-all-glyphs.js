import { createApp, defineComponent } from 'https://unpkg.com/vue@3.2.11/dist/vue.esm-browser.js';
import { BDFFont } from '../src/BDFFont.js';

const BdfGlyph = defineComponent({
  name: 'BdfGlyph',
  props: {
    font: Object,
    glyph: Number,
  },
  data() {
    return { scale: 10, ctx: null };
  },
  mounted() {
    this.ctx = this.$el.getContext('2d');
    this.draw();
  },
  watch: {
    font() { this.draw(); },
    glyph() { this.draw(); }
  },
  methods: {
    draw() {
      if (!this.font || !this.font.FONTBOUNDINGBOX) return;
      const canvas = this.$el;
      const ctx = this.ctx;
      canvas.width  = (this.font.FONTBOUNDINGBOX.w + 2) * this.scale;
      canvas.height = (this.font.FONTBOUNDINGBOX.h + 2) * this.scale;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.translate(0, 0);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      for (let x = 0; x < canvas.width; x += this.scale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += this.scale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 200, 0, 0.9)';
      ctx.beginPath();
      const originX = this.font.FONTBOUNDINGBOX.x - this.font.FONTBOUNDINGBOX.x + 1;
      const originY = this.font.FONTBOUNDINGBOX.h + this.font.FONTBOUNDINGBOX.y + 1;
      ctx.moveTo((originX + this.font.FONTBOUNDINGBOX.x) * this.scale, (originY - this.font.FONTBOUNDINGBOX.y) * this.scale);
      ctx.lineTo((originX + this.font.FONTBOUNDINGBOX.x + this.font.FONTBOUNDINGBOX.w) * this.scale, (originY - this.font.FONTBOUNDINGBOX.y) * this.scale);
      ctx.lineTo((originX + this.font.FONTBOUNDINGBOX.x + this.font.FONTBOUNDINGBOX.w) * this.scale, (originY - this.font.FONTBOUNDINGBOX.y - this.font.FONTBOUNDINGBOX.h) * this.scale);
      ctx.lineTo((originX + this.font.FONTBOUNDINGBOX.x) * this.scale, (originY - this.font.FONTBOUNDINGBOX.y - this.font.FONTBOUNDINGBOX.h) * this.scale);
      ctx.closePath(); ctx.stroke();
      ctx.scale(this.scale, this.scale);
      ctx.translate(originX, originY-1);
      ctx.fillStyle = '#f00'; ctx.fillRect(-0.3/2, 1-0.3/2, 0.3, 0.3);
      ctx.fillStyle = '#000';
      this.font.drawChar(ctx, this.glyph, 0, 0);
      ctx.restore();
    }
  },
  template: `<canvas class="glyph"></canvas>`
});

const SourceCodeBuilder = class {
  constructor() { this.ret = ""; this._indent = []; }
  indent(string) { this.println(string); this._indent.push("\t"); }
  unindent(string) { this._indent.pop(); this.println(string); }
  println(string) { const indent = this._indent.join(""); this.ret += string.replace(/^/gm, indent) + "\n"; }
  get result() { return this.ret; }
};

const App = defineComponent({
  name: 'App',
  components: { BdfGlyph },
  data() {
    return {
      font: { SIZE: {} },
      glyphs: [],
    };
  },
  computed: {
    rows() {
      if (!this.font.glyphs) return [];
      const max = Math.max(...Object.keys(this.font.glyphs));
      return new Uint16Array(Math.ceil(max / 10)).map((_, n) => n * 10);
    }
  },
  methods: {
    async loadFile(file) {
      const reader = new FileReader();
      reader.onload = () => { this.loadFont(reader.result); };
      reader.readAsText(file);
    },
    loadFont(text) {
      this.font = new BDFFont(text);
      this.glyphs = Object.keys(this.font.glyphs).map(n => ({ n, g: this.font.glyphs[n] }));
    },
    hasGlyph(n) { return !!this.font.glyphs[n]; },
    generateSource() {
      const h = new SourceCodeBuilder();
      const c = new SourceCodeBuilder();
      const width = this.font.FONTBOUNDINGBOX.w;
      const height = this.font.FONTBOUNDINGBOX.h;
      const variableName = `font_${width}x${height}`;
      const bits = Math.ceil(width / 8) * 8;
      const type = `uint${bits}_t`;
      h.println(`// generated with https://cho45.stfuawsc.com/bdfcanvas/demo/bdf-all-glyphs.html`);
      h.println("#include <stdint.h>");
      h.println(`#define ${variableName}_width ${width}`);
      h.println(`#define ${variableName}_height ${height}`);
      h.println("");
      h.println(`extern const ${type} ${variableName}[][${height}];`);
      h.println("");
      c.println(`// generated with https://cho45.stfuawsc.com/bdfcanvas/demo/bdf-all-glyphs.html`);
      c.println(`// ${this.font.FONT}`);
      c.println(`#include \"${variableName}.h\"`);
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
      {
        const blob = new Blob([c.result], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = variableName + '.c';
        a.href = url;
        a.click();
      }
      {
        const blob = new Blob([h.result], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = variableName + '.h';
        a.href = url;
        a.click();
      }
    },
    fileChanged(e) { this.loadFile(e.target.files[0]); }
  },
  async mounted() {
    const font = await (await fetch("../mplus_f10r.bdf")).text();
    this.loadFont(font);
    this.$el.addEventListener("drop", (e) => {
      e.preventDefault();
      const item = e.dataTransfer.items[0];
      if (item && item.kind === 'file') {
        const file = item.getAsFile();
        this.loadFile(file);
      }
    });
    this.$el.addEventListener("dragover", (e) => { e.preventDefault(); });
  },
  template: document.getElementById('app').innerHTML,
});

createApp(App).mount('#app');
