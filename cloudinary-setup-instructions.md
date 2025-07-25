# Cloudinary Setup Instructions

## URLs to Update in Your Code

### 1. Find Your Cloud Name
After creating your Cloudinary account, your cloud name will be something like: `your-unique-cloud-name`

### 2. Update app/page.tsx

Replace these placeholder URLs with your actual Cloudinary URLs:

**For Brochure Download (Line ~25):**
```javascript
// REPLACE THIS:
const cloudinaryDownloadUrl = 'https://res.cloudinary.com/your-cloud-name/image/upload/fl_attachment/spandan-brochure-2025.pdf';

// WITH THIS (using your actual cloud name):
const cloudinaryDownloadUrl = 'https://res.cloudinary.com/YOUR_ACTUAL_CLOUD_NAME/image/upload/fl_attachment/spandan-brochure-2025.pdf';
```

**For Video Streaming (Line ~55):**
```javascript
// REPLACE THIS:
const cloudinaryVideoUrl = 'https://res.cloudinary.com/your-cloud-name/video/upload/q_auto:good/spandan-2024-aftermovie.mp4';

// WITH THIS (using your actual cloud name):
const cloudinaryVideoUrl = 'https://res.cloudinary.com/YOUR_ACTUAL_CLOUD_NAME/video/upload/q_auto:good/spandan-2024-aftermovie.mp4';
```

**For Video Poster Image (Line ~280):**
```javascript
// REPLACE THIS:
poster="https://res.cloudinary.com/your-cloud-name/image/upload/spandan-2024-aftermovie.jpg"

// WITH THIS (using your actual cloud name):
poster="https://res.cloudinary.com/YOUR_ACTUAL_CLOUD_NAME/image/upload/spandan-2024-aftermovie.jpg"
```

## Example with Real Cloud Name

If your cloud name is `spandan-jipmer-2025`, your URLs would be:

```javascript
// Brochure download
const cloudinaryDownloadUrl = 'https://res.cloudinary.com/spandan-jipmer-2025/image/upload/fl_attachment/spandan-brochure-2025.pdf';

// Video streaming  
const cloudinaryVideoUrl = 'https://res.cloudinary.com/spandan-jipmer-2025/video/upload/q_auto:good/spandan-2024-aftermovie.mp4';

// Video poster
poster="https://res.cloudinary.com/spandan-jipmer-2025/image/upload/spandan-2024-aftermovie.jpg"
```

## Public IDs to Use When Uploading

- **Brochure PDF**: `spandan-brochure-2025`
- **Video File**: `spandan-2024-aftermovie`
- **Video Thumbnail**: `spandan-2024-aftermovie` (Cloudinary auto-generates from video)

## File Upload Tips

1. **PDF Upload**: Upload your PDF and set public_id to `spandan-brochure-2025`
2. **Video Upload**: Upload your video and set public_id to `spandan-2024-aftermovie`
3. **Automatic Thumbnail**: Cloudinary automatically creates a thumbnail from your video

## Testing Your Setup

1. Upload files to Cloudinary with correct public IDs
2. Update the cloud name in your code  
3. Test the brochure download button
4. Test the video play button
5. Both should work seamlessly!

## Cloudinary Features You Get

✅ **Direct PDF Download**: `fl_attachment` forces download
✅ **Video Streaming**: No need to download entire file
✅ **Auto Optimization**: Videos optimized for user's device
✅ **Global CDN**: Fast loading worldwide
✅ **Automatic Thumbnails**: Video poster images generated automatically
✅ **Responsive Delivery**: Adapts to screen size and connection speed
