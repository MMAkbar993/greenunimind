import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { useSetupTwoFactorMutation, useVerifyTwoFactorMutation } from "@/redux/features/auth/authApi";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Key,
  RefreshCw,
  Info
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TwoFactorAuth = () => {
  const user = useAppSelector(selectCurrentUser);
  const [setupTwoFactor, { isLoading: isSettingUp }] = useSetupTwoFactorMutation();
  const [verifyTwoFactor, { isLoading: isVerifying }] = useVerifyTwoFactorMutation();

  const [setupData, setSetupData] = useState<{
    qrCodeUrl?: string;
    secret?: string;
    recoveryCodes?: string[];
  }>({});

  const [verificationCode, setVerificationCode] = useState("");
  const [setupStep, setSetupStep] = useState<"initial" | "setup" | "verify" | "complete">("initial");
  const [verificationMethod, setVerificationMethod] = useState<"app" | "sms">("app");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [recoveryCodesVisible, setRecoveryCodesVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("setup");

  // Check if 2FA is already enabled
  const isTwoFactorEnabled = user?.twoFactorEnabled;

  const handleToggle2FA = async (enable: boolean) => {
    if (!user?._id) {
      toast.error("User ID not found");
      return;
    }

    try {
      if (enable) {
        // Start 2FA setup
        const result = await setupTwoFactor({
          userId: user._id,
          enable: true,
        }).unwrap();

        setSetupData({
          qrCodeUrl: result.data.qrCodeUrl,
          secret: result.data.secret,
          recoveryCodes: result.data.recoveryCodes,
        });

        setActiveTab("setup");
        setSetupStep("setup");
      } else {
        // Disable 2FA
        await setupTwoFactor({
          userId: user._id,
          enable: false,
        }).unwrap();

        toast.success("Two-factor authentication disabled");
        setSetupStep("initial");
        // Reset all state
        setSetupData({});
        setVerificationCode("");
        setVerificationMethod("app");
        setPhoneNumber("");
        setRecoveryCodesVisible(false);
      }
    } catch (error) {
      console.error("Failed to setup 2FA:", error);
      toast.error("Failed to setup two-factor authentication");
    }
  };

  const handleVerify = async () => {
    if (!user?._id) {
      toast.error("User ID not found");
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }

    try {
      await verifyTwoFactor({
        userId: user._id,
        token: verificationCode,
      }).unwrap();

      toast.success("Two-factor authentication enabled successfully");
      setSetupStep("complete");
      setRecoveryCodesVisible(true);
      setActiveTab("recovery");
    } catch (error) {
      console.error("Failed to verify 2FA setup:", error);
      toast.error("Invalid verification code. Please try again.");
    }
  };

  const handleSendSMSCode = () => {
    if (!phoneNumber) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const formattedNumber = `${countryCode}${phoneNumber.replace(/[^0-9]/g, '')}`;

    // This would be implemented in the backend
    toast.info(`SMS verification will be sent to ${formattedNumber} when the backend supports it`);
    // For now, we'll just show a message that this feature is coming soon
    toast.info("SMS verification is coming soon!");
  };

  const regenerateRecoveryCodes = async () => {
    if (!user?._id) {
      toast.error("User ID not found");
      return;
    }

    try {
      // This would be a new API endpoint to regenerate recovery codes
      // For now, we'll just show a message
      toast.info("Recovery codes regeneration is coming soon!");

      // When implemented, it would look something like this:
      /*
      const result = await regenerateRecoveryCodes({
        userId: user._id,
      }).unwrap();

      setSetupData(prev => ({
        ...prev,
        recoveryCodes: result.data.recoveryCodes,
      }));

      toast.success("Recovery codes regenerated successfully");
      */
    } catch (error) {
      console.error("Failed to regenerate recovery codes:", error);
      toast.error("Failed to regenerate recovery codes");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadRecoveryCodes = () => {
    if (!setupData.recoveryCodes?.length) return;

    const content = "# GreenUniMind 2FA Recovery Codes\n\n" +
      "Keep these recovery codes in a safe place. Each code can only be used once.\n\n" +
      setupData.recoveryCodes.join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "greenuniminds-2fa-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Two-Factor Authentication (2FA)</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {setupStep === "initial" && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa-toggle" className="text-base font-medium">
                  {isTwoFactorEnabled ? "Enabled" : "Disabled"}
                </Label>
                <p className="text-sm text-gray-500">
                  {isTwoFactorEnabled
                    ? "Your account is protected with two-factor authentication"
                    : "Enable two-factor authentication for enhanced security"}
                </p>
              </div>
              <Switch
                id="2fa-toggle"
                checked={isTwoFactorEnabled}
                onCheckedChange={handleToggle2FA}
                disabled={isSettingUp}
              />
            </div>

            {isTwoFactorEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 text-sm bg-green-50 text-green-700 rounded-md">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Two-factor authentication is enabled for your account</span>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Manage 2FA Settings</h3>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSetupStep("complete");
                        setActiveTab("recovery");
                      }}
                      className="w-full sm:w-auto"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Manage Recovery Codes
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleToggle2FA(false)}
                      className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Disable Two-Factor Authentication
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm bg-amber-50 text-amber-700 rounded-md">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Why enable two-factor authentication?</p>
                    <ul className="mt-1 ml-5 list-disc">
                      <li>Protect your account from unauthorized access</li>
                      <li>Prevent account takeovers even if your password is compromised</li>
                      <li>Get notified of login attempts to your account</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {setupStep === "setup" && setupData.qrCodeUrl && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="methods">Methods</TabsTrigger>
                <TabsTrigger value="recovery">Recovery</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-6 mt-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Step 1: Scan QR Code</h3>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Step 2: Manual Setup (if needed)</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      If you can't scan the QR code, enter this code manually in your authenticator app:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                        {setupData.secret}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(setupData.secret || "")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Step 3: Verify Setup</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Enter the 6-digit verification code from your authenticator app:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        className="font-mono text-center"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                      />
                      <Button
                        onClick={handleVerify}
                        disabled={isVerifying || verificationCode.length !== 6}
                      >
                        {isVerifying ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="methods" className="space-y-6 mt-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Verification Method</h3>
                  <div className="space-y-4">
                    <RadioGroup
                      value={verificationMethod}
                      onValueChange={(value) => setVerificationMethod(value as "app" | "sms")}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="app" id="app" className="mt-1" />
                        <div className="grid gap-1.5">
                          <Label htmlFor="app" className="font-medium">Authenticator App</Label>
                          <p className="text-sm text-gray-500">
                            Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="sms" id="sms" className="mt-1" />
                        <div className="grid gap-1.5">
                          <Label htmlFor="sms" className="font-medium">SMS Verification (Coming Soon)</Label>
                          <p className="text-sm text-gray-500">
                            Receive verification codes via SMS text message
                          </p>

                          {verificationMethod === "sms" && (
                            <div className="mt-2 space-y-3">
                              <div className="flex gap-2">
                                <Select value={countryCode} onValueChange={setCountryCode}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue placeholder="Code" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="+1">+1 (US)</SelectItem>
                                    <SelectItem value="+44">+44 (UK)</SelectItem>
                                    <SelectItem value="+91">+91 (IN)</SelectItem>
                                    <SelectItem value="+61">+61 (AU)</SelectItem>
                                    <SelectItem value="+86">+86 (CN)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="tel"
                                  placeholder="Phone number"
                                  value={phoneNumber}
                                  onChange={(e) => setPhoneNumber(e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                              <Button
                                onClick={handleSendSMSCode}
                                className="w-full sm:w-auto"
                                disabled
                              >
                                <Smartphone className="w-4 h-4 mr-2" />
                                Send Verification Code
                              </Button>
                              <p className="text-xs text-amber-600 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                SMS verification is coming soon
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recovery" className="space-y-6 mt-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Recovery Codes</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={regenerateRecoveryCodes}
                            disabled
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Generate new recovery codes (invalidates old ones)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
                      <strong className="block mt-1">Each code can only be used once.</strong>
                    </p>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {setupData.recoveryCodes?.map((code, index) => (
                          <code key={index} className="font-mono text-sm">
                            {code}
                          </code>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(setupData.recoveryCodes?.join("\n") || "")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadRecoveryCodes}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 text-sm bg-amber-50 text-amber-700 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Important:</p>
                      <ul className="mt-1 ml-5 list-disc">
                        <li>You'll need to enter a verification code each time you sign in</li>
                        <li>If you lose access to your authenticator app, you can use a recovery code</li>
                        <li>Each recovery code can only be used once</li>
                        <li>Store these codes in a secure password manager or printed in a safe place</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {setupStep === "complete" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-md">
              <ShieldCheck className="w-6 h-6" />
              <div>
                <h3 className="font-medium">Two-factor authentication enabled</h3>
                <p className="text-sm">Your account is now protected with an additional layer of security</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="methods">Verification Methods</TabsTrigger>
                <TabsTrigger value="recovery">Recovery Codes</TabsTrigger>
              </TabsList>

              <TabsContent value="methods" className="space-y-6 mt-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Active Verification Methods</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                      <div className="mt-0.5">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Authenticator App</h4>
                        <p className="text-sm text-gray-500">
                          You're using an authenticator app to generate verification codes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md opacity-60">
                      <div className="mt-0.5">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          SMS Verification
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">Coming Soon</span>
                        </h4>
                        <p className="text-sm text-gray-500">
                          Receive verification codes via SMS text message
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleToggle2FA(false)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Disable Two-Factor Authentication
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="recovery" className="space-y-6 mt-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Recovery Codes</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={regenerateRecoveryCodes}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Generate new recovery codes (invalidates old ones)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      These recovery codes can be used to access your account if you lose your authenticator device.
                      <strong className="block mt-1">Each code can only be used once.</strong>
                    </p>

                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {setupData.recoveryCodes?.map((code, index) => (
                          <code key={index} className="font-mono text-sm">
                            {code}
                          </code>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(setupData.recoveryCodes?.join("\n") || "")}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadRecoveryCodes}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleToggle2FA(false)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Disable Two-Factor Authentication
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuth;
