'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, QrCode, Smartphone, Upload, Copy, Check } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { PAYMENT_CONFIG, generateUPILink, generateQRData } from '@/lib/config/payment'

interface PaymentComponentProps {
  amount: number
  orderId: string
  onPaymentComplete: (data: { transactionId: string; screenshot: File }) => void
  description?: string
  isLoading?: boolean
}

export default function PaymentComponent({
  amount,
  orderId,
  onPaymentComplete,
  description = 'SPANDAN 2025 Registration',
  isLoading = false
}: PaymentComponentProps) {
  const [transactionId, setTransactionId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [upiLink, setUpiLink] = useState('')
  const [qrData, setQrData] = useState('')
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    const link = generateUPILink(amount, orderId, description)
    const qr = generateQRData(amount, orderId, description)
    setUpiLink(link)
    setQrData(qr)
  }, [amount, orderId, description])

  const handleCopyUPI = async () => {
    try {
      setCopying(true)
      await navigator.clipboard.writeText(PAYMENT_CONFIG.upiId)
      toast.success('UPI ID copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy UPI ID')
    } finally {
      setCopying(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB')
        return
      }
      
      setScreenshot(file)
    }
  }

  const handleSubmit = () => {
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID')
      return
    }
    
    if (!screenshot) {
      toast.error('Please upload payment screenshot')
      return
    }
    
    onPaymentComplete({
      transactionId: transactionId.trim(),
      screenshot
    })
  }

  const openUPIApp = () => {
    window.open(upiLink, '_blank')
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription>
          Pay ₹{amount} for {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Order ID:</strong> {orderId}<br />
            <strong>Amount:</strong> ₹{amount}<br />
            <strong>UPI ID:</strong> {PAYMENT_CONFIG.upiId}
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="upi" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upi">UPI App</TabsTrigger>
            <TabsTrigger value="manual">Manual Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="upi" className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to open your UPI app and make the payment
              </p>
              
              <Button 
                onClick={openUPIApp}
                className="w-full"
                size="lg"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Pay with UPI App
              </Button>

              <div className="text-xs text-muted-foreground">
                This will open your default UPI app with pre-filled payment details
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Payment Details:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>UPI ID:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-2 py-1 rounded">
                        {PAYMENT_CONFIG.upiId}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyUPI}
                        disabled={copying}
                      >
                        {copying ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">₹{amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Note:</span>
                    <span>{orderId}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open your UPI app (GPay, PhonePe, Paytm, etc.)</li>
                  <li>Send money to the UPI ID above</li>
                  <li>Enter the exact amount: ₹{amount}</li>
                  <li>Add &ldquo;{orderId}&rdquo; in the note/description</li>
                  <li>Complete the payment</li>
                  <li>Take a screenshot and upload below</li>
                </ol>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">After Payment Completion:</h4>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="transactionId">
                Transaction ID / Reference Number *
              </Label>
              <Input
                id="transactionId"
                placeholder="Enter UPI transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is usually a 12-digit number from your payment confirmation
              </p>
            </div>

            <div>
              <Label htmlFor="screenshot">
                Payment Screenshot *
              </Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a clear screenshot of your payment confirmation (max 5MB)
              </p>
            </div>

            {screenshot && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Screenshot uploaded: {screenshot.name}
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!transactionId.trim() || !screenshot || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Payment Details
              </>
            )}
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your registration will be processed after payment verification. 
            You will receive a confirmation email within 24-48 hours.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
