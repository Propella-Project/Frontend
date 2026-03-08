/**
 * Payments Page
 * 
 * Allows authenticated users to view plans and initiate payments.
 * Uses POST /api/payments/initialize/ to start payment process.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, Sparkles, Loader2 } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { paymentsApi, type PaymentPlan, type SubscriptionStatus } from "@/api/dashboard.api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function PaymentsPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Fetch plans and subscription status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, subscriptionData] = await Promise.all([
          paymentsApi.getPlans().catch(() => []),
          paymentsApi.getSubscriptionStatus().catch(() => null),
        ]);
        setPlans(plansData);
        setSubscription(subscriptionData);
      } catch (error) {
        console.error("[Payments] Failed to fetch data:", error);
        toast.error("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initiate payment
  const initiatePayment = async (plan: PaymentPlan) => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    setProcessingPlan(plan.id);

    try {
      // Use the backend payment initialization endpoint
      const response = await paymentsApi.initiate({
        plan: plan.id,
        user_id: user.id,
        amount: plan.price,
        currency: plan.currency || "NGN",
        callback_url: `${window.location.origin}/payment-callback`,
      });

      if (response.data?.link) {
        // Redirect to payment gateway
        window.location.href = response.data.link;
      } else {
        toast.error("Payment initialization failed");
      }
    } catch (error) {
      console.error("[Payments] Payment initiation failed:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  // Format price
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <DashboardLayout title="Payments">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#18A0FB]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payments">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Choose Your Plan</h1>
          <p className="text-gray-400 mt-2">
            Unlock premium features and accelerate your learning
          </p>
        </div>

        {/* Current Subscription */}
        {subscription?.is_active && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-[#18A0FB]/20 to-[#0B54A0]/20 border-[#18A0FB]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#18A0FB]" />
                      Active Subscription
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      You are currently on the {subscription.plan} plan
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">
                  Expires in {subscription.days_remaining} days ({new Date(subscription.expires_at).toLocaleDateString()})
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.length > 0 ? (
            plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full bg-[#1A1A1D] border-white/10 flex flex-col ${
                  plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("premium")
                    ? "border-[#18A0FB]/50 relative overflow-hidden"
                    : ""
                }`}>
                  {/* Popular badge */}
                  {(plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("premium")) && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-tl-none rounded-br-none rounded-tr-lg rounded-bl-lg bg-[#18A0FB] text-white">
                        Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-gray-500">/{plan.duration_days} days</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => initiatePayment(plan)}
                      disabled={processingPlan === plan.id || subscription?.plan === plan.id}
                      className={`w-full ${
                        plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("premium")
                          ? "bg-[#18A0FB] hover:bg-[#0B54A0]"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      {processingPlan === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : subscription?.plan === plan.id ? (
                        "Current Plan"
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Subscribe
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            // Default plans if API returns empty
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <Card className="h-full bg-[#1A1A1D] border-white/10 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-white">Basic</CardTitle>
                    <CardDescription className="text-gray-400">
                      Get started with essential features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">₦2,000</span>
                      <span className="text-gray-500">/30 days</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        AI Study Roadmap
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        50 Quiz Questions/day
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Basic Analytics
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => toast.info("Payment system coming soon")}
                      className="w-full bg-white/10 hover:bg-white/20"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full bg-[#1A1A1D] border-[#18A0FB]/50 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-tl-none rounded-br-none rounded-tr-lg rounded-bl-lg bg-[#18A0FB] text-white">
                      Popular
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-white">Pro</CardTitle>
                    <CardDescription className="text-gray-400">
                      Unlock full potential
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">₦5,000</span>
                      <span className="text-gray-500">/30 days</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Everything in Basic
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Unlimited AI Tutor
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Unlimited Quizzes
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Priority Support
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => toast.info("Payment system coming soon")}
                      className="w-full bg-[#18A0FB] hover:bg-[#0B54A0]"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full bg-[#1A1A1D] border-white/10 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-white">Premium</CardTitle>
                    <CardDescription className="text-gray-400">
                      For serious students
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">₦12,000</span>
                      <span className="text-gray-500">/90 days</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Everything in Pro
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        3 Months Access
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Personal Study Coach
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Exam Guarantee
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => toast.info("Payment system coming soon")}
                      className="w-full bg-white/10 hover:bg-white/20"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        {/* Payment Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500">
            Secure payments powered by Flutterwave. Your payment information is encrypted.
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default PaymentsPage;
