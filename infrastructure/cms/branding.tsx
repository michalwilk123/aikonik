import {
  LoginView,
  type LoginViewProps,
} from "@delmaredigital/payload-better-auth/components";
import type { AdminViewServerProps } from "payload";
import { Wordmark } from "@/app/_components/brand-mark";

export function StaffLogo() {
  return <Wordmark className="staff-wordmark" />;
}

export function StaffIcon() {
  // biome-ignore lint/performance/noImgElement: Reuse the app's small vector icon without image processing.
  return <img src="/icon.svg" alt="AiKonik" width={24} height={24} />;
}

export function StaffLogin({ initPageResult }: AdminViewServerProps) {
  const settings = initPageResult.req.payload.config.custom?.betterAuth;
  return (
    <div className="staff-login">
      <LoginView
        {...(settings?.login as LoginViewProps)}
        authBasePath={settings?.authBasePath}
        logo={<StaffLogo />}
      />
    </div>
  );
}
