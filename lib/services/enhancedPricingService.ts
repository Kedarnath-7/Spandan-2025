import { EnhancedMemberFormData, TIER_PRICES, PASS_PRICES, PassType, PassTier, TierType } from '@/lib/types';

export class EnhancedPricingService {
  /**
   * Calculate amount for a single member based on their selection
   */
  static calculateMemberAmount(member: EnhancedMemberFormData): number {
    if (member.selectionType === 'tier' && member.tier) {
      return TIER_PRICES[member.tier as TierType];
    }
    
    if (member.selectionType === 'pass' && member.passType) {
      if (member.passType === 'Nexus Forum' && member.passTier) {
        const passKey = `Nexus Forum ${member.passTier}` as keyof typeof PASS_PRICES;
        return PASS_PRICES[passKey];
      } else if (member.passType !== 'Nexus Forum') {
        return PASS_PRICES[member.passType as keyof typeof PASS_PRICES];
      }
    }
    
    return 0;
  }

  /**
   * Calculate total amount for all members in a group
   */
  static calculateTotalAmount(members: EnhancedMemberFormData[]): number {
    return members.reduce((total, member) => {
      return total + this.calculateMemberAmount(member);
    }, 0);
  }

  /**
   * Get display name for member's selection
   */
  static getMemberSelectionDisplay(member: EnhancedMemberFormData): string {
    if (member.selectionType === 'tier' && member.tier) {
      return member.tier;
    }
    
    if (member.selectionType === 'pass' && member.passType) {
      if (member.passType === 'Nexus Forum' && member.passTier) {
        return `${member.passType} (${member.passTier})`;
      }
      return member.passType;
    }
    
    return 'Not Selected';
  }

  /**
   * Validate member selection
   */
  static validateMemberSelection(member: EnhancedMemberFormData): {
    isValid: boolean;
    error?: string;
  } {
    if (member.selectionType === 'tier') {
      if (!member.tier) {
        return { isValid: false, error: 'Tier must be selected when selection type is tier' };
      }
      if (member.passType || member.passTier) {
        return { isValid: false, error: 'Cannot select both tier and pass' };
      }
    }
    
    if (member.selectionType === 'pass') {
      if (!member.passType) {
        return { isValid: false, error: 'Pass type must be selected when selection type is pass' };
      }
      if (member.passType === 'Nexus Forum' && !member.passTier) {
        return { isValid: false, error: 'Pass tier must be selected for Nexus Forum' };
      }
      if (member.passType !== 'Nexus Forum' && member.passTier) {
        return { isValid: false, error: 'Pass tier can only be selected for Nexus Forum' };
      }
      if (member.tier) {
        return { isValid: false, error: 'Cannot select both tier and pass' };
      }
    }
    
    return { isValid: true };
  }
}
