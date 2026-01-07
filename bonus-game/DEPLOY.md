# How to Share and Deploy the Game

## Option 1: GitHub Pages (Free & Easy) ⭐ Recommended

### Steps:
1. **Create a GitHub account** (if you don't have one): https://github.com

2. **Create a new repository:**
   - Go to https://github.com/new
   - Name it: `bonus-game` (or any name you like)
   - Make it **Public**
   - Don't initialize with README
   - Click "Create repository"

3. **Upload your files:**
   ```bash
   cd /Users/michalru/Desktop/Rufelsor/bonus-game
   git init
   git add index.html styles.css app.js dictionary.js README.md
   git commit -m "Initial commit - Bonus game"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bonus-game.git
   git push -u origin main
   ```
   (Replace YOUR_USERNAME with your GitHub username)

4. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **main** branch
   - Click **Save**
   - Your game will be live at: `https://YOUR_USERNAME.github.io/bonus-game/`

## Option 2: Netlify Drop (Easiest - No Account Needed)

1. Go to https://app.netlify.com/drop
2. Drag and drop the `bonus-game` folder
3. Get instant URL to share!

## Option 3: Vercel (Free)

1. Install Vercel CLI: `npm i -g vercel`
2. In the bonus-game folder, run: `vercel`
3. Follow the prompts
4. Get a shareable URL

## Option 4: Local Network (Same WiFi)

If you're on the same WiFi network:

```bash
cd /Users/michalru/Desktop/Rufelsor/bonus-game
python3 -m http.server 8000
```

Then share your local IP address:
- Find your IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Share: `http://YOUR_IP:8000`

## Option 5: Simple File Sharing

1. Zip the folder: `bonus-game.zip`
2. Share via:
   - Email
   - Google Drive
   - Dropbox
   - WeTransfer
3. Recipient downloads and opens `index.html`

---

## Recommended: GitHub Pages
- ✅ Free forever
- ✅ Easy to update (just push changes)
- ✅ Professional URL
- ✅ Works on all devices
- ✅ No server maintenance



