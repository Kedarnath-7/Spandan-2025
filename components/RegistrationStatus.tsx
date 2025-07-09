import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Calendar, 
  CreditCard,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { UnifiedRegistrationService, type UnifiedRegistration } from '@/lib/services/unifiedRegistrationAdmin';

interface RegistrationStatusProps {
  userEmail: string;
  onStatusChecked: (canRegister: boolean) => void;
}

const RegistrationStatus = ({ userEmail, onStatusChecked }: RegistrationStatusProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [unifiedRegistration, setUnifiedRegistration] = useState<UnifiedRegistration | null>(null);

  const checkStatus = React.useCallback(async () => {
    if (!userEmail) return;

    setIsChecking(true);
    try {
      const registration = await UnifiedRegistrationService.getUserUnifiedRegistration(userEmail);
      setUnifiedRegistration(registration);
      
      // User can register if they don't have any existing registration
      const canRegister = !registration;
      onStatusChecked(canRegister);
    } catch (error) {
      console.error('Error checking registration status:', error);
      setUnifiedRegistration(null);
      onStatusChecked(true);
    } finally {
      setIsChecking(false);
    }
  }, [userEmail, onStatusChecked]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (isChecking) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Checking registration status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No existing registration - user can register
  if (!unifiedRegistration) {
    return (
      <Alert className="border-green-500/20 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-400">
          You&apos;re all set to register for SPANDAN 2025!
        </AlertDescription>
      </Alert>
    );
  }

  // User has existing registration - show unified status
  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-yellow-400 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Registration Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-500/20 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-400">
            You already have a SPANDAN 2025 registration. Multiple registrations are not allowed.
          </AlertDescription>
        </Alert>

        {/* Unified Registration Details */}
        <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-lg font-semibold text-white">
                {unifiedRegistration.registration_tier} Pass
              </h4>
              <p className="text-sm text-gray-300">
                Registered on {new Date(unifiedRegistration.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <Badge className={`text-sm ${getStatusColor(unifiedRegistration.status)}`}>
                {unifiedRegistration.status}
              </Badge>
              <p className="text-lg font-semibold text-white mt-1">
                ₹{unifiedRegistration.total_amount}
              </p>
            </div>
          </div>
          
          {/* Status Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              {getStatusIcon(unifiedRegistration.status)}
              <div>
                <p className="text-gray-300">Status</p>
                <p className="text-white font-medium capitalize">{unifiedRegistration.status}</p>
              </div>
            </div>
            
            {unifiedRegistration.delegate_id && (
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-gray-300">Delegate ID</p>
                  <p className="text-white font-medium">{unifiedRegistration.delegate_id}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-gray-300">Events</p>
                <p className="text-white font-medium">{unifiedRegistration.selected_events?.length || 0} Events</p>
              </div>
            </div>
            
            {unifiedRegistration.payment_transaction_id && (
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-gray-300">Payment</p>
                  <p className="text-white font-medium">Completed</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Rejection Reason */}
          {unifiedRegistration.status === 'rejected' && unifiedRegistration.rejection_reason && (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded">
              <p className="text-sm text-red-300">
                <strong>Rejection Reason:</strong> {unifiedRegistration.rejection_reason}
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            className="border-slate-600 text-gray-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/profile'}
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationStatus;
