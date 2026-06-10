const Jimp = require('jimp');

async function removeWhite() {
  const image = await Jimp.read('public/logo.png');
  
  // We want to replace white or near-white with transparent
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const red = this.bitmap.data[idx + 0];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    const alpha = this.bitmap.data[idx + 3];

    // If it's near white (r,g,b > 240)
    if (red > 240 && green > 240 && blue > 240) {
      this.bitmap.data[idx + 3] = 0; // set alpha to 0 (transparent)
    }
  });

  await image.writeAsync('public/logo.png');
  console.log("Done");
}

removeWhite().catch(console.error);
