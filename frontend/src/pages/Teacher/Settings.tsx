
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BellRing,
  Check,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Key,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Shield,
  User,
  Wallet
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/utils/toast";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useCreateStripeAccountMutation,
  useCheckStripeAccountStatusQuery,
  useCreateAccountLinkMutation
} from "@/redux/features/payment/payment.api";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

const Settings = () => {

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Get user data
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const user = useAppSelector(selectCurrentUser);
  const teacherId = userData?.data?._id;

  // Stripe Connect
  const [createStripeAccount, { isLoading: isConnecting }] = useCreateStripeAccountMutation();
  const { data: stripeStatus, isLoading: isStripeStatusLoading } =
    useCheckStripeAccountStatusQuery(teacherId, { skip: !teacherId });
  const [createAccountLink, { isLoading: isCreatingLink }] = useCreateAccountLinkMutation();

  const isStripeConnected = stripeStatus?.stripeVerified;
  const needsOnboarding = stripeStatus?.stripeAccountId && !stripeStatus?.stripeOnboardingComplete;

  // Handle Stripe Connect
  const handleConnectStripe = async () => {
    if (!teacherId) return;

    try {
      if (needsOnboarding) {
        // Complete onboarding if account exists but not fully onboarded
        const result = await createAccountLink(teacherId).unwrap();
        if (result?.url) {
          window.location.href = result.url;
        }
      } else {
        // Create new account
        const result = await createStripeAccount(teacherId).unwrap();
        if (result?.url) {
          window.location.href = result.url;
        }
      }
    } catch (error) {
      console.error("Failed to connect Stripe:", error);
      toast.error("Connection Failed", {
        description: "Could not connect to Stripe. Please try again later.",
      });
    }
  };

  // Mock function for saving settings
  const handleSaveSettings = () => {
    toast.success("Settings Saved", {
      description: "Your settings have been updated successfully.",
    });
  };

  // Get user name and image
  const userName = userData?.data?.name
    ? `${userData.data.name.firstName} ${userData.data.name.lastName}`
    : user?.name?.firstName
      ? `${user.name.firstName} ${user.name.lastName}`
      : "User";

  const userImage = userData?.data?.profileImg || user?.photoUrl;
  const userEmail = userData?.data?.email || user?.email || "";

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-card border rounded-lg p-1">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="hidden lg:flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and how it appears to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userImage} alt={userName} />
                    <AvatarFallback className="text-lg">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">Change Photo</Button>
                </div>

                <div className="grid gap-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        defaultValue={userData?.data?.name?.firstName || user?.name?.firstName || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        defaultValue={userData?.data?.name?.lastName || user?.name?.lastName || ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={userEmail}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Tell students a bit about yourself..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Integration</CardTitle>
              <CardDescription>
                Connect your payment account to receive earnings from your courses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isStripeStatusLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isStripeConnected ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800">Stripe Account Connected</h3>
                      <p className="text-green-700 text-sm mt-1">
                        Your Stripe account is connected and ready to receive payments. You'll earn 70% of each course sale.
                      </p>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100"
                          onClick={handleConnectStripe}
                          disabled={isConnecting || isCreatingLink}
                        >
                          {isConnecting || isCreatingLink ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Manage Stripe Account
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-800">Connect Stripe to Receive Payments</h3>
                      <p className="text-blue-700 text-sm mt-1">
                        Connect your Stripe account to receive payments from your courses. You'll earn 70% of each course sale.
                      </p>
                      <div className="mt-3">
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleConnectStripe}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Connect Stripe Account
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payout Preferences</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                    <select
                      id="payoutSchedule"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly" selected>Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumPayout">Minimum Payout Amount ($)</Label>
                    <Input id="minimumPayout" type="number" defaultValue="50" min="1" />
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="automaticPayouts" className="text-base">Automatic Payouts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive payouts automatically based on your schedule
                    </p>
                  </div>
                  <Switch id="automaticPayouts" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">New Student Enrollments</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email when a student enrolls in your course
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Course Reviews</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email when a student leaves a review
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Payment Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive an email for successful payments and payouts
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Marketing Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive emails about new features and promotions
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {isPasswordVisible ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button className="mt-2">Update Password</Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-amber-800">Two-factor authentication not enabled</h3>
                      <p className="text-amber-700 text-sm mt-1">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Actions</h3>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out of All Devices
                  </Button>

                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    <Key className="mr-2 h-4 w-4" />
                    Reset Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced settings for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data & Privacy</h3>

                <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow us to collect usage data to improve your experience
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Course Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect detailed analytics about your courses and students
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="mt-6">
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Export My Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
