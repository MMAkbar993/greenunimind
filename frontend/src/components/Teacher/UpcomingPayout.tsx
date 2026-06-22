import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, Clock, DollarSign, Info } from "lucide-react";
import { useGetUpcomingPayoutQuery } from "@/redux/features/payment/payment.api";
import { format, formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UpcomingPayoutProps {
  teacherId: string;
}

const UpcomingPayout = ({ teacherId }: UpcomingPayoutProps) => {
  const { data, isLoading, error } = useGetUpcomingPayoutQuery(teacherId);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return "Unknown date";
    }
  };

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  // Get payout schedule text
  const getPayoutScheduleText = () => {
    if (!data?.payoutSchedule) return "Manual payouts";

    const { interval, monthlyAnchor, weeklyAnchor, delayDays } = data.payoutSchedule;

    // Add delay days information if available
    const delayInfo = delayDays ? ` — ${delayDays} day rolling basis` : '';

    switch (interval) {
      case "daily":
        return `Daily payouts${delayInfo}`;
      case "weekly":
        return `Weekly payouts${weeklyAnchor ? ` on ${getDayName(weeklyAnchor)}` : ''}${delayInfo}`;
      case "monthly":
        return `Monthly payouts${monthlyAnchor ? ` on day ${monthlyAnchor}` : ''}${delayInfo}`;
      default:
        return `Manual payouts${delayInfo}`;
    }
  };

  // Get day name
  const getDayName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day - 1] || "";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[120px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[120px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check for errors or not connected status
  if (error || data?.status === "not_connected") {
    return (
      <Card className="border border-red-200">
        <CardHeader>
          <CardTitle>Upcoming Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p>
              {data?.status === "not_connected"
                ? "You need to connect your Stripe account to receive payouts"
                : "Error loading payout data. Please try again later."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-muted/30 shadow-sm">
      <CardHeader>
        <CardTitle>Upcoming Payout</CardTitle>
        <CardDescription>Your upcoming payout information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden border border-muted/30 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Amount available for payout</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <h3 className="text-2xl font-bold">{formatCurrency(data?.balance?.available || 0)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-muted/30 shadow-sm hover:shadow transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-muted-foreground">Payout Schedule</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">When your payouts are processed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <h3 className="text-lg font-medium">{getPayoutScheduleText()}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {data?.upcomingPayout ? (
          <Card className="mt-4 border border-muted/30 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-3 mb-4 md:mb-0">
                  <div className="bg-amber-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Payout</p>
                    <h3 className="text-xl font-bold">{formatCurrency(data.upcomingPayout.amount)}</h3>
                  </div>
                </div>
                <div className="bg-muted/20 p-3 rounded-lg">
                  <p className="text-sm font-medium">Expected {formatDate(data.upcomingPayout.arrivalDate)}</p>
                  <p className="text-xs text-muted-foreground">{getRelativeTime(data.upcomingPayout.arrivalDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-muted/30">
            <p className="text-center text-muted-foreground">
              No upcoming payouts scheduled. Payouts are processed according to your Stripe account settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingPayout;
