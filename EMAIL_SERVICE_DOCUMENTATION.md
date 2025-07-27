# 📧 SPANDAN 2025 Email Service Documentation

## Overview
The email service is a comprehensive system for managing all email communications for SPANDAN 2025, including delegate approvals, event notifications, and bulk campaigns.

## 🎯 Core Capabilities

### 1. **Individual Email Sending**
- **Purpose**: Send personalized transactional emails
- **Provider**: Brevo (formerly SendinBlue) API
- **Features**:
  - Template variable replacement
  - Success/failure logging
  - Error tracking
  - Sender customization

### 2. **Bulk Email Campaigns**
- **Purpose**: Send emails to filtered user groups
- **Target Groups**:
  - Approved delegates
  - Paid participants
  - Event registrations
  - Tier-based filtering
- **Features**:
  - Progress tracking
  - Error reporting
  - Batch processing

### 3. **Email Templates Management**
- **Storage**: Supabase database
- **Template Types**:
  - `approval_tier` - Delegate registration approval
  - `approval_event` - Event registration approval
  - `rejection` - Registration rejection
  - `custom` - Admin-created templates
- **Features**:
  - Dynamic variable replacement
  - HTML content support
  - Admin editing interface

### 4. **Email Logging & Analytics**
- **Tracking**: Complete email history
- **Data Stored**:
  - Recipient details
  - Send status (sent/failed)
  - Error messages
  - Timestamps
  - Email type categorization

## 🔧 Technical Architecture

### API Routes
```
/api/email/send      - Individual email sending
/api/email/bulk      - Bulk campaigns
/api/email/templates - Template CRUD operations
/api/email/logs      - Email history retrieval
/api/email/test      - Service health check
```

### Key Files Structure
```
lib/services/
├── emailService.ts           # Main service interface
├── emailTemplateService.ts   # Template management
└── emailLogService.ts        # Logging service

lib/server/
├── brevoClient.ts           # Brevo API wrapper
└── emailLogService.ts       # Server-side logging

app/api/email/
├── send/route.ts           # Email sending API
├── bulk/route.ts           # Bulk email API
├── templates/route.ts      # Template management API
├── logs/route.ts          # Email logs API
└── test/route.ts          # Service testing API
```

## 📝 Template Variables

### Available Placeholders
| Variable | Description | Data Source |
|----------|-------------|-------------|
| `{{name}}` | Delegate/Leader name | `user.name` or `user.leader_name` |
| `{{user_id}}` | Delegate ID | `user.delegate_user_id` or `user.user_id` |
| `{{college}}` | College name | `user.college` |
| `{{tier_pass}}` | Tier/Pass type | `user.tier` or `user.tier_pass` |
| `{{event_name}}` | Event name | `user.event_name` or default |
| `{{group_id}}` | Group identifier | `user.group_id` |
| `{{created_at}}` | Registration date | `user.created_at` (formatted) |

### Variable Mapping Logic
The system intelligently maps data fields to template variables:
- Handles different data structures (registrations vs event registrations)
- Provides fallback values for missing data
- Formats dates appropriately

## 🚀 Usage Examples

### 1. Send Individual Email
```typescript
import { sendEmail } from '@/lib/services/emailService';

await sendEmail({
  to: [{ email: 'user@example.com', name: 'John Doe' }],
  subject: 'Welcome to SPANDAN 2025',
  htmlContent: '<h1>Welcome {{name}}!</h1>',
  userId: 'user123',
  emailType: 'welcome'
});
```

### 2. Send Approval Email
```typescript
import { sendApprovalEmail } from '@/lib/services/emailService';

await sendApprovalEmail({
  user: registrationData,
  template: approvalTemplate
});
```

### 3. Send Bulk Campaign
```typescript
import { emailService } from '@/lib/services/emailService';

await emailService.sendBulkEmail(
  'custom_template',
  'approved',
  'Event Update',
  'Hello {{name}}, here are the latest updates...'
);
```

## ⚙️ Configuration

### Environment Variables
```env
BREVO_API_KEY=your_brevo_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Sender Configuration
```typescript
// Default sender (configured in service)
{
  name: 'JIPMER STUDENT ASSOCIATION',
  email: 'jsa@jipmerspandan.in'
}
```

## 📊 Monitoring & Debugging

### Health Check
- Endpoint: `GET /api/email/test`
- Validates configuration
- Tests Brevo API connection
- Returns account information

### Email Logs
- Endpoint: `GET /api/email/logs`
- Filter by user ID or email type
- Track success/failure rates
- Debug delivery issues

### Error Handling
- Comprehensive error logging
- Graceful failure handling
- Retry mechanisms (where applicable)
- User-friendly error messages

## 🔄 Recent Improvements

### Fixed Issues
1. **Template Variable Mapping**: Enhanced variable replacement logic
2. **Data Field Resolution**: Better handling of different data structures
3. **Sender Configuration**: Corrected sender details for Brevo compliance
4. **Error Logging**: Improved error tracking and reporting

### Enhanced Features
1. **Smart Field Mapping**: Automatically resolves `tier_pass` from `tier` field
2. **Fallback Values**: Provides defaults for missing data
3. **Multiple ID Resolution**: Handles `delegate_user_id`, `user_id`, and `group_id`
4. **Subject Line Templates**: Template variables work in subject lines too

## 🎨 Admin Interface Features

### Template Management
- Visual template editor
- Real-time preview
- Variable insertion helpers
- Template type categorization

### Bulk Email Campaign
- Recipient filtering options
- Campaign preview
- Send progress tracking
- Delivery statistics

### Email History
- Complete send history
- Filter by date/type/user
- Export capabilities
- Error analysis

## 🚨 Common Issues & Solutions

### Issue 1: "Tier/Pass" showing empty
**Solution**: Updated variable mapping to use `user.tier` field

### Issue 2: "Group ID" instead of "User ID"
**Solution**: Enhanced field resolution to prioritize `delegate_user_id`

### Issue 3: Sender domain validation
**Solution**: Configured verified sender domain in Brevo

### Issue 4: Template variables not replacing
**Solution**: Added fallback field mapping and default values

## 📈 Performance Considerations

- **Bulk Emails**: Processed sequentially to avoid rate limits
- **Error Handling**: Failed emails don't stop the entire campaign
- **Logging**: Asynchronous logging to avoid blocking
- **Rate Limiting**: Respects Brevo API limits

## 🔮 Future Enhancements

1. **Email Templates**: Rich text editor with drag-drop
2. **Scheduling**: Delayed email sending
3. **Segmentation**: Advanced recipient filtering
4. **Analytics**: Open/click tracking
5. **Attachments**: File attachment support
6. **Multi-language**: Template localization

---

*Last Updated: July 26, 2025*
*Version: 2.0*
