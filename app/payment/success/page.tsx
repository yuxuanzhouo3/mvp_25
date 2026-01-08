"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showContent, setShowContent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get session_id from URL (Stripe) or token (PayPal)
  const sessionId = searchParams.get("session_id");
  const paypalToken = searchParams.get("token");

  useEffect(() => {
    const verifyPayment = async () => {
      // If there's a session_id (Stripe) or token (PayPal), verify the payment
      if (sessionId || paypalToken) {
        setIsVerifying(true);
        try {
          // For Stripe payments, the webhook handles activation
          // Here we just confirm the session exists
          if (sessionId) {
            // Stripe webhook handles the activation, just show success
            setVerificationStatus("success");
          } else if (paypalToken) {
            // PayPal: capture the payment
            const response = await fetch("/api/payment/intl/capture", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                provider: "paypal",
                token: paypalToken,
              }),
            });

            if (response.ok) {
              setVerificationStatus("success");
            } else {
              const data = await response.json();
              setVerificationStatus("error");
              setErrorMessage(data.error || "Payment verification failed");
            }
          }
        } catch (error: any) {
          setVerificationStatus("error");
          setErrorMessage(error.message || "Failed to verify payment");
        } finally {
          setIsVerifying(false);
        }
      } else {
        // No session_id or token, assume direct success (from CN payment or webhook)
        setVerificationStatus("success");
      }
    };

    verifyPayment();
  }, [sessionId, paypalToken]);

  useEffect(() => {
    if (verificationStatus === "success") {
      // Delay to show content with animation
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);

      // Play celebration animation
      const celebration = setTimeout(async () => {
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // Ignore confetti errors
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        clearTimeout(celebration);
      };
    }
  }, [verificationStatus]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleStartUsing = () => {
    router.push("/assessment");
  };

  // Loading state
  if (isVerifying) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Verifying your payment...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait a moment</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (verificationStatus === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Payment Verification Failed</CardTitle>
          <CardDescription>
            {errorMessage || "We couldn't verify your payment. Please contact support."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={() => router.push("/payment/intl")}>
            Try Again
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoHome}>
            Return Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Success state
  return (
    <Card className={`w-full max-w-md transition-all duration-500 ${
      showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    }`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        <CardDescription>
          Thank you for your support. Your membership is now active.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Membership Info */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Membership Status</span>
            <span className="text-sm font-medium text-green-600">Active</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-medium">Premium</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="text-center text-sm text-muted-foreground">
          <p>You now have access to:</p>
          <ul className="mt-2 space-y-1">
            <li>✓ Unlimited AI Question Generation</li>
            <li>✓ Smart Paper Composition</li>
            <li>✓ Difficulty Analysis</li>
            <li>✓ Personalized Teaching Suggestions</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button className="w-full" onClick={handleStartUsing}>
            Start Using
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoHome}>
            Return Home
          </Button>
        </div>

        {/* Support Note */}
        <p className="text-xs text-center text-muted-foreground">
          If you have any questions, please contact our support team.
        </p>
      </CardContent>
    </Card>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
