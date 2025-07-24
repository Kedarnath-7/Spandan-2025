# Event Registration System

## Overview

The Event Registration System is a comprehensive solution for managing event registrations in the SPANDAN 2025 Comic Chronicles platform. It allows approved users to register groups for individual events with validation, capacity management, and payment tracking.

## Key Features

### 🎫 **Event Registration Flow**
- **4-Step Process**: Event Selection → Registration Details → Payment → Review & Submit
- **User Validation**: Only approved tier/pass registration holders can participate
- **Group Registration**: Support for multiple participants per registration
- **Single Event Focus**: Each registration is for one specific event

### 👥 **User Management**
- **Approved User Validation**: All participants must have approved tier/pass registrations
- **Contact Person System**: One approved user acts as the group contact
- **Auto-fill Information**: User details populated from existing registrations

### 💰 **Payment Integration**
- **Transaction Tracking**: Payment transaction ID required
- **Screenshot Upload**: Optional payment proof upload
- **Amount Calculation**: Event price × number of participants
- **No Group Discounts**: Simple per-person pricing

### 📊 **Admin Management**
- **Registration Review**: Approve, reject, or delete registrations
- **Detailed Views**: Complete registration and member information
- **Status Tracking**: Pending, approved, rejected states
- **Export Functionality**: CSV export for reporting
- **Statistics Dashboard**: Registration counts and revenue tracking

### 🔒 **Security & Validation**
- **Capacity Management**: Event participant limits enforced
- **User Verification**: Database-level validation against approved registrations
- **Row Level Security**: Secure data access policies
- **Audit Trail**: Review tracking with timestamps and reviewer information

## System Architecture

### Database Schema

#### Core Tables
```sql
-- Event Registrations (Group Level)
event_registrations
├── group_id (EVT-XXXXXXXX format)
├── event_id (foreign key)
├── contact information
├── payment details
└── status tracking

-- Event Registration Members (Individual Level)
event_registration_members
├── user_id (validated against approved registrations)
├── personal information
├── group membership
└── original registration reference
```

#### Validation Functions
- `validate_approved_user_id()` - Ensures user is in approved tier/pass registrations
- `get_approved_user_details()` - Retrieves user information for auto-fill
- `check_event_capacity()` - Validates event capacity before registration
- `generate_event_group_id()` - Creates unique group identifiers

### Frontend Components

#### User-Facing Pages
- **`/events/register`** - Main registration interface with step-by-step flow
- **Navigation Integration** - Accessible from main navigation menu

#### Admin Interface
- **`/admin/event-registrations`** - Complete admin management interface
- **Dashboard Integration** - Links from main admin dashboard

### Service Layer
- **`eventRegistrationService.ts`** - Complete CRUD operations for event registrations
- **Integration** - Works with existing event and user services

## User Journey

### For Participants

1. **Access**: Navigate to `/events/register` from main navigation
2. **Event Selection**: Choose from available events with details and pricing
3. **Registration Details**: 
   - Select contact person (must be approved user)
   - Add group members (all must be approved users)
   - Auto-fill information from existing registrations
4. **Payment**: Provide transaction ID and optional screenshot
5. **Review**: Confirm all details before submission
6. **Submission**: Receive confirmation with group ID

### For Administrators

1. **Access**: Navigate to `/admin/event-registrations` from admin dashboard
2. **Overview**: View statistics and filter registrations
3. **Review**: 
   - View detailed registration information
   - See all group members and their details
   - Check payment information
4. **Actions**:
   - Approve registrations
   - Reject with reason
   - Delete if necessary
5. **Export**: Generate CSV reports for analysis

## Integration Points

### With Existing Systems

#### Tier/Pass Registration System
- **User Validation**: All event registration participants must have approved tier/pass registrations
- **Data Sharing**: User information populated from existing group_members table
- **Parallel Operation**: Operates alongside tier/pass system without conflicts

#### Events Management
- **Event Selection**: Registers for events from the events management system
- **Capacity Tracking**: Respects max_participants settings
- **Category Support**: Works with all event categories including custom ones

#### Admin Dashboard
- **Unified Interface**: Integrated into existing admin dashboard
- **Consistent Design**: Follows established UI patterns
- **Navigation**: Clear separation between tier/pass and event registrations

#### Payment System
- **Transaction Tracking**: Consistent with existing payment handling
- **Screenshot Storage**: Optional payment proof system
- **Amount Calculation**: Simple multiplication without complex pricing tiers

## Technical Implementation

### Database Considerations
- **Foreign Key Relationships**: Maintains referential integrity with events table
- **Validation Constraints**: Ensures data consistency through database functions
- **Performance**: Indexed columns for efficient queries
- **Security**: Row Level Security policies for data protection

### Frontend Architecture
- **React Components**: Modern functional components with hooks
- **State Management**: Local state with proper validation
- **UI/UX**: Consistent with existing design system
- **Responsive**: Mobile-friendly design

### API Design
- **Service Layer**: Clean separation between frontend and database
- **Error Handling**: Comprehensive error messages and validation
- **Type Safety**: Full TypeScript integration
- **Async Operations**: Proper loading states and user feedback

## Configuration

### Environment Setup
- **Database**: Requires Supabase with proper migrations applied
- **Authentication**: Uses existing admin authentication system
- **Storage**: File upload support for payment screenshots (optional)

### Deployment Notes
- **Migration Order**: Apply database migrations in sequence
- **Testing**: Verify user validation and capacity checking
- **Monitoring**: Track registration success rates and errors

## Monitoring & Analytics

### Key Metrics
- **Registration Volume**: Track registrations per event
- **Conversion Rates**: Monitor step completion in registration flow
- **Capacity Utilization**: Event fill rates
- **Payment Success**: Transaction completion rates

### Admin Insights
- **Dashboard Statistics**: Real-time registration counts
- **Revenue Tracking**: Payment amount aggregation
- **Status Distribution**: Pending vs approved registrations
- **Export Capabilities**: Detailed reporting for analysis

## Future Enhancements

### Potential Features
- **Email Notifications**: Automated status updates
- **Payment Gateway Integration**: Direct payment processing
- **Waitlist Management**: Handle oversubscribed events
- **Group Messaging**: Communication tools for registered groups
- **QR Code Generation**: Digital tickets for events
- **Calendar Integration**: Event reminders and scheduling

### Scalability Considerations
- **Database Optimization**: Query performance monitoring
- **File Storage**: Efficient payment screenshot handling
- **Cache Strategy**: Reduce database load for frequently accessed data
- **API Rate Limiting**: Prevent abuse and ensure fair usage

## Support & Maintenance

### Regular Tasks
- **Data Backup**: Ensure registration data is properly backed up
- **Performance Monitoring**: Track query performance and response times
- **Security Updates**: Keep dependencies and security policies current
- **User Feedback**: Monitor and address user experience issues

### Troubleshooting
- **Common Issues**: User validation failures, capacity errors
- **Debug Tools**: Database logs and frontend error tracking
- **Support Workflow**: Clear escalation path for technical issues
