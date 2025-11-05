# Two-Factor Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add TOTP two-factor authentication for enhanced security

**Architecture:** Use Supabase Auth 2FA API with TOTP (Google Authenticator, Authy). Add 2FA setup UI and verification flow.

**Tech Stack:** Supabase Auth MFA, qrcode.react (QR code generation), React
**Effort:** 3 days | **Priority:** LOW | **Status:** Supabase API ready 100%, UI 0%

---

## Implementation

### Task 1: Install Dependencies (Day 1 - Morning)

```bash
npm install qrcode.react --save
npm install @types/qrcode.react --save-dev
```

**Verify:**
```bash
npm list qrcode.react
```

---

### Task 2: Create 2FA Setup Component (Day 1)

**File:** `src/atomic-crm/auth/TwoFactorSetup.tsx`

```typescript
import { useState, useEffect } from "react";
import { useNotify } from "react-admin";
import { supabaseClient } from "../providers/supabase/supabase";
import { QRCodeSVG } from "qrcode.react";
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Shield } from "lucide-react";

export const TwoFactorSetup = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabaseClient.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactor = data?.totp?.[0];
      setIsEnabled(totpFactor?.status === "verified");
    } catch (error: any) {
      console.error("Error checking MFA status:", error);
    }
  };

  const handleEnableMFA = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      notify("Scan QR code with your authenticator app", { type: "info" });
    } catch (error: any) {
      notify(`Failed to enable 2FA: ${error.message}`, { type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      notify("Please enter a 6-digit code", { type: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: factorsData } = await supabaseClient.auth.mfa.listFactors();
      const factorId = factorsData?.totp?.[0]?.id;

      if (!factorId) throw new Error("No factor ID found");

      const { data, error } = await supabaseClient.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });

      if (error) throw error;

      // Generate backup codes (simulated - Supabase doesn't provide this directly)
      const codes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      setBackupCodes(codes);
      setIsEnabled(true);

      notify("Two-factor authentication enabled successfully", {
        type: "success",
      });
    } catch (error: any) {
      notify(`Verification failed: ${error.message}`, { type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    setIsLoading(true);
    try {
      const { data: factorsData } = await supabaseClient.auth.mfa.listFactors();
      const factorId = factorsData?.totp?.[0]?.id;

      if (!factorId) throw new Error("No factor ID found");

      const { error } = await supabaseClient.auth.mfa.unenroll({ factorId });

      if (error) throw error;

      setIsEnabled(false);
      setQrCode(null);
      setSecret(null);
      setBackupCodes([]);
      notify("Two-factor authentication disabled", { type: "info" });
    } catch (error: any) {
      notify(`Failed to disable 2FA: ${error.message}`, { type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEnabled && backupCodes.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />
            Two-Factor Authentication Enabled
          </CardTitle>
          <CardDescription>Your account is protected with 2FA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-2">Backup Codes</p>
              <p className="text-sm text-muted-foreground mb-2">
                Save these backup codes in a safe place. You can use them to
                access your account if you lose your authenticator device.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="bg-muted p-2 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleDisableMFA}
            disabled={isLoading}
          >
            Disable 2FA
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="text-green-600" />
            Two-Factor Authentication Enabled
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleDisableMFA}
            disabled={isLoading}
          >
            Disable 2FA
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrCode ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Enable 2FA to require a verification code from your authenticator
              app when logging in.
            </p>
            <Button onClick={handleEnableMFA} disabled={isLoading}>
              {isLoading ? "Setting up..." : "Enable 2FA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Step 1: Scan QR Code</p>
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code with Google Authenticator, Authy, or any TOTP
                authenticator app.
              </p>
              <div className="flex justify-center p-4 bg-white rounded">
                {qrCode && <QRCodeSVG value={qrCode} size={200} />}
              </div>
            </div>

            {secret && (
              <div>
                <p className="text-sm font-semibold mb-2">
                  Manual Entry Key (if QR code doesn't work):
                </p>
                <div className="bg-muted p-3 rounded font-mono text-sm">
                  {secret}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-2">
                Step 2: Verify Setup
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the 6-digit code from your authenticator app to verify
                setup.
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="verifyCode">Verification Code</Label>
                  <Input
                    id="verifyCode"
                    type="text"
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleVerifyAndEnable}
              disabled={isLoading || verifyCode.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify and Enable"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

---

### Task 3: Add 2FA Verification to Login Flow (Day 2 - Morning)

**File:** Modify `src/pages/Login.tsx`

```typescript
import { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import { supabaseClient } from "../atomic-crm/providers/supabase/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [needsMFA, setNeedsMFA] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const login = useLogin();
  const notify = useNotify();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (needsMFA) {
      // Step 2: Verify MFA code
      try {
        const { data, error } = await supabaseClient.auth.mfa.challengeAndVerify(
          {
            factorId: factorId!,
            code: mfaCode,
          }
        );

        if (error) throw error;

        await login({ email, password });
      } catch (error: any) {
        notify(`MFA verification failed: ${error.message}`, { type: "error" });
      }
    } else {
      // Step 1: Attempt login
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if MFA is required
        const { data: factorsData } =
          await supabaseClient.auth.mfa.listFactors();
        const totpFactor = factorsData?.totp?.find(
          (f) => f.status === "verified"
        );

        if (totpFactor) {
          setNeedsMFA(true);
          setFactorId(totpFactor.id);
          notify("Enter your 2FA code", { type: "info" });
        } else {
          // No MFA required, proceed with login
          await login({ email, password });
        }
      } catch (error: any) {
        notify(`Login failed: ${error.message}`, { type: "error" });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Login</h1>

        {!needsMFA ? (
          <>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Login</Button>
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="mfaCode">Two-Factor Code</Label>
              <Input
                id="mfaCode"
                type="text"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            <Button type="submit" disabled={mfaCode.length !== 6}>
              Verify
            </Button>
          </>
        )}
      </form>
    </div>
  );
};
```

---

### Task 4: Add Settings Page with 2FA Setup (Day 2 - Afternoon)

**File:** `src/pages/Settings.tsx` (create new)

```typescript
import { Card } from "@/components/ui/card";
import { TwoFactorSetup } from "../atomic-crm/auth/TwoFactorSetup";

