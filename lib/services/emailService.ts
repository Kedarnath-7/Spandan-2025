// Email Service - Uses API routes instead of direct SDK imports to avoid build issues

export const emailService = {
  // Send individual email
  async sendEmail({
    to,
    subject,
    htmlContent,
    sender = { name: 'JIPMER STUDENT ASSOCIATION', email: 'jsa@jipmerspandan.in' },
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
  sender = { name: 'JIPMER STUDENT ASSOCIATION', email: 'jsa@jipmerspandan.in' },
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
  // Enhanced variable replacement supporting both tier/pass and event registrations
  console.log('=== EMAIL SERVICE DEBUG ===');
  console.log('User data received:', JSON.stringify(user, null, 2));
  console.log('Template type:', template?.type);
  
  let tierPassInfo = '';
  
  // Handle tier/pass registration data (EnhancedRegistrationView)
  if (user.tier) {
    tierPassInfo = user.tier;
  } else if (user.pass_type) {
    tierPassInfo = user.pass_tier ? `${user.pass_type} ${user.pass_tier}` : user.pass_type;
  }
  
  // Handle event registration data (EventRegistration) - different field names
  const eventInfo = user.event_name || '';
  
  // Enhanced field resolution for different data structures
  const userId = user.user_id || user.delegate_user_id || user.pass_id || user.contact_user_id || '';
  const userName = user.name || user.leader_name || user.contact_name || '';
  const userEmail = user.email || user.leader_email || user.contact_email || '';
  
  // For tier/pass registrations, try to get college from the first member
  let userCollege = user.college || '';
  if (!userCollege && user.members && user.members.length > 0) {
    userCollege = user.members[0].college || '';
  }
  
  console.log('Resolved fields:', JSON.stringify({ 
    userId, 
    userName, 
    userEmail, 
    userCollege, 
    tierPassInfo, 
    eventInfo,
    hasMembers: !!user.members,
    memberCount: user.members?.length || 0,
    dataStructure: user.members ? 'Enhanced with members array' : 'Legacy with member_selections',
    isEventRegistration: !!eventInfo,
    eventName: user.event_name,
    originalEventInfo: eventInfo
  }, null, 2));
  
  // PRIORITY 1: For event registrations with members array, send emails to ALL members  
  if (user.members && user.members.length > 0 && eventInfo) {
    console.log('Event registration detected - sending emails to all', user.members.length, 'members');
    
    const emailPromises = user.members.map(async (member: any) => {
      const memberEmail = member.email;
      const memberName = member.name;
      const memberUserId = member.user_id;
      const memberCollege = member.college;
      
      // Validate member email
      if (!memberEmail || !memberEmail.includes('@')) {
        console.error('Invalid member email detected:', memberEmail, 'for member:', memberName);
        return { success: false, error: `Invalid email for ${memberName}: ${memberEmail}` };
      }
      
      console.log(`Sending event approval email to member: ${memberName} (${memberEmail})`);
      
      // Customize content for each member
      const memberHtmlContent = template.body
        .replace(/{{name}}/g, memberName)
        .replace(/{{user_id}}/g, memberUserId)
        .replace(/{{college}}/g, memberCollege)
        .replace(/{{tier_pass}}/g, '')
        .replace(/{{event_name}}/g, eventInfo)
        .replace(/{{group_id}}/g, user.group_id || '')
        .replace(/{{created_at}}/g, user.created_at ? new Date(user.created_at).toLocaleDateString() : '');

      const memberSubject = template.subject
        .replace(/{{name}}/g, memberName)
        .replace(/{{user_id}}/g, memberUserId)
        .replace(/{{event_name}}/g, eventInfo || 'SPANDAN 2025');

      try {
        await sendEmail({
          to: [{ email: memberEmail, name: memberName }],
          subject: memberSubject,
          htmlContent: memberHtmlContent,
          userId: memberUserId,
          emailType: template.type
        });
        return { success: true, member: memberName, email: memberEmail };
      } catch (error) {
        console.error(`Failed to send email to ${memberName}:`, error);
        return { success: false, error: error, member: memberName, email: memberEmail };
      }
    });
    
    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Event email sending complete: ${successful} successful, ${failed} failed`);
    if (failed > 0) {
      console.log('Failed emails:', results.filter(r => !r.success));
    }
    
    console.log('Successful event emails sent to:');
    results.filter(r => r.success).forEach(r => {
      console.log(`- ${r.member} (${r.email})`);
    });
    
    return {
      success: true,
      message: `Sent ${successful} event emails successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      details: results
    };
  }
  
  // PRIORITY 2: For tier/pass registrations with members array, send emails to ALL members
  if (user.members && user.members.length > 0) {
    console.log('Enhanced tier/pass registration detected - sending emails to all', user.members.length, 'members');
    
    const emailPromises = user.members.map(async (member: any) => {
      const memberEmail = member.email;
      const memberName = member.name;
      const memberUserId = member.user_id || member.delegate_user_id || member.pass_id;
      const memberCollege = member.college;
      const memberTierPass = member.tier || (member.pass_type && member.pass_tier ? `${member.pass_type} ${member.pass_tier}` : member.pass_type) || '';
      
      // Validate member email
      if (!memberEmail || !memberEmail.includes('@')) {
        console.error('Invalid member email detected:', memberEmail, 'for member:', memberName);
        return { success: false, error: `Invalid email for ${memberName}: ${memberEmail}` };
      }
      
      console.log(`Sending tier/pass approval email to member: ${memberName} (${memberEmail}) - ${memberTierPass}`);
      
      // Customize content for each member
      const memberHtmlContent = template.body
        .replace(/{{name}}/g, memberName)
        .replace(/{{user_id}}/g, memberUserId)
        .replace(/{{college}}/g, memberCollege)
        .replace(/{{tier_pass}}/g, memberTierPass)
        .replace(/{{event_name}}/g, '')
        .replace(/{{group_id}}/g, user.group_id || '')
        .replace(/{{created_at}}/g, user.created_at ? new Date(user.created_at).toLocaleDateString() : '');

      const memberSubject = template.subject
        .replace(/{{name}}/g, memberName)
        .replace(/{{user_id}}/g, memberUserId)
        .replace(/{{event_name}}/g, 'SPANDAN 2025');

      try {
        await sendEmail({
          to: [{ email: memberEmail, name: memberName }],
          subject: memberSubject,
          htmlContent: memberHtmlContent,
          userId: memberUserId,
          emailType: template.type
        });
        return { success: true, member: memberName, email: memberEmail, selection: memberTierPass };
      } catch (error) {
        console.error(`Failed to send email to ${memberName}:`, error);
        return { success: false, error: error, member: memberName, email: memberEmail };
      }
    });
    
    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Tier/Pass email sending complete: ${successful} successful, ${failed} failed`);
    if (failed > 0) {
      console.log('Failed emails:', results.filter(r => !r.success));
    }
    
    console.log('Successful emails sent to:');
    results.filter(r => r.success).forEach(r => {
      console.log(`- ${r.member} (${r.email}) - ${r.selection}`);
    });
    
    return {
      success: true,
      message: `Sent ${successful} emails successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      details: results
    };
  }
  
  // For tier/pass registrations (single contact email)
  console.log('Tier/Pass registration detected - sending to single contact:', userName, userEmail);
  
  // Validate email before proceeding
  if (!userEmail || !userEmail.includes('@')) {
    console.error('Invalid email detected:', userEmail);
    throw new Error(`Invalid email address: ${userEmail}`);
  }
  
  const htmlContent = template.body
    .replace(/{{name}}/g, userName)
    .replace(/{{user_id}}/g, userId)
    .replace(/{{college}}/g, userCollege)
    .replace(/{{tier_pass}}/g, tierPassInfo)
    .replace(/{{event_name}}/g, eventInfo)
    .replace(/{{group_id}}/g, user.group_id || '')
    .replace(/{{created_at}}/g, user.created_at ? new Date(user.created_at).toLocaleDateString() : '');

  // Enhanced subject line replacement
  const finalSubject = template.subject
    .replace(/{{name}}/g, userName)
    .replace(/{{user_id}}/g, userId)
    .replace(/{{event_name}}/g, eventInfo || 'SPANDAN 2025');

  return sendEmail({
    to: [{ email: userEmail, name: userName }],
    subject: finalSubject,
    htmlContent,
    userId: userId,
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
