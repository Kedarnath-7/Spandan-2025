// Test script to debug event registration email data
// Run this in browser console on the event registrations admin page

async function testEventRegistrationEmail() {
  try {
    // Get a pending registration group ID from the page
    const firstGroupId = document.querySelector('[data-group-id]')?.getAttribute('data-group-id');
    
    if (!firstGroupId) {
      console.log('No group ID found on page');
      return;
    }
    
    console.log('Testing with group ID:', firstGroupId);
    
    // Import the service
    const { getEventRegistrationByGroupId } = await import('/lib/services/eventRegistrationService.js');
    const regResult = await getEventRegistrationByGroupId(firstGroupId);
    
    console.log('=== EVENT REGISTRATION DATA ===');
    console.log('Success:', regResult.success);
    console.log('Full data:', JSON.stringify(regResult.data, null, 2));
    
    if (regResult.data) {
      console.log('=== KEY FIELDS ===');
      console.log('contact_email:', regResult.data.contact_email);
      console.log('contact_name:', regResult.data.contact_name);
      console.log('contact_user_id:', regResult.data.contact_user_id);
      console.log('event_name:', regResult.data.event_name);
      console.log('members count:', regResult.data.members?.length);
      if (regResult.data.members && regResult.data.members.length > 0) {
        console.log('first member college:', regResult.data.members[0].college);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testEventRegistrationEmail();
