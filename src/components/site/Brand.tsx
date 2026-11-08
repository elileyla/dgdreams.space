import Image from "next/image";
import Link from "next/link";

/**
 * The brand, in two pieces.
 *
 * The mark is the v2 "Orbit-D" (see scripts/build-brand-assets.mjs). The
 * wordmark is set in Archivo rather than baked into an SVG: it inherits the
 * theme's text colour, stays crisp at any size, and never needs a second file
 * per theme.
 */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <Image
      src="/brand/mark.svg"
      alt=""
      width={size}
      height={size}
      priority
      className="shrink-0"
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-bold leading-none ${className}`}
      style={{
        color: "var(--text-bright)",
        fontSize: 14.5,
        letterSpacing: "0.09em",
      }}
    >
      DGDREAMS
      <span style={{ color: "var(--accent-text)" }}>.</span>
    </span>
  );
}

export function BrandLockup({
  href = "/",
  size = 30,
  className = "",
  wordmarkClassName = "",
}: {
  href?: string;
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="DGDreams — home"
      className={`group inline-flex items-center gap-2.5 rounded-lg ${className}`}
    >
      <span className="transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105">
        <BrandMark size={size} />
      </span>
      <Wordmark className={wordmarkClassName} />
    </Link>
  );
}
