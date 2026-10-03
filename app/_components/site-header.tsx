import Link from "next/link";
import { BrandMark } from "@/app/_components/brand-mark";

const links = [
  { href: "/", label: "O aplikacji" },
  { href: "/asystent", label: "Asystent" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

type Props = { current: (typeof links)[number]["href"] };

export function SiteHeader({ current }: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-outline-variant/40 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-lg"
          aria-label="Hubmi — strona główna"
        >
          <BrandMark className="size-8 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-primary">
              Hubmi
            </span>
            <span className="hidden text-xs text-on-surface-variant sm:block">
              Małopolski Hub Innowacji Społecznych
            </span>
          </span>
        </Link>
        <nav aria-label="Główna" className="flex items-center gap-1 sm:gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
              className={
                link.href === current
                  ? "flex min-h-11 items-center border-b-2 border-secondary px-2 text-sm font-semibold text-primary"
                  : "flex min-h-11 items-center px-2 text-sm text-on-surface-variant hover:text-primary hover:underline"
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
