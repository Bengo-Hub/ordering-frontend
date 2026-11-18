"use client";

import { useEffect, useId, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api/error-message";
import {
  createGuestAccount,
  guestAccountErrorField,
  requestGuestAccountCode,
} from "@/lib/api/guest-account";
import {
  isSavePromptDone,
  markSavePromptDone,
  saveGuestDetails,
  type SavedGuestDetails,
} from "@/lib/guest-details";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

interface SaveDetailsCardProps {
  orgSlug: string;
  /** The details this order was placed with. */
  details: SavedGuestDetails;
  /** Needed for the optional account; without them only the device save is offered. */
  orderId?: string | undefined;
  sessionId?: string | undefined;
  className?: string | undefined;
}

type Phase = "form" | "code" | "done";

/**
 * After a guest order: "Save my details for next time". The box starts unticked. Saving keeps
 * the details on this device only. With an email on the order, a password can be added to
 * make an account; auth-api first proves the email with a code. Saying no (or saving) is
 * remembered on this device, so the card is not shown again.
 */
export function SaveDetailsCard({ orgSlug, details, orderId, sessionId, className }: SaveDetailsCardProps) {
  const ids = useId();
  // Hidden until the device's answer is read, so a guest who said no never sees it flash.
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [remember, setRemember] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | undefined>(undefined);
  const [doneMessages, setDoneMessages] = useState<string[]>([]);

  useEffect(() => {
    setVisible(!isSavePromptDone(orgSlug));
  }, [orgSlug]);

  const canOfferAccount = !!details.email && !!orderId && !!sessionId;
  const wantsAccount = canOfferAccount && password.length > 0;

  if (!visible) return null;

  const showError = (message: string, field?: string) => {
    setError(message);
    setErrorField(field);
  };

  const finish = (messages: string[]) => {
    setPassword("");
    setCode("");
    setDoneMessages(messages);
    setPhase("done");
  };

  const handleNoThanks = () => {
    markSavePromptDone(orgSlug);
    setVisible(false);
  };

  const handleSave = async () => {
    setError(null);
    setErrorField(undefined);
    if (wantsAccount && password.length < MIN_PASSWORD_LENGTH) {
      showError("Use at least 8 characters.", "password");
      return;
    }

    const messages: string[] = [];
    if (remember) {
      messages.push(
        saveGuestDetails(orgSlug, details)
          ? "Saved on this device. We'll fill in your details next time."
          : "This browser would not let us save your details.",
      );
    }
    markSavePromptDone(orgSlug);

    if (!wantsAccount) {
      finish(messages);
      return;
    }

    setBusy(true);
    try {
      const res = await requestGuestAccountCode(orgSlug, orderId!, sessionId!);
      if (res.status === "exists") {
        finish([...messages, res.message ?? "You already have an account with this email. Sign in next time to check out faster."]);
      } else {
        setDoneMessages(messages);
        setPhase("code");
      }
    } catch (err) {
      showError(await apiErrorMessage(err, "We could not send the code. Please try again."), guestAccountErrorField(err));
      // The device save, if ticked, already happened; say so while the account part waits.
      setDoneMessages(messages);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setErrorField(undefined);
    setBusy(true);
    try {
      const res = await requestGuestAccountCode(orgSlug, orderId!, sessionId!);
      if (res.status === "exists") {
        finish([...doneMessages, res.message ?? "You already have an account with this email."]);
      }
    } catch (err) {
      showError(await apiErrorMessage(err, "We could not send the code. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    setErrorField(undefined);
    if (!/^\d{6}$/.test(code.trim())) {
      showError("Enter the 6-digit code from the email.", "email_code");
      return;
    }
    setBusy(true);
    try {
      const res = await createGuestAccount(orgSlug, orderId!, sessionId!, password, code.trim());
      finish([
        ...doneMessages,
        res.status === "exists"
          ? (res.message ?? "You already have an account with this email. Sign in next time to check out faster.")
          : `Account created. Next time, sign in with ${details.email} to check out faster.`,
      ]);
    } catch (err) {
      const field = guestAccountErrorField(err);
      showError(await apiErrorMessage(err, "We could not create your account. Please try again."), field);
      // A weak password is fixed on the form; the email stays verified for a while.
      if (field === "password") setPhase("code");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "done") {
    if (doneMessages.length === 0) return null;
    return (
      <Card className={cn("w-full text-left", className)}>
        <CardContent className="flex items-start gap-3 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
          <div className="space-y-1 text-sm">
            {doneMessages.map((m) => (
              <p key={m}>{m}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full text-left", className)}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Save my details for next time</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Skip typing your name, phone, email and address on your next order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {phase === "form" && (
          <>
            <div>
              <label htmlFor={`${ids}-remember`} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  id={`${ids}-remember`}
                  type="checkbox"
                  className="size-4 accent-brand-emphasis"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Save my details on this device
              </label>
              <p className="pl-7 text-xs text-muted-foreground">Kept in this browser only. Anyone using it will see them.</p>
            </div>

            {canOfferAccount && (
              <div className="space-y-2">
                <Label htmlFor={`${ids}-password`}>
                  Add a password to check out faster next time (optional)
                </Label>
                {/* Lets a password manager file the password under the right email. */}
                <input type="email" name="username" autoComplete="username" value={details.email} readOnly hidden />
                <PasswordField
                  id={`${ids}-password`}
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((s) => !s)}
                  invalid={errorField === "password"}
                />
                <p className="text-xs text-muted-foreground">
                  At least 8 characters. We&apos;ll email a code to {details.email} to confirm it&apos;s you.
                </p>
              </div>
            )}
          </>
        )}

        {phase === "code" && (
          <div className="space-y-2">
            <Label htmlFor={`${ids}-code`}>Enter the 6-digit code we emailed to {details.email}</Label>
            <Input
              id={`${ids}-code`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              aria-invalid={errorField === "email_code"}
              className="min-h-[44px] tracking-widest"
            />
            {errorField === "password" && (
              <PasswordField
                id={`${ids}-password-retry`}
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggle={() => setShowPassword((s) => !s)}
                invalid
              />
            )}
            <button
              type="button"
              onClick={handleResend}
              disabled={busy}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
            >
              Send a new code
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {phase === "code" && doneMessages.map((m) => (
          <p key={m} className="text-xs text-muted-foreground">
            {m}
          </p>
        ))}

        <div className="flex flex-col gap-2 sm:flex-row">
          {phase === "form" ? (
            <>
              <Button onClick={handleSave} disabled={busy || (!remember && !wantsAccount)} className="gap-2">
                {busy && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
              <Button variant="ghost" onClick={handleNoThanks} disabled={busy}>
                No thanks
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCreate} disabled={busy} className="gap-2">
                {busy && <Loader2 className="size-4 animate-spin" />}
                Create account
              </Button>
              <Button variant="ghost" onClick={() => finish(doneMessages)} disabled={busy}>
                Skip
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  show,
  onToggle,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        name="new-password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className="min-h-[44px] pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
