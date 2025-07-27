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

  // Brevo API expects specific format
  const emailData = {
    to,
    sender: sender || { name: 'JIPMER STUDENT ASSOCIATION', email: 'jsa@jipmerspandan.in' },
    subject,
    htmlContent,
    ...(attachments && attachments.length > 0 && { attachment: attachments })
  };

  console.log('Sending email with data:', JSON.stringify(emailData, null, 2));

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(emailData)
  });

  const responseText = await response.text();
  console.log('Brevo API response status:', response.status);
  console.log('Brevo API response:', responseText);

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { message: responseText };
    }
    throw new Error(`Brevo API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const result = JSON.parse(responseText);
  return result;
}
