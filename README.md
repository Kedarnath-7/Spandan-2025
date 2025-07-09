# College Fest Registration Website

A full-stack event registration platform built with Next.js, Supabase, and Tailwind CSS for college festivals.

## Features

- **Delegate Pass Registration**: Multi-tier delegate passes with payment verification
- **Event Registration**: Browse and register for events across different categories
- **Payment Processing**: UPI-based payment system with screenshot verification
- **Admin Dashboard**: Comprehensive admin panel for managing registrations
- **Email Notifications**: Automated email confirmations via Sender.net
- **Responsive Design**: Mobile-friendly interface with modern UI

## Tech Stack

- **Frontend**: Next.js 13 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Email Service**: Sender.net API integration
- **UI Components**: shadcn/ui
- **Deployment**: Netlify-ready

## Quick Start

### 1. Environment Setup

Create a `.env.local` file with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SENDER_API_KEY=your_sender_api_key
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the migration file in `supabase/migrations/create_schema.sql`
3. Create storage buckets for payment screenshots
4. Set up Row Level Security policies

### 3. Admin Account Setup

Create an admin user in Supabase Auth:
- Email: admin@fest2024.com
- Password: your_secure_password

### 4. Development

```bash
npm install
npm run dev
```

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage
│   ├── register/page.tsx         # Delegate registration
│   ├── events/page.tsx           # Event listing and cart
│   ├── payment/page.tsx          # Payment processing
│   └── admin/                    # Admin dashboard
├── components/ui/                # shadcn/ui components
├── lib/                          # Utilities and types
├── supabase/                     # Database and functions
│   ├── migrations/               # Database schema
│   └── functions/                # Edge functions
└── middleware.ts                 # Authentication middleware
```

## Key Features

### Delegate Pass System
- 4 tier options: Tier 1 ($10), Tier 2 ($20), Tier 3 ($30), Lit Pass ($25)
- Payment verification with screenshot upload
- Unique delegate ID generation upon approval

### Event Registration
- 5 categories: Culturals, Sports, Fine Arts, Literary, Academic
- Cart system with delegate ID verification
- Category-specific pricing and requirements

### Admin Dashboard
- Approve/reject delegate registrations
- Manage event registrations
- View payment screenshots
- Export data as CSV
- Real-time statistics

### Email System
- Automated confirmation emails
- Delegate ID notifications
- Event registration confirmations
- Powered by Sender.net API

## Database Schema

- `users`: User profiles
- `delegate_registrations`: Delegate pass data
- `events`: Available events
- `event_registrations`: User event registrations
- `payments`: Payment records

## Security Features

- Row Level Security (RLS) on all tables
- Protected admin routes
- File upload validation
- Input sanitization
- Secure API endpoints

## Deployment

1. Deploy to Netlify
2. Set environment variables
3. Configure domain and SSL
4. Set up Supabase Edge Functions

## API Documentation

### Edge Functions
- `/functions/v1/send-email`: Email sending
- `/functions/v1/approve-delegate`: Delegate approval
- `/functions/v1/approve-events`: Event approval

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your college events!