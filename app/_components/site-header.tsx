import Link from "next/link";
import { Wordmark } from "@/app/_components/brand-mark";

const links = [
  { href: "/", label: "O aplikacji" },
  { href: "/asystent", label: "Asystent" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

type Props = { current: (typeof links)[number]["href"] };

export function SiteHeader({ current }: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-outline-variant bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-full"
          aria-label="AiKonik — strona główna"
        >
          <Wordmark className="text-2xl" />
        </Link>
        <nav aria-label="Główna" className="flex items-center gap-1 sm:gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
              className={
                link.href === current
                  ? "flex min-h-11 items-center rounded-full bg-primary-container px-4 text-sm font-bold text-on-primary-container"
                  : "flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
