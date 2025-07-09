# 🚀 SPANDAN 2025 - Deployment Guide

## Quick Deployment to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free)
- Your Supabase project running

### Step 1: Prepare for Deployment

1. **Push to GitHub**
   ```bash
   # Initialize git repository (if not already done)
   git init
   git add .
   git commit -m "Initial commit - SPANDAN 2025 registration system"
   
   # Create GitHub repository and push
   # Go to github.com and create a new repository named "spandan-2025"
   git remote add origin https://github.com/YOUR_USERNAME/spandan-2025.git
   git branch -M main
   git push -u origin main
   ```

2. **Environment Variables Setup**
   - Copy your `.env.local` variables - you'll need them for Vercel

### Step 2: Deploy to Vercel

1. **Connect GitHub to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   - In Vercel dashboard, go to project settings
   - Add these environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://nqradrvcababsofnbitm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SENDER_API_KEY=your_sender_api_key
   ADMIN_EMAIL=admin@fest2024.com
   ADMIN_PASSWORD=your_secure_password
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-project-name.vercel.app`

### Step 3: Configure Supabase for Production

1. **Update Supabase Auth Settings**
   - Go to your Supabase dashboard
   - Navigate to Authentication > URL Configuration
   - Add your Vercel domain to:
     - Site URL: `https://your-project-name.vercel.app`
     - Redirect URLs: `https://your-project-name.vercel.app/auth/callback`

2. **Database Setup**
   - Run your SQL files in Supabase SQL editor:
     1. `SCHEMA_RESET.sql` (if starting fresh)
     2. `PURE_UNIFIED_SYSTEM_COMPLETE.sql`
     3. `FIX_USERS_TABLE.sql`

## Alternative Deployment Options

### Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Railway
1. Connect GitHub repository
2. Railway auto-detects Next.js
3. Add environment variables
4. Deploy automatically

## Custom Domain (Optional)

### Using Vercel
1. Purchase domain from any provider
2. In Vercel dashboard: Settings > Domains
3. Add your custom domain
4. Update DNS records as instructed

### SSL Certificate
- Automatically provided by Vercel/Netlify
- No additional configuration needed

## Post-Deployment Checklist

- [ ] Test user registration flow
- [ ] Test password reset functionality
- [ ] Test event registration
- [ ] Test admin panel access
- [ ] Test payment submission
- [ ] Test email notifications
- [ ] Configure monitoring/analytics (optional)

## Troubleshooting

### Common Issues:

1. **Build Errors**
   - Check TypeScript errors: `npm run build` locally
   - Fix any import/export issues

2. **Environment Variables**
   - Ensure all required env vars are set in deployment platform
   - Restart deployment after adding env vars

3. **Supabase Connection**
   - Verify URLs and keys in environment variables
   - Check Supabase dashboard for correct configuration

4. **Authentication Issues**
   - Ensure redirect URLs are correctly configured
   - Check CORS settings in Supabase

## Performance Optimization

1. **Enable Analytics**
   - Vercel Analytics (free tier available)
   - Google Analytics integration

2. **Monitoring**
   - Vercel provides performance monitoring
   - Set up error tracking with services like Sentry

## Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` to repository
   - Use platform-specific environment variable managers

2. **Supabase Security**
   - Enable Row Level Security (RLS) on all tables
   - Regularly rotate API keys
   - Monitor authentication logs

## Support

For deployment issues:
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Netlify: [docs.netlify.com](https://docs.netlify.com)
- Supabase: [supabase.com/docs](https://supabase.com/docs)

---

**🎉 Your SPANDAN 2025 registration system is ready for the world!**
