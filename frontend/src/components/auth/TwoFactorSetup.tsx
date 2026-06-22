import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, ShieldCheck, ShieldOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import {
  useSetupTwoFactorMutation,
  useVerifyTwoFactorMutation,
  useDisableTwoFactorMutation,
  useGetMeQuery
} from "@/redux/features/auth/authApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputPassWord } from "@/components/ui/input-password";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUserId, isValidObjectId } from "@/utils/getUserId";

const TwoFactorSetup = () => {
  const user = useAppSelector(selectCurrentUser);
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const [setupTwoFactor, { isLoading: isSettingUp }] = useSetupTwoFactorMutation();
  const [verifyTwoFactor, { isLoading: isVerifying }] = useVerifyTwoFactorMutation();
  const [disableTwoFactor, { isLoading: isDisabling }] = useDisableTwoFactorMutation();

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [password, setPassword] = useState("");

  // Log user data for debugging
  useEffect(() => {
    console.log('TwoFactorSetup - Redux user:', user);
    console.log('TwoFactorSetup - API user data:', userData);
  }, [user, userData]);

  // Determine the effective user object (prefer API data if available)
  const effectiveUser = userData?.data || user;

  // Check if 2FA is already enabled
  const isTwoFactorEnabled = !!(effectiveUser?.twoFactorEnabled ||
    (effectiveUser?.user && typeof effectiveUser.user === 'object' && effectiveUser.user.twoFactorEnabled));

  // Reset state when setup mode changes
  useEffect(() => {
    if (!isSetupMode) {
      setQrCodeUrl(null);
      setSecret(null);
      setVerificationCode("");
    }
  }, [isSetupMode]);

  const handleStartSetup = async () => {
    if (!effectiveUser) {
      toast.error("User data not found. Please try again later.");
      return;
    }

    try {
      // Extract the user ID using our utility function
      const userId = getUserId(effectiveUser);

      if (!userId) {
        // Log detailed information about the user object for debugging
        console.error("Failed to extract user ID for 2FA setup. User object:", JSON.stringify(effectiveUser, null, 2));
        toast.error("User ID not found. Please try again later.");
        return;
      }

      // Validate that the ID is a valid MongoDB ObjectId
      if (!isValidObjectId(userId)) {
        toast.error("Invalid user ID format. Please try again later.");
        console.error("Invalid user ID format:", userId);
        return;
      }

      console.log("Setting up 2FA for user:", {
        userId,
        source: userData ? "API data" : "Redux store"
      });

      setIsSetupMode(true);
      toast.loading("Setting up two-factor authentication...", { id: "2fa-setup" });

      const result = await setupTwoFactor(userId).unwrap();

      if (result.success && result.data) {
        setQrCodeUrl(result.data.qrCodeUrl);
        setSecret(result.data.secret);
        toast.success("Setup initiated. Scan the QR code with your authenticator app.", { id: "2fa-setup" });
      } else {
        toast.error("Failed to setup two-factor authentication. Please try again.", { id: "2fa-setup" });
        setIsSetupMode(false);
      }
    } catch (error) {
      console.error("Failed to setup 2FA:", error);
      toast.error("Failed to setup two-factor authentication. Please try again.", { id: "2fa-setup" });
      setIsSetupMode(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6 || !secret) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    if (!effectiveUser) {
      toast.error("User data not found. Please try again later.");
      return;
    }

    try {
      // Extract the user ID using our utility function
      const userId = getUserId(effectiveUser);

      if (!userId) {
        // Log detailed information about the user object for debugging
        console.error("Failed to extract user ID for 2FA verification. User object:", JSON.stringify(effectiveUser, null, 2));
        toast.error("User ID not found. Please try again later.");
        return;
      }

      // Validate that the ID is a valid MongoDB ObjectId
      if (!isValidObjectId(userId)) {
        toast.error("Invalid user ID format. Please try again later.");
        console.error("Invalid user ID format:", userId);
        return;
      }

      console.log("Verifying 2FA setup for user:", {
        userId,
        source: userData ? "API data" : "Redux store"
      });

      toast.loading("Verifying code...", { id: "2fa-verify" });

      const result = await verifyTwoFactor({
        token: verificationCode,
        userId: userId,
        secret,
      }).unwrap();

      if (result.success) {
        toast.success("Two-factor authentication enabled successfully!", { id: "2fa-verify" });
        setIsSetupMode(false);

        // Short delay before reload to allow the toast to be seen
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error("Failed to enable two-factor authentication. Please try again.", { id: "2fa-verify" });
      }
    } catch (error: any) {
      console.error("Failed to verify 2FA setup:", error);

      // Try to extract more detailed error information
      let errorMessage = "Invalid verification code. Please try again.";
      if (error.data?.message) {
        errorMessage = error.data.message;
      }

      toast.error(errorMessage, { id: "2fa-verify" });
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    if (!effectiveUser) {
      toast.error("User data not found. Please try again later.");
      return;
    }

    try {
      // Extract the user ID using our utility function
      const userId = getUserId(effectiveUser);

      if (!userId) {
        // Log detailed information about the user object for debugging
        console.error("Failed to extract user ID for 2FA disabling. User object:", JSON.stringify(effectiveUser, null, 2));
        toast.error("User ID not found. Please try again later.");
        return;
      }

      // Validate that the ID is a valid MongoDB ObjectId
      if (!isValidObjectId(userId)) {
        toast.error("Invalid user ID format. Please try again later.");
        console.error("Invalid user ID format:", userId);
        return;
      }

      console.log("Disabling 2FA for user:", {
        userId,
        source: userData ? "API data" : "Redux store"
      });

      toast.loading("Disabling two-factor authentication...", { id: "2fa-disable" });

      const result = await disableTwoFactor({
        userId: userId,
        password,
      }).unwrap();

      if (result.success) {
        toast.success("Two-factor authentication disabled successfully!", { id: "2fa-disable" });
        setDisableDialogOpen(false);
        setPassword("");

        // Short delay before reload to allow the toast to be seen
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error("Failed to disable two-factor authentication.", { id: "2fa-disable" });
      }
    } catch (error: any) {
      console.error("Failed to disable 2FA:", error);

      // Try to extract more detailed error information
      let errorMessage = "Failed to disable two-factor authentication. Please check your password and try again.";
      if (error.data?.message) {
        errorMessage = error.data.message;
      }

      toast.error(errorMessage, { id: "2fa-disable" });
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Two-Factor Authentication</span>
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account with two-factor authentication
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isTwoFactorEnabled ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">Two-factor authentication is enabled</AlertTitle>
              <AlertDescription className="text-green-700">
                Your account is protected with an additional layer of security.
              </AlertDescription>
            </Alert>

            <p className="text-sm text-gray-600">
              With two-factor authentication enabled, you'll need to enter a verification code from your
              authenticator app each time you sign in to your account.
            </p>
          </div>
        ) : isSetupMode ? (
          <div className="space-y-6">
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator)
                  </p>
                  <div className="border border-gray-200 p-2 rounded-lg mb-4">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Or enter this code manually in your app:
                  </p>
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                    {secret}
                  </code>
                </div>

                <div className="space-y-2">
                  <label htmlFor="verification-code" className="text-sm font-medium">
                    Enter the 6-digit verification code from your app:
                  </label>
                  <Input
                    id="verification-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800">Two-factor authentication is not enabled</AlertTitle>
              <AlertDescription className="text-amber-700">
                Enable two-factor authentication for additional account security.
              </AlertDescription>
            </Alert>

            <p className="text-sm text-gray-600">
              Two-factor authentication adds an extra layer of security to your account by requiring a verification
              code from your phone in addition to your password when you sign in.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        {isTwoFactorEnabled ? (
          <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <ShieldOff className="h-4 w-4" />
                Disable Two-Factor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  This will remove the additional security from your account. Please confirm by entering your password.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <InputPassWord
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDisableDialogOpen(false)}
                  disabled={isDisabling}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisableTwoFactor}
                  disabled={!password || isDisabling}
                >
                  {isDisabling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable Two-Factor"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : isSetupMode ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsSetupMode(false)}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifySetup}
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Enable Two-Factor"
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleStartSetup}
            disabled={isSettingUp}
            className="flex items-center gap-2"
          >
            {isSettingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Setup Two-Factor
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TwoFactorSetup;
