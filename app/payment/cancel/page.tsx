"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCcw, HelpCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function PaymentCancelPage() {
  const router = useRouter();
  const t = useT();

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <CardTitle className="text-2xl text-white">{t.payment.paymentCancelled}</CardTitle>
          <CardDescription className="text-slate-400 text-base mt-2">
            {t.payment.noCharges}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Info Box */}
          <div className="p-4 bg-slate-700/50 rounded-xl">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white text-sm">{t.payment.needHelp}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {t.payment.checkoutIssue}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={() => router.push("/payment/intl")}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              {t.payment.tryAgain}
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.payment.returnHome}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
