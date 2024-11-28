const compress_images = require("compress-images");

async function compress_image() {
  return new Promise((resolve, reject) => {
    compress_images(
      "ai/**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}",
      `${__dirname}/parser`,
      { compress_force: false, statistic: true, autoupdate: true },
      false,
      { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
      { png: { engine: "pngquant", command: ["--quality=20-30", "-o"] } },
      { svg: { engine: "svgo", command: "--multipass" } },
      {
        gif: {
          engine: "gifsicle",
          command: ["--colors", "64", "--use-col=web"],
        },
      },
      function (err, completed) {
        if (err) {
          reject(err);
        } else if (completed === true) {
          resolve(`${__dirname}/output.png`);
        } else {
          reject(new Error("Image compression failed."));
        }
      }
    );
  });
}

module.exports = { compress_image };