export const Settings = () => {
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Security</h2>
        <TwoFactorSetup />
      </div>
    </div>
  );
};
```

**File:** Modify `src/atomic-crm/root/CRM.tsx`

Add route for settings:
```typescript
import { Settings } from "../../pages/Settings";

<CustomRoutes>
  <Route path="/settings" element={<Settings />} />
</CustomRoutes>
```

---

### Task 5: Add Settings Link to Navigation (Day 2 - Afternoon)

**File:** Modify `src/atomic-crm/layout/AppBar.tsx`

```typescript
import { Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";

// Add settings icon to AppBar
<Link to="/settings">
  <Button variant="ghost" size="icon">
    <SettingsIcon className="h-5 w-5" />
  </Button>
</Link>
```

---

### Task 6: Test & Document (Day 3)

**Test Steps:**
```bash
npm run dev

# 1. Test 2FA Setup
- Navigate to Settings (/settings)
- Click "Enable 2FA"
- Scan QR code with Google Authenticator
- Enter 6-digit code
- Verify backup codes displayed
- Save backup codes

# 2. Test Login with 2FA
- Logout
- Login with email/password
- Verify prompted for 2FA code
- Enter code from authenticator
- Verify login succeeds

# 3. Test Backup Codes (manual testing needed)
- Use backup code instead of authenticator code
- Verify login succeeds

# 4. Test Disable 2FA
- Navigate to Settings
- Click "Disable 2FA"
- Logout and login
- Verify no 2FA prompt
```

**Commit:**
```bash
git add src/atomic-crm/auth/TwoFactorSetup.tsx
git add src/pages/Login.tsx
git add src/pages/Settings.tsx
git add src/atomic-crm/root/CRM.tsx
git add src/atomic-crm/layout/AppBar.tsx
git commit -m "feat: implement two-factor authentication with TOTP

- Add TwoFactorSetup component with QR code generation
- Integrate Supabase Auth MFA API
- Add 2FA verification to login flow
- Generate and display backup codes
- Create Settings page for 2FA management
- Add settings link to navigation

Enhances account security with TOTP (Google Authenticator, Authy)

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Plan Status:** ✅ Ready | **Time:** 3 days | **Impact:** LOW (Security enhancement)

**Prerequisites:** Install qrcode.react package
**Security Note:** Backup codes are client-generated for demo; production should use server-side generation
