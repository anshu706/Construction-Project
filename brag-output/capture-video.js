/**
 * capture-video.js
 * Uses puppeteer to open the composition and capture a screencast using Chrome DevTools Protocol
 * Run: node capture-video.js
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const COMPOSITION_PATH = path.resolve(__dirname, 'composition/index.html');
const OUTPUT_DIR = path.resolve(__dirname, 'frames');
const DURATION_MS = 22000; // 22 seconds total
const FPS = 24;
const FRAME_INTERVAL_MS = Math.round(1000 / FPS);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const fileUrl = `file:///${COMPOSITION_PATH.replace(/\\/g, '/')}`;
  console.log(`Opening: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('Page loaded, starting frame capture...');
  
  let frameIndex = 0;
  const totalFrames = Math.ceil(DURATION_MS / FRAME_INTERVAL_MS);
  
  for (let i = 0; i < totalFrames; i++) {
    const framePath = path.join(OUTPUT_DIR, `frame-${String(i).padStart(5, '0')}.png`);
    await page.screenshot({ path: framePath, type: 'png' });
    
    if (i % FPS === 0) {
      console.log(`Captured second ${i / FPS} of ${DURATION_MS / 1000}...`);
    }
    
    await new Promise(r => setTimeout(r, FRAME_INTERVAL_MS));
    frameIndex++;
  }

  console.log(`\nCapture complete! ${frameIndex} frames saved to: ${OUTPUT_DIR}`);
  console.log('\nNow encode with ffmpeg:');
  console.log(`ffmpeg -framerate ${FPS} -i "${OUTPUT_DIR}/frame-%05d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 constructiq-launch.mp4`);

  await browser.close();
})();
