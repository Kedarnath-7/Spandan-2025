// Email Service - Uses API routes instead of direct SDK imports to avoid build issues

export const emailService = {
  // Send individual email
  async sendEmail({
    to,
    subject,
    htmlContent,
    sender = { name: 'Spandan Admin', email: 'noreply@spandan.com' },
    attachments = [],
    userId,
    emailType
  }: {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    sender?: { name: string; email: string };
    attachments?: Array<{ url?: string; content?: string; name: string }>;
    userId?: string;
    emailType?: string;
  }) {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          htmlContent,
          sender,
          attachments,
          userId,
          emailType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      return await response.json();
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },

  // Get email templates
  async getTemplates() {
    try {
      const response = await fetch('/api/email/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      return { success: true, templates: data.templates || [] };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return { success: false, error: 'Failed to fetch templates' };
    }
  },

  // Save email template
  async saveTemplate(type: string, subject: string, body: string) {
    try {
      const response = await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, subject, body })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving template:', error);
      return { success: false, error: 'Failed to save template' };
    }
  },

  // Get email logs
  async getLogs() {
    try {
      const response = await fetch('/api/email/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      return { success: true, logs: data.logs || [] };
    } catch (error) {
      console.error('Error fetching logs:', error);
      return { success: false, error: 'Failed to fetch logs' };
    }
  },

  // Send bulk email
  async sendBulkEmail(template: string, filter: string, subject: string, body: string) {
    try {
      const response = await fetch('/api/email/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey: template,
          filter,
          subject,
          body
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send bulk email');
      }

      const result = await response.json();
      return { success: true, sentCount: result.sentCount, totalRecipients: result.totalRecipients };
    } catch (error) {
      console.error('Bulk email service error:', error);
      return { success: false, error: 'Failed to send bulk email' };
    }
  }
};

// Legacy function exports for backward compatibility
export async function sendEmail({
  to,
  subject,
  htmlContent,
  sender = { name: 'Spandan Admin', email: 'noreply@spandan.com' },
  attachments = [],
  userId,
  emailType
}: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { name: string; email: string };
  attachments?: Array<{ url?: string; content?: string; name: string }>;
  userId?: string;
  emailType?: string;
}) {
  return emailService.sendEmail({
    to,
    subject,
    htmlContent,
    sender,
    attachments,
    userId,
    emailType
  });
}

// Send approval email with proper template variable replacement
export async function sendApprovalEmail({ user, template }: { user: any; template: any }) {
  const htmlContent = template.body
    .replace(/{{name}}/g, user.name || user.leader_name || '')
    .replace(/{{user_id}}/g, user.user_id || user.group_id || '')
    .replace(/{{college}}/g, user.college || '')
    .replace(/{{tier_pass}}/g, user.tier_pass || '')
    .replace(/{{event_name}}/g, user.event_name || '')
    .replace(/{{group_id}}/g, user.group_id || '')
    .replace(/{{created_at}}/g, user.created_at ? new Date(user.created_at).toLocaleDateString() : '');

  return sendEmail({
    to: [{ email: user.email || user.leader_email, name: user.name || user.leader_name }],
    subject: template.subject,
    htmlContent,
    userId: user.user_id || user.group_id,
    emailType: template.type
  });
}

// Send bulk email using API route (legacy function)
export async function sendBulkEmail({ templateKey, filter, subject, body }: { 
  templateKey: string; 
  filter: string; 
  subject: string; 
  body: string; 
}) {
  return emailService.sendBulkEmail(templateKey, filter, subject, body);
}
