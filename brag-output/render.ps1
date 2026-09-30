$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:HYPERFRAMES_BROWSER_PATH = "C:\Users\DELL\.cache\puppeteer\chrome-headless-shell\win64-148.0.7778.97\chrome-headless-shell-win64\chrome-headless-shell.exe"
Set-Location "d:\0.PROJECTS\Construction-Project\brag-output\composition"
npx hyperframes render --output "../constructiq-launch.mp4"

