// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
	for (let y = 0; y < fgImg.height; y++) {
		for (let x = 0; x < fgImg.width; x++) {

			const bgX = x + fgPos.x;
			const bgY = y + fgPos.y;

            //  Skip pixels outside canvas
			if (bgX < 0 || bgX >= bgImg.width || bgY < 0 || bgY >= bgImg.height) continue;

            //  Compute indeces into the pixel data arrays
			const bgIndex = (bgY * bgImg.width + bgX) * 4;
			const fgIndex = (y * fgImg.width + x) * 4;

            //  Compute effective alpha values (normalized)
			const alpha_f = (fgImg.data[fgIndex + 3] / 255) * fgOpac;
			const alpha_b = bgImg.data[bgIndex + 3] / 255;

            //  Alpha Blending formula for final transparency
			const alpha_out = alpha_f + (1 - alpha_f) * alpha_b;

			if (alpha_out === 0) continue; // Avoid division by zero

            //  Blend each RGB channel
			for (let c = 0; c < 3; c++) {
                //  Get channel values
				const c_f = fgImg.data[fgIndex + c];
				const c_b = bgImg.data[bgIndex + c];

                //  Alpha blending formula for subpixel value
				const c_out = (alpha_f * c_f + (1 - alpha_f) * alpha_b * c_b) / alpha_out;

                //  Update final baground pixel
				bgImg.data[bgIndex + c] = Math.round(c_out);
			}

            //  Update final bacground transparency
			bgImg.data[bgIndex + 3] = Math.round(alpha_out * 255);
		}
	}
}

