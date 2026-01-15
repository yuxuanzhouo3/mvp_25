"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isChinaRegion } from "@/lib/config/region";
import { useAuth as useAuthCN, getAccessToken } from "@/components/auth/auth-provider";
import { useUserIntl } from "@/components/user-context-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Check,
  CreditCard,
  Sparkles,
  Shield,
  ArrowLeft,
  AlertCircle
} from "lucide-react";

// 根据区域选择正确的 hook
const useAuth = isChinaRegion() ? useAuthCN : useUserIntl

type BillingCycle = "monthly" | "yearly";
type PaymentProvider = "stripe" | "paypal";

const PRICING = {
  monthly: {
    price: 4.99,
    originalPrice: 6.99,
    label: "Monthly",
    description: "Billed monthly, cancel anytime",
    days: 30,
  },
  yearly: {
    price: 49.99,
    originalPrice: 83.88,
    label: "Yearly",
    description: "Save 40% with annual billing",
    badge: "Best Value",
    days: 365,
  },
};

const FEATURES = [
  "Unlimited AI Question Generation",
  "Smart Paper Composition",
  "Difficulty Analysis",
  "Personalized Teaching Suggestions",
  "History & Progress Tracking",
  "Priority Customer Support",
];

export default function IntlPaymentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("stripe");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/login?redirect=/payment/intl");
    return null;
  }

  // Create payment and redirect
  const handleCreatePayment = async () => {
    setError(null);
    setIsCreating(true);

    try {
      const token = getAccessToken();
      if (!token) {
        router.push("/login?redirect=/payment/intl");
        return;
      }

      const response = await fetch("/api/payment/intl/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: paymentProvider,
          amount: PRICING[billingCycle].price,
          currency: "USD",
          userId: user.id,
          paymentType: billingCycle === "yearly" ? "yearly_subscription" : "monthly_subscription",
          days: PRICING[billingCycle].days,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      // Redirect to payment provider
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create payment. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Upgrade to Premium
          </h1>
          <p className="text-slate-400 text-lg">
            Unlock all features and supercharge your teaching
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Plan Selection & Payment */}
          <div className="space-y-6">
            {/* Plan Selection */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Choose Your Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Yearly Plan */}
                <div
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    billingCycle === "yearly"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                  }`}
                  onClick={() => setBillingCycle("yearly")}
                >
                  {PRICING.yearly.badge && (
                    <Badge className="absolute -top-2.5 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold border-0">
                      {PRICING.yearly.badge}
                    </Badge>
                  )}
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      billingCycle === "yearly" ? "border-blue-500 bg-blue-500" : "border-slate-500"
                    }`}>
                      {billingCycle === "yearly" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {/* Content */}
                    <div className="flex justify-between items-center flex-1">
                      <div>
                        <p className="font-semibold text-white">{PRICING.yearly.label}</p>
                        <p className="text-sm text-slate-400">
                          {PRICING.yearly.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">${PRICING.yearly.price}</p>
                        <p className="text-sm text-slate-500 line-through">
                          ${PRICING.yearly.originalPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Plan */}
                <div
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    billingCycle === "monthly"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                  }`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      billingCycle === "monthly" ? "border-blue-500 bg-blue-500" : "border-slate-500"
                    }`}>
                      {billingCycle === "monthly" && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {/* Content */}
                    <div className="flex justify-between items-center flex-1">
                      <div>
                        <p className="font-semibold text-white">{PRICING.monthly.label}</p>
                        <p className="text-sm text-slate-400">
                          {PRICING.monthly.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">${PRICING.monthly.price}</p>
                        <p className="text-sm text-slate-500 line-through">
                          ${PRICING.monthly.originalPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Stripe */}
                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                    paymentProvider === "stripe"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                  }`}
                  onClick={() => setPaymentProvider("stripe")}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentProvider === "stripe" ? "border-blue-500 bg-blue-500" : "border-slate-500"
                  }`}>
                    {paymentProvider === "stripe" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" rx="4" fill="#635BFF"/>
                      <path d="M13.976 9.15c-2.032-.862-2.977-1.218-2.977-1.996 0-.628.557-.963 1.477-.963 1.523 0 2.848.554 3.72.975l.546-3.327c-.748-.365-2.162-.936-4.267-.936-1.544 0-2.83.398-3.716 1.15-.93.79-1.397 1.894-1.397 3.283 0 2.468 1.512 3.523 3.966 4.531 1.575.645 2.185 1.095 2.185 1.8 0 .712-.62 1.124-1.754 1.124-1.178 0-2.925-.522-4.064-1.195l-.528 3.44c.826.47 2.478 1.003 4.592 1.003 1.677 0 3.035-.42 3.927-1.186.936-.803 1.393-1.97 1.393-3.465 0-2.52-1.54-3.569-4.103-4.238z" fill="white"/>
                    </svg>
                    <div>
                      <p className="font-medium text-white">Credit / Debit Card</p>
                      <p className="text-xs text-slate-400">Powered by Stripe</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <svg className="w-8 h-5" viewBox="0 0 38 24" fill="none">
                      <rect width="38" height="24" rx="3" fill="#1A1F36"/>
                      <circle cx="15" cy="12" r="7" fill="#EB001B"/>
                      <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
                      <path d="M19 17.5a7 7 0 0 0 0-11 7 7 0 0 0 0 11z" fill="#FF5F00"/>
                    </svg>
                    <svg className="w-8 h-5" viewBox="0 0 38 24" fill="none">
                      <rect width="38" height="24" rx="3" fill="#1A1F36"/>
                      <path d="M15.5 7l-4 10h2.5l.7-2h3.6l.7 2H21.5l-4-10h-2zm.3 6l1.2-3.5 1.2 3.5h-2.4z" fill="#00A1E0"/>
                      <path d="M23 7v10h2V7h-2z" fill="#00A1E0"/>
                    </svg>
                  </div>
                </div>

                {/* PayPal */}
                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                    paymentProvider === "paypal"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
                  }`}
                  onClick={() => setPaymentProvider("paypal")}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentProvider === "paypal" ? "border-blue-500 bg-blue-500" : "border-slate-500"
                  }`}>
                    {paymentProvider === "paypal" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" rx="4" fill="#003087"/>
                      <path d="M17.5 7.5c.5 2-1 4-4 4h-1l-.5 3.5h-2l.5-3.5.5-4h3c2 0 3 .5 3.5 0z" fill="#009CDE"/>
                      <path d="M14.5 6c.5 2-1 4-4 4h-1l-.5 3.5h-2l.5-3.5.5-4h3c2 0 3 .5 3.5 0z" fill="#012169"/>
                    </svg>
                    <div>
                      <p className="font-medium text-white">PayPal</p>
                      <p className="text-xs text-slate-400">Pay with your PayPal account</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Pay Button */}
            <Button
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              onClick={handleCreatePayment}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ${PRICING[billingCycle].price}
                </>
              )}
            </Button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Shield className="w-4 h-4" />
              <span>Secure payment powered by {paymentProvider === "stripe" ? "Stripe" : "PayPal"}</span>
            </div>
          </div>

          {/* Right: Features */}
          <Card className="bg-slate-800/50 border-slate-700 h-fit lg:sticky lg:top-8">
            <CardHeader>
              <CardTitle className="text-white">Premium Benefits</CardTitle>
              <CardDescription className="text-slate-400">
                Everything you need to supercharge your teaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-slate-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 p-4 bg-slate-700/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Money Back Guarantee</p>
                    <p className="text-sm text-slate-400">
                      Not satisfied? Get a full refund within 7 days, no questions asked.
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-slate-600">
                <p className="text-slate-300 italic text-sm">
                  "This tool has completely transformed how I prepare my lessons.
                  The AI-generated questions save me hours every week!"
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    S
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Sarah M.</p>
                    <p className="text-slate-500 text-xs">High School Teacher</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
