import {
  ArrowRight02Icon,
  Login02Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons";
import { type FormEvent, useState } from "react";
import { api } from "../../api";
import { AppIcon } from "../ui/primitives";

function LoginField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="h-12 w-full rounded-sm border border-white/15 bg-white/5 px-3.5 text-[15px] text-white outline-none transition placeholder:text-zinc-600 hover:border-white/30 focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.login({ email, password });
      window.dispatchEvent(new Event("aeroplane-auth-changed"));
      window.location.assign("/");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not sign in");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-[500px]"
      aria-label="Sign in to Aeroplane"
    >
      <div className="mb-9">
        <div>
          <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
            <AppIcon icon={Login02Icon} size={18} />
          </span>
          <h1 className="font-hero text-3xl tracking-[-0.05em] text-white">
            Welcome back
          </h1>
        </div>
      </div>

      <div className="grid gap-y-5">
        <LoginField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <LoginField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Enter your password"
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 border-l-2 border-white bg-white/10 px-4 py-3 text-sm text-white"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="group mt-7 flex h-14 w-full items-center justify-between rounded-sm bg-white px-5 text-left text-black shadow-[0_18px_40px_rgba(0,0,0,0.3)] transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-60"
      >
        <span className="text-sm font-semibold">
          {submitting ? "Signing in…" : "Sign in"}
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10 transition-transform group-hover:translate-x-1">
          <AppIcon
            icon={submitting ? ShieldUserIcon : ArrowRight02Icon}
            size={16}
            className={submitting ? "animate-pulse" : ""}
          />
        </span>
      </button>

    </form>
  );
}
