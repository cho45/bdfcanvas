bdf-canvas
==========

This library is for parsing BDF Font and drawint it to canvas.

## Usage

```js
const BDFFont = require("bdf-canvas").BDFFont;

const ctx = canvas.getContext("2d");

const font = new BDFFont(bdfbody);
font.drawText(ctx, "foobar", 10, 10);
```
