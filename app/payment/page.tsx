'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import PaymentComponent from '@/components/PaymentComponent'
import { toast } from 'sonner'

interface CartItem {
  id: string
  name: string
  price: number
  category: string
}

export default function PaymentPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadCart()
  }, [])

  const checkAuthAndLoadCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        toast.error('Please login to access payment page')
        router.push('/signup')
        return
      }

      setUser(session.user)
      
      // Load cart from localStorage
      const savedCart = localStorage.getItem('eventCart')
      if (savedCart) {
        const cart = JSON.parse(savedCart)
        setCartItems(cart)
      }

      if (!savedCart || JSON.parse(savedCart).length === 0) {
        toast.error('Your cart is empty')
        router.push('/events')
        return
      }

    } catch (error) {
      console.error('Error checking auth:', error)
      toast.error('Failed to load page')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.price, 0)
  }

  const handlePaymentComplete = async (paymentData: { transactionId: string; screenshot: File }) => {
    try {
      setLoading(true)

      // Here you would typically:
      // 1. Upload screenshot to Supabase storage
      // 2. Create payment record in database
      // 3. Create event registrations for cart items
      // 4. Clear cart
      
      toast.success('Payment submitted successfully! You will receive confirmation soon.')
      localStorage.removeItem('eventCart')
      router.push('/profile')

    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Failed to process payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Complete Your Payment
          </h1>
          <p className="text-blue-200">
            Review your cart and complete the payment to confirm your event registrations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Cart Summary */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Order Summary
              </CardTitle>
              <CardDescription className="text-blue-200">
                Events you&#39;re registering for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/10">
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-blue-200 text-sm">{item.category}</p>
                  </div>
                  <p className="text-white font-bold">₹{item.price}</p>
                </div>
              ))}
              
              <div className="pt-4 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <p className="text-white font-bold text-lg">Total Amount:</p>
                  <p className="text-white font-bold text-xl">₹{getTotalAmount()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Component */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Payment Details</CardTitle>
              <CardDescription className="text-blue-200">
                Complete your payment using UPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentComponent
                amount={getTotalAmount()}
                orderId={`SPANDAN_${Date.now()}`}
                onPaymentComplete={handlePaymentComplete}
                description={`SPANDAN 2025 - ${cartItems.length} events`}
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}