"use client";

import { useId } from "react";
import { Mail, User } from "lucide-react";
import { PhoneInputField } from "@bengo-hub/shared-ui-lib/contact";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GUEST_NAME_MAX_LENGTH } from "@/lib/guest-name";

interface GuestContactFormProps {
  email: string;
  phone: string;
  name: string;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSignIn: () => void;
  /** Inline message under the name field; null when the name is fine or not checked yet. */
  nameError?: string | null | undefined;
  onNameBlur?: (() => void) | undefined;
  /** The form was filled from details saved on this device: offer "Not you? Clear". */
  prefilled?: boolean | undefined;
  onClearSaved?: (() => void) | undefined;
}

export function GuestContactForm({
  email,
  phone,
  name,
  onEmailChange,
  onPhoneChange,
  onNameChange,
  onSignIn,
  nameError,
  onNameBlur,
  prefilled,
  onClearSaved,
}: GuestContactFormProps) {
  const ids = useId();
  const nameId = `${ids}-name`;
  const nameHelpId = `${ids}-name-help`;
  const nameErrorId = `${ids}-name-error`;

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Contact Information</h2>
        {prefilled && onClearSaved && (
          <button type="button" onClick={onClearSaved} className="text-xs font-medium text-primary hover:underline">
            Not you? Clear
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={nameId}>Your name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              id={nameId}
              autoComplete="given-name"
              placeholder="e.g. Wanjiku"
              aria-required="true"
              maxLength={GUEST_NAME_MAX_LENGTH + 10}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={onNameBlur}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? `${nameErrorId} ${nameHelpId}` : nameHelpId}
              className="min-h-[44px] pl-10"
            />
          </div>
          {nameError && (
            <p id={nameErrorId} role="alert" className="text-xs text-destructive">
              {nameError}
            </p>
          )}
          <p id={nameHelpId} className="text-xs text-muted-foreground">
            So the kitchen and rider know who to ask for.
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Email or phone</p>
          <p className="text-xs text-muted-foreground">Give at least one so we can reach you about this order.</p>
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            type="email"
            autoComplete="email"
            aria-label="Email address"
            placeholder="Email address"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="min-h-[44px] pl-10"
          />
        </div>
        <PhoneInputField
          value={phone}
          onChange={onPhoneChange}
          placeholder="Phone number"
          className="min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll use these to send your order confirmation and delivery updates.{" "}
          <button type="button" onClick={onSignIn} className="font-medium text-primary hover:underline">
            Sign in instead
          </button>
        </p>
      </div>
    </section>
  );
}
