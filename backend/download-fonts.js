const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontUrls = {
  'Roboto-Regular.ttf': 'https://cdnjs.cloudflare.com/ajax/libs/roboto-font/0.1.0/fonts/Roboto/Roboto-Regular.ttf',
  'Roboto-Bold.ttf': 'https://cdnjs.cloudflare.com/ajax/libs/roboto-font/0.1.0/fonts/Roboto/Roboto-Bold.ttf',
  'Roboto-Italic.ttf': 'https://cdnjs.cloudflare.com/ajax/libs/roboto-font/0.1.0/fonts/Roboto/Roboto-Italic.ttf'
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (Status Code: ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading Roboto fonts...');
  for (const [filename, url] of Object.entries(fontUrls)) {
    const dest = path.join(fontsDir, filename);
    try {
      await downloadFile(url, dest);
    } catch (err) {
      console.error(`Error downloading ${filename}:`, err);
    }
  }
  console.log('All downloads completed!');
}

main();
