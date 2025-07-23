// Service to check for duplicate registrations
import { supabase } from '@/lib/supabase'

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRegistration?: {
    groupId: string;
    memberName: string;
  };
}

const checkEmailExists = async (email: string): Promise<DuplicateCheckResult> => {
  try {
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('group_id, name')
      .eq('email', email)
      .limit(1)

    if (memberError) throw memberError
    if (!memberData || memberData.length === 0) return { isDuplicate: false }

    const { group_id, name } = memberData[0]

    const { data: regData, error: regError } = await supabase
      .from('group_registrations')
      .select('status')
      .eq('group_id', group_id)
      .neq('status', 'rejected')
      .limit(1)

    if (regError) throw regError
    if (!regData || regData.length === 0) return { isDuplicate: false }

    return {
      isDuplicate: true,
      existingRegistration: { groupId: group_id, memberName: name },
    }
  } catch (error) {
    console.error('Error checking email existence:', error)
    return { isDuplicate: false } // Fail open
  }
}

const checkPhoneExists = async (phone: string): Promise<DuplicateCheckResult> => {
  try {
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('group_id, name')
      .eq('phone', phone)
      .limit(1)

    if (memberError) throw memberError
    if (!memberData || memberData.length === 0) return { isDuplicate: false }

    const { group_id, name } = memberData[0]

    const { data: regData, error: regError } = await supabase
      .from('group_registrations')
      .select('status')
      .eq('group_id', group_id)
      .neq('status', 'rejected')
      .limit(1)

    if (regError) throw regError
    if (!regData || regData.length === 0) return { isDuplicate: false }

    return {
      isDuplicate: true,
      existingRegistration: { groupId: group_id, memberName: name },
    }
  } catch (error) {
    console.error('Error checking phone existence:', error)
    return { isDuplicate: false } // Fail open
  }
}

const checkTransactionIdExists = async (transactionId: string): Promise<DuplicateCheckResult> => {
  try {
    const { data, error } = await supabase
      .from('group_registrations')
      .select('group_id')
      .eq('payment_transaction_id', transactionId)
      .neq('status', 'rejected')
      .limit(1)

    if (error) throw error
    if (!data || data.length === 0) return { isDuplicate: false }

    return {
      isDuplicate: true,
      existingRegistration: { groupId: data[0].group_id, memberName: 'N/A' },
    }
  } catch (error) {
    console.error('Error checking transaction ID:', error)
    return { isDuplicate: false } // Fail open
  }
}

interface MemberInput {
  email: string;
  phone: string;
}

interface DuplicateResult {
  memberIndex: number;
  emailDuplicate: boolean;
  phoneDuplicate: boolean;
}

interface MultipleDuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: DuplicateResult[];
}

const checkMultipleMembersDuplicates = async (members: MemberInput[]): Promise<MultipleDuplicateCheckResult> => {
  const results: DuplicateResult[] = []
  let hasDuplicates = false

  for (let i = 0; i < members.length; i++) {
    const member = members[i]
    const emailResult = await checkEmailExists(member.email)
    const phoneResult = await checkPhoneExists(member.phone)

    if (emailResult.isDuplicate || phoneResult.isDuplicate) {
      hasDuplicates = true
      results.push({
        memberIndex: i,
        emailDuplicate: emailResult.isDuplicate,
        phoneDuplicate: phoneResult.isDuplicate,
      })
    }
  }

  return { hasDuplicates, duplicates: results }
}

export const DuplicateRegistrationService = {
  checkEmailExists,
  checkPhoneExists,
  checkTransactionIdExists,
  checkMultipleMembersDuplicates,
}
