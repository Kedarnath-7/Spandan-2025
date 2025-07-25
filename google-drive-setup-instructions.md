# Google Drive Setup Guide - Complete Instructions

## 🎯 Why Google Drive is Perfect:
✅ **Free**: No cost, generous storage limits
✅ **Reliable**: 99.9% uptime, Google's infrastructure  
✅ **Easy Setup**: Just upload and share, no technical knowledge needed
✅ **Fast**: Google's global CDN ensures fast downloads worldwide
✅ **No File Size Limits**: Upload files up to 5TB per file

---

## 📂 Step 1: Upload Your Files

### 1.1 Go to Google Drive
- Visit: [drive.google.com](https://drive.google.com)
- Sign in with your Google account

### 1.2 Upload Files
1. Click the **"+ New"** button
2. Select **"File upload"**
3. Choose your files:
   - **PDF Brochure** (e.g., "Spandan-2025-Brochure.pdf")
   - **Video File** (e.g., "Spandan-2024-After-Movie.mp4")
4. Wait for upload to complete

---

## 🔗 Step 2: Get Shareable Links

### For Each File:

1. **Right-click** on the uploaded file
2. Click **"Share"**
3. Click **"Change to anyone with the link"** 
4. Set permission to **"Viewer"**
5. Click **"Copy link"**

Your links will look like:
```
https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing
```

### Extract the File ID:
From the link above, the File ID is: `1A2B3C4D5E6F7G8H9I0J`
(It's the part between `/d/` and `/view`)

---

## 🔧 Step 3: Update Your Code

### 3.1 Find Your File IDs
- **Brochure PDF**: Extract ID from your PDF's share link
- **Video File**: Extract ID from your video's share link

### 3.2 Update the Code

Open `app/page.tsx` and find these lines:

**Line ~25 (Brochure Download):**
```javascript
// CURRENT:
const googleDriveFileId = 'YOUR_BROCHURE_FILE_ID';

// UPDATE TO (using your actual file ID):
const googleDriveFileId = '1A2B3C4D5E6F7G8H9I0J'; // Your brochure file ID
```

**Line ~50 (Video Streaming):**
```javascript
// CURRENT:  
const googleDriveVideoId = 'YOUR_VIDEO_FILE_ID';

// UPDATE TO (using your actual file ID):
const googleDriveVideoId = '1K2L3M4N5O6P7Q8R9S0T'; // Your video file ID
```

---

## 🧪 Step 4: Test Your Setup

### 4.1 Test Brochure Download
1. Start your development server: `npm run dev`
2. Navigate to your homepage
3. Click **"Download Brochure"** button
4. ✅ Should download your PDF file directly

### 4.2 Test Video Playback  
1. Click **"Check out the after movie"** 
2. ✅ Should open modal and play your video

---

## 🛠 Example Setup

### Real Example with Sample File IDs:

If your Google Drive links are:
- **Brochure**: `https://drive.google.com/file/d/1BxYz123ABC456DEF789/view?usp=sharing`
- **Video**: `https://drive.google.com/file/d/1QwEr789XYZ123ABC456/view?usp=sharing`

Then your code should be:
```javascript
// Brochure download (line ~25)
const googleDriveFileId = '1BxYz123ABC456DEF789';

// Video streaming (line ~50)  
const googleDriveVideoId = '1QwEr789XYZ123ABC456';
```

---

## 🔍 Troubleshooting

### Issue: "Access denied" or "File not found"
**Solution**: Make sure your files are set to "Anyone with the link can view"

### Issue: Download doesn't start
**Solution**: Check that you copied the file ID correctly (no extra characters)

### Issue: Video doesn't play
**Solution**: 
1. Ensure video is in MP4 format
2. Check file size (very large files may take time to load)
3. Try a smaller/compressed video file

### Issue: Slow loading
**Solution**: 
- Use compressed files when possible
- Google Drive may throttle very large files

---

## 🚀 Advanced Tips

### For Better Video Performance:
1. **Compress your video** before uploading (aim for 50-100MB)
2. **Use MP4 format** with H.264 codec for best compatibility
3. **Resolution**: 1080p is usually sufficient for web playback

### For PDFs:
1. **Optimize PDF size** before uploading
2. **Use descriptive filenames** for better user experience

### File Organization:
1. Create a **"Spandan 2025"** folder in Google Drive
2. Upload all files there for easy management
3. Consider creating subfolders: "Brochures", "Videos", etc.

---

## ✅ Final Checklist

- [ ] Upload brochure PDF to Google Drive
- [ ] Upload video file to Google Drive  
- [ ] Set both files to "Anyone with the link can view"
- [ ] Copy share links for both files
- [ ] Extract file IDs from the links
- [ ] Update `googleDriveFileId` in app/page.tsx (line ~25)
- [ ] Update `googleDriveVideoId` in app/page.tsx (line ~50)
- [ ] Test brochure download functionality
- [ ] Test video playback functionality
- [ ] ✅ Both features working perfectly!

**Setup Time**: 5-10 minutes
**Cost**: Free forever
**Reliability**: Enterprise-grade Google infrastructure

This setup will give you professional-quality file hosting with zero cost and maximum reliability!
