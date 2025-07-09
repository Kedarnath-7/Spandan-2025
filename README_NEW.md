# 🎉 SPANDAN 2025 - College Fest Registration System

A modern, full-stack web application for college fest event registration built with Next.js, Supabase, and TypeScript.

![SPANDAN 2025](https://img.shields.io/badge/SPANDAN-2025-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue?style=for-the-badge&logo=typescript)

## ✨ Features

### 🎯 **Core Functionality**
- **User Authentication** - Secure signup/login with Supabase Auth
- **Event Registration** - Browse and register for multiple events
- **Payment Integration** - UPI-based payment system with screenshot upload
- **Profile Management** - Complete user profile with password change
- **Admin Dashboard** - Comprehensive admin panel for event and registration management

### 🎨 **User Experience**
- **Responsive Design** - Beautiful UI that works on all devices
- **Real-time Updates** - Live cart updates and registration status
- **Modern UI Components** - Built with Shadcn/UI and Tailwind CSS
- **Smooth Animations** - Enhanced user interactions

### 🔐 **Security & Data**
- **Row Level Security** - Supabase RLS for data protection
- **Type Safety** - Full TypeScript implementation
- **Input Validation** - Comprehensive form validation
- **Secure File Upload** - Safe payment screenshot handling

## 🛠️ **Tech Stack**

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS, Shadcn/UI Components
- **Backend:** Supabase (Database, Auth, Storage)
- **Payment:** UPI Integration with QR Code Generation
- **Deployment:** Vercel Ready

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/spandan-2025.git
   cd spandan-2025
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SENDER_API_KEY=your_sender_api_key
   ADMIN_EMAIL=admin@fest2024.com
   ```

4. **Database Setup**
   Run the SQL files in your Supabase SQL editor:
   - `SCHEMA_RESET.sql`
   - `PURE_UNIFIED_SYSTEM_COMPLETE.sql`
   - `FIX_USERS_TABLE.sql`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📊 **Database Schema**

### Unified Registration System
- **users** - User profiles and authentication
- **events** - Available fest events
- **registrations** - Unified registration data
- **Storage** - Payment screenshots and files

## 🎮 **Usage**

### For Students
1. **Sign Up** - Create account with basic details
2. **Complete Profile** - Add college, year, branch information
3. **Browse Events** - Explore events across categories
4. **Add to Cart** - Select multiple events
5. **Payment** - Complete UPI payment with screenshot
6. **Track Status** - Monitor registration approval

### For Admins
1. **Dashboard** - Overview of registrations and stats
2. **Event Management** - Create and manage events
3. **Registration Review** - Approve/reject registrations
4. **Payment Verification** - Review payment screenshots
5. **Data Export** - Generate reports and CSV exports

## 🔧 **Configuration**

### Event Categories
- Cultural Events
- Sports Events  
- Fine Arts
- Literary Events
- Academic Events

### Registration Tiers
- **Tier 1** (₹375) - Basic access
- **Tier 2** (₹650) - Premium access  
- **Tier 3** (₹850) - VIP access

## 🌐 **Deployment**

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy automatically

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📚 **Documentation**

- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `DATABASE_SETUP_AND_TESTING.md` - Database configuration
- `COMPLETE_PASSWORD_CHANGE_IMPLEMENTATION.md` - Password features

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 **License**

MIT License - see LICENSE file for details.

## 📞 **Support**

For support: spandan2025@jipmer.edu.in

---

**Built with ❤️ for SPANDAN 2025 - JIPMER's Premier College Fest**

🌟 **Star this repository if you found it helpful!**
