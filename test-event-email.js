// Test event registration email service
// Run this in browser console on the event registrations admin page

// Simulate the event registration data from your debug output
const testEventRegistration = {
  "id": "498f4532-47a4-43e5-8807-7527580e7e13",
  "group_id": "GRP-EVT-2FU0G8", 
  "event_id": "431b42ba-4ede-4c87-ac94-e18b9bb52b62",
  "event_name": "MALARKEY (Informal Debate)",
  "event_price": 150,
  "total_amount": 300,
  "member_count": 2,
  "payment_transaction_id": "968745123601",
  "payment_screenshot_path": "payment-screenshots/event_payment_968745123601_1753560203871.png",
  "contact_name": "Peter Parker",
  "contact_email": "kedarnath7218gtl@gmail.com", 
  "contact_phone": "9182525868",
  "contact_user_id": "USER-DEED-90CC01",
  "status": "approved",
  "reviewed_by": "admin",
  "reviewed_at": "2025-07-26T20:03:37.95+00:00",
  "rejection_reason": null,
  "created_at": "2025-07-26T20:03:26.477583+00:00",
  "updated_at": "2025-07-26T20:03:37.95+00:00",
  "members": [
    {
      "id": "b3909d2a-3d07-45a9-aaaa-bea3e0adbef8",
      "group_id": "GRP-EVT-2FU0G8",
      "user_id": "USER-DEED-90CC01", 
      "name": "Peter Parker",
      "email": "kedarnath7218gtl@gmail.com",
      "college": "SRM",
      "phone": "9182525868",
      "original_group_id": "GRP-D719BDA7",
      "member_order": 1,
      "created_at": "2025-07-26T20:03:26.527406+00:00"
    },
    {
      "id": "ebbe6c08-c3f8-4434-a22e-a280abd3abaf",
      "group_id": "GRP-EVT-2FU0G8",
      "user_id": "USER-PANFS-D68FC8",
      "name": "Kedarnath", 
      "email": "kedarnath8595gtl@gmail.com",
      "college": "Asgard University",
      "phone": "9874632102",
      "original_group_id": "GRP-D719BDA7",
      "member_order": 2,
      "created_at": "2025-07-26T20:03:26.527406+00:00"
    }
  ],
  "group_members": "Peter Parker (USER-DEED-90CC01), Kedarnath (USER-PANFS-D68FC8)"
};

console.log('=== EVENT EMAIL TEST ===');
console.log('Test data structure:');
console.log('- Event name:', testEventRegistration.event_name);
console.log('- Contact email:', testEventRegistration.contact_email);
console.log('- Contact name:', testEventRegistration.contact_name);
console.log('- Members array:', testEventRegistration.members?.length || 0, 'members');
console.log('- Member emails:');
testEventRegistration.members?.forEach((member, i) => {
  console.log(`  ${i+1}. ${member.name} - ${member.email} (${member.user_id})`);
});

// Test field resolution logic
const userId = testEventRegistration.user_id || testEventRegistration.delegate_user_id || testEventRegistration.pass_id || testEventRegistration.contact_user_id || '';
const userName = testEventRegistration.name || testEventRegistration.leader_name || testEventRegistration.contact_name || '';
const userEmail = testEventRegistration.email || testEventRegistration.leader_email || testEventRegistration.contact_email || '';

console.log('=== FIELD RESOLUTION TEST ===');
console.log('Resolved userId:', userId);
console.log('Resolved userName:', userName);
console.log('Resolved userEmail:', userEmail);
console.log('Has members array:', !!testEventRegistration.members);
console.log('Should send to ALL members:', testEventRegistration.members?.length > 0);
