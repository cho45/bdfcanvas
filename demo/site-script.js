import { BDFFont } from '../src/BDFFont.js';

function drawGlyphs(cb) {
	const canvas = document.getElementById('glyphs');
	const ctx = canvas.getContext('2d');

	ctx.save();
	ctx.clearRect(0, 0, 1000, 200);
	// draw grid
	ctx.fillStyle = '#000';
	ctx.translate(0, 0);
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
	for (let x = 0; x < 1000; x += 10) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, 200);
		ctx.stroke();
	}
	for (let y = 0; y < 200; y += 10) {
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

	if (cb) cb(ctx);

	ctx.restore();
}

document.addEventListener('DOMContentLoaded', function() {
	drawGlyphs();

	const fontURI = location.hash ? location.hash.substring(1) : '../mplus_f10r.bdf';
	let font;

	function redraw() {
		if (!font) return;

		const text = document.getElementById('input1').value;
		drawGlyphs(function (ctx) {
			ctx.fillStyle = '#000';
			if (document.getElementById('edge').checked) {
				font.drawEdgeText(ctx, text, 0, 0);
				ctx.fillStyle = '#fff';
			}
			font.drawText(ctx, text, 0, 0);
		});

		// Second canvas rendering
		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d');
		const baseText = "All your base are belong to us.\n";

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.fillStyle = '#000';
		const lines = baseText.split(/\n/);
		for (let i = 0, len = lines.length; i < len; i++) {
			const line = lines[i];
			font.drawText(ctx, line, 10, 10 + (i * 14));
		}

		ctx.save();
		ctx.translate(0, lines.length * 14);

		for (let i = 0, len = lines.length; i < len; i++) {
			const line = lines[i];
			ctx.fillStyle = '#000';
			font.drawEdgeText(ctx, line, 10, 10 + (i * 14));
			ctx.fillStyle = '#fff';
			font.drawText(ctx, line, 10, 10 + (i * 14));
		}

		ctx.restore();

		// User input text
		const userText = document.getElementById('input2').value;
		ctx.fillStyle = '#000';
		ctx.clearRect(0, 4 * 14, 1000, 200);
		font.drawText(ctx, userText, 10, 10 + ((1 + 4) * 14));

		font.drawEdgeText(ctx, userText, 10, 10 + ((2 + 4) * 14));
		ctx.fillStyle = '#fff';
		font.drawText(ctx, userText, 10, 10 + ((2 + 4) * 14));
	}

	// Load default font
	fetch(fontURI)
		.then(response => response.text())
		.then(data => {
			console.log('loaded default font');
			font = new BDFFont(data);
			redraw();
		})
		.catch(error => console.error('Error loading font:', error));

	// Event listeners
	document.getElementById('input1').addEventListener('input', redraw);
	document.getElementById('input1').addEventListener('change', redraw);
	document.getElementById('edge').addEventListener('change', redraw);
	document.getElementById('input2').addEventListener('input', redraw);

	document.getElementById('file').addEventListener('change', function(e) {
		const file = e.target.files[0];
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = function() {
			font = new BDFFont(reader.result);
			redraw();
		};
		reader.readAsText(file);
	});
});
