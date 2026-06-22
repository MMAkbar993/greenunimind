import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Calendar, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/utils/toast";
import {
  useGetPayoutPreferencesQuery,
  useUpdatePayoutPreferencesMutation
} from "@/redux/features/payment/payoutApi";

interface PayoutPreferencesProps {
  teacherId: string;
}

const PayoutPreferences = ({ teacherId }: PayoutPreferencesProps) => {


  const { data, isLoading, refetch } = useGetPayoutPreferencesQuery(teacherId);

  const [updatePreferences, { isLoading: isUpdating }] = useUpdatePayoutPreferencesMutation();

  const [schedule, setSchedule] = useState(data?.schedule || "monthly");
  const [minimumAmount, setMinimumAmount] = useState(data?.minimumAmount || 50);
  const [isAutoPayoutEnabled, setIsAutoPayoutEnabled] = useState(
    data?.isAutoPayoutEnabled !== undefined ? data.isAutoPayoutEnabled : true
  );

  // Update state when data is loaded
  useEffect(() => {
    if (data) {
      setSchedule(data.schedule);
      setMinimumAmount(data.minimumAmount);
      setIsAutoPayoutEnabled(data.isAutoPayoutEnabled);
    }
  }, [data]);

  const handleSavePreferences = async () => {
    try {
      await updatePreferences({
        teacherId,
        schedule,
        minimumAmount: Number(minimumAmount),
        isAutoPayoutEnabled,
      }).unwrap();

      toast.success("Preferences updated", {
        description: "Your payout preferences have been updated successfully.",
      });

      refetch();
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update payout preferences. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-muted/30 shadow-sm">
        <CardHeader>
          <CardTitle>Payout Preferences</CardTitle>
          <CardDescription>Configure how you receive your earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-4 w-48 mt-1" />
            </div>

            <div>
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-4 w-56 mt-1" />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>

            <Skeleton className="h-10 w-full mt-4 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-muted/30 shadow-sm">
      <CardHeader>
        <CardTitle>Payout Preferences</CardTitle>
        <CardDescription>Configure how you receive your earnings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Label htmlFor="schedule" className="font-medium">Payout Schedule</Label>
            </div>
            <Select
              value={schedule}
              onValueChange={setSchedule}
              disabled={isUpdating}
            >
              <SelectTrigger id="schedule" className="w-full">
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="manual">Manual (On Request)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              How often you want to receive your earnings
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <Label htmlFor="minimumAmount" className="font-medium">Minimum Payout Amount ($)</Label>
            </div>
            <Input
              id="minimumAmount"
              type="number"
              min={1}
              value={minimumAmount}
              onChange={(e) => setMinimumAmount(Number(e.target.value))}
              disabled={isUpdating}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Minimum amount required for automatic payouts
            </p>
          </div>
        </div>

        <div className="bg-muted/20 p-4 rounded-lg border border-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <Label htmlFor="autoPayout" className="font-medium">Automatic Payouts</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically process payouts based on your schedule
              </p>
            </div>
            <Switch
              id="autoPayout"
              checked={isAutoPayoutEnabled}
              onCheckedChange={setIsAutoPayoutEnabled}
              disabled={isUpdating}
            />
          </div>
        </div>

        {schedule === 'manual' && !isAutoPayoutEnabled && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Manual Payout Mode</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You've selected manual payouts with automatic processing disabled. You'll need to request payouts manually from the Payout History tab.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleSavePreferences}
          disabled={isUpdating}
          className="w-full sm:w-auto"
          size="lg"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PayoutPreferences;
