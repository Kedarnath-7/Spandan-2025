import { supabase } from '@/lib/supabase'
import { EventRegistration, EventRegistrationMember, EventRegistrationView } from '@/lib/types'

// Upload payment screenshot to Supabase storage
const uploadPaymentScreenshot = async (
  file: File,
  transactionId: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `event_payment_${transactionId}_${Date.now()}.${fileExt}`;
  const filePath = `payment-screenshots/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('spandan-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload payment screenshot: ${uploadError.message}`);
  }

  return filePath;
};

// Create new event registration
export const createEventRegistration = async (
  eventId: string,
  contactUserID: string,
  contactName: string,
  contactEmail: string,
  contactPhone: string,
  paymentTransactionId: string,
  paymentScreenshotFile: File | null,
  members: Array<{
    userId: string;
    name: string;
    email: string;
    college: string;
    phone: string;
    originalGroupId: string;
  }>
): Promise<{ success: boolean; data?: { groupId: string }; error?: string }> => {
  try {
    // Step 1: Upload payment screenshot if provided
    let paymentScreenshotPath: string | null = null;
    if (paymentScreenshotFile) {
      paymentScreenshotPath = await uploadPaymentScreenshot(
        paymentScreenshotFile,
        paymentTransactionId
      );
    }

    // Step 2: Validate all users are approved
    const { data: validationData, error: validationError } = await supabase
      .rpc('validate_approved_user_id', { input_user_id: contactUserID })

    if (validationError || !validationData) {
      return { success: false, error: 'Contact person is not an approved user' }
    }

    // Validate all member user IDs
    for (const member of members) {
      const { data: memberValidation, error: memberError } = await supabase
        .rpc('validate_approved_user_id', { input_user_id: member.userId })
      
      if (memberError || !memberValidation) {
        return { success: false, error: `Member ${member.name} is not an approved user` }
      }
    }

    // Step 3: Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('name, price, max_participants')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return { success: false, error: 'Event not found' }
    }

    // Step 4: Check event capacity
    const { data: capacityCheck, error: capacityError } = await supabase
      .rpc('check_event_capacity', { 
        event_uuid: eventId, 
        requested_spots: members.length 
      })

    if (capacityError || !capacityCheck) {
      return { success: false, error: 'Event capacity exceeded or capacity check failed' }
    }

    // Step 5: Generate group ID
    const { data: groupIdData, error: groupIdError } = await supabase
      .rpc('generate_event_group_id')

    if (groupIdError || !groupIdData) {
      return { success: false, error: 'Failed to generate group ID' }
    }

    const groupId = groupIdData

    // Step 5: Calculate total amount
    const totalAmount = eventData.price * members.length

    // Step 6: Create event registration
    const { error: registrationError } = await supabase
      .from('event_registrations')
      .insert({
        group_id: groupId,
        event_id: eventId,
        event_name: eventData.name,
        event_price: eventData.price,
        total_amount: totalAmount,
        member_count: members.length,
        payment_transaction_id: paymentTransactionId,
        payment_screenshot_path: paymentScreenshotPath,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        contact_user_id: contactUserID,
        status: 'pending'
      })

    if (registrationError) {
      return { success: false, error: registrationError.message }
    }

    // Step 7: Create event registration members
    const memberRecords = members.map((member, index) => ({
      group_id: groupId,
      user_id: member.userId,
      name: member.name,
      email: member.email,
      college: member.college,
      phone: member.phone,
      original_group_id: member.originalGroupId,
      member_order: index + 1
    }))

    const { error: membersError } = await supabase
      .from('event_registration_members')
      .insert(memberRecords)

    if (membersError) {
      // Cleanup: Remove the registration if member creation fails
      await supabase
        .from('event_registrations')
        .delete()
        .eq('group_id', groupId)
      
      return { success: false, error: membersError.message }
    }

    return { success: true, data: { groupId } }

  } catch (error) {
    console.error('Error creating event registration:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get all event registrations for admin
export const getEventRegistrations = async (): Promise<{
  success: boolean;
  data?: EventRegistrationView[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        group_id,
        event_id,
        event_name,
        event_price,
        contact_name,
        contact_email,
        contact_phone,
        contact_user_id,
        member_count,
        total_amount,
        payment_transaction_id,
        payment_screenshot_path,
        status,
        reviewed_by,
        reviewed_at,
        rejection_reason,
        created_at,
        updated_at,
        events!inner(
          category
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const formattedData: EventRegistrationView[] = data.map(item => ({
      group_id: item.group_id,
      event_id: item.event_id,
      event_name: item.event_name,
      event_category: (item as any).events.category,
      event_price: item.event_price,
      contact_name: item.contact_name,
      contact_email: item.contact_email,
      contact_phone: item.contact_phone,
      contact_user_id: item.contact_user_id,
      member_count: item.member_count,
      total_amount: item.total_amount,
      payment_transaction_id: item.payment_transaction_id,
      payment_screenshot_path: item.payment_screenshot_path,
      status: item.status,
      reviewed_by: item.reviewed_by,
      reviewed_at: item.reviewed_at,
      rejection_reason: item.rejection_reason,
      created_at: item.created_at,
      updated_at: item.updated_at
    }))

    return { success: true, data: formattedData }

  } catch (error) {
    console.error('Error fetching event registrations:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get event registration by group ID
export const getEventRegistrationByGroupId = async (groupId: string): Promise<{
  success: boolean;
  data?: EventRegistration & { members: EventRegistrationMember[] };
  error?: string;
}> => {
  try {
    // Get registration details
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('group_id', groupId)
      .single()

    if (regError || !registration) {
      return { success: false, error: 'Registration not found' }
    }

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('event_registration_members')
      .select('*')
      .eq('group_id', groupId)
      .order('member_order')

    if (membersError) {
      return { success: false, error: membersError.message }
    }

    return {
      success: true,
      data: {
        ...registration,
        members: members || []
      }
    }

  } catch (error) {
    console.error('Error fetching event registration details:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Approve event registration
export const approveEventRegistration = async (
  groupId: string,
  reviewedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('event_registrations')
      .update({
        status: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('group_id', groupId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Error approving event registration:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Reject event registration
export const rejectEventRegistration = async (
  groupId: string,
  rejectionReason: string,
  reviewedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('event_registrations')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('group_id', groupId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Error rejecting event registration:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get approved users for validation (for dropdown in frontend)
export const getApprovedUsers = async (): Promise<{
  success: boolean;
  data?: Array<{
    user_id: string;
    name: string;
    email: string;
    college: string;
    group_id: string;
  }>;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        delegate_user_id,
        name,
        email,
        college,
        group_id,
        group_registrations!inner(
          status
        )
      `)
      .eq('group_registrations.status', 'approved')
      .order('name')

    if (error) {
      return { success: false, error: error.message }
    }

    const formattedData = data.map(item => ({
      user_id: item.delegate_user_id,
      name: item.name,
      email: item.email,
      college: item.college,
      group_id: item.group_id
    }))

    return { success: true, data: formattedData }

  } catch (error) {
    console.error('Error fetching approved users:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Get user details by user ID (for auto-filling forms)
export const getUserDetails = async (userId: string): Promise<{
  success: boolean;
  data?: {
    user_id: string;
    name: string;
    email: string;
    college: string;
    phone: string;
    group_id: string;
  };
  error?: string;
}> => {
  try {
    // Use the database function for validation and details
    const { data, error } = await supabase
      .rpc('get_approved_user_details', { input_user_id: userId })

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Database error occurred' }
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'User not found or not approved for tier/pass registration' }
    }

    const userDetails = data[0]
    
    return {
      success: true,
      data: {
        user_id: userId,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        college: userDetails.college,
        group_id: userDetails.group_id
      }
    }

  } catch (error) {
    console.error('Error fetching user details:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Delete event registration (admin only)
export const deleteEventRegistration = async (groupId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Delete members first (foreign key constraint)
    const { error: membersError } = await supabase
      .from('event_registration_members')
      .delete()
      .eq('group_id', groupId)

    if (membersError) {
      return { success: false, error: membersError.message }
    }

    // Delete registration
    const { error: registrationError } = await supabase
      .from('event_registrations')
      .delete()
      .eq('group_id', groupId)

    if (registrationError) {
      return { success: false, error: registrationError.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Error deleting event registration:', error)
    return { success: false, error: 'Internal server error' }
  }
}
