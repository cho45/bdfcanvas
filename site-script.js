
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

	if (cb) cb(ctx);

	ctx.restore();
}

$(function () {
	drawGlyphs();

	var fontURI = location.hash ? location.hash.substring(1) : './mplus_f10r.bdf';
	var font;

	function redraw() {
		if (!font) return;

		var text = $('#input1').val();
		drawGlyphs(function (ctx) {
			ctx.fillStyle = '#000';
			if ($('#edge:checked').length) {
				font.drawEdgeText(ctx, text, 0, 0);
				ctx.fillStyle = '#fff';
			}
			font.drawText(ctx, text, 0, 0);
		});

		new function () {
			var canvas = document.getElementById('canvas');
			var ctx    = canvas.getContext('2d');
			var text   = "All your base are belong to us.\n";

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = '#000';
			var lines  = text.split(/\n/);
			for (var i = 0, len = lines.length; i < len; i++) {
				var line = lines[i];
				font.drawText(ctx, line, 10, 10 + (i * 14));
			}

			ctx.save();
			ctx.translate(0, i * 14);

			var lines  = text.split(/\n/);
			for (var i = 0, len = lines.length; i < len; i++) {
				var line = lines[i];
				ctx.fillStyle = '#000';
				font.drawEdgeText(ctx, line, 10, 10 + (i * 14));
				ctx.fillStyle = '#fff';
				font.drawText(ctx, line, 10, 10 + (i * 14));
			}

			ctx.restore();
		}

		var text = $(this).val();
		var canvas = document.getElementById('canvas');
		var ctx    = canvas.getContext('2d');
		ctx.fillStyle = '#000';
		ctx.clearRect(0, 4 * 14, 1000, 200);
		font.drawText(ctx, text, 10, 10 + ((1 + 4) * 14));

		font.drawEdgeText(ctx, text, 10, 10 + ((2 + 4) * 14));
		ctx.fillStyle = '#fff';
		font.drawText(ctx, text, 10, 10 + ((2 + 4) * 14));
	}

	$.get(fontURI, function (data) {
		console.log('loaded default font', data);
		font = new BDFFont(data);
		redraw();
	})

	$('#input1, #edge').bind('change keyup', redraw);

	$('#input2').keyup(redraw);

	$('#file').change(function (e) {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = function () {
			font = new BDFFont(reader.result);
			redraw();
		};
		reader.readAsText(file);
	});
});
