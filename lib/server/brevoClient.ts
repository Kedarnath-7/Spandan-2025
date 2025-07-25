// Direct HTTP client for Brevo API - avoids SDK import issues
const BREVO_API_URL = 'https://api.brevo.com/v3';

export async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
  sender,
  attachments
}: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { name: string; email: string };
  attachments?: Array<{ url?: string; content?: string; name: string }>;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is required');
  }

  const emailData = {
    to,
    sender: sender || { name: 'Spandan Admin', email: 'noreply@spandan.com' },
    subject,
    htmlContent,
    ...(attachments && attachments.length > 0 && { attachment: attachments })
  };

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  return result;
}
