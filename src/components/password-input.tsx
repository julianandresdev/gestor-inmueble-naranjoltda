"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordField({
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  label,
  error,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}