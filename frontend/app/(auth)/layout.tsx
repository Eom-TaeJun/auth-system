import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-129px)] items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_45%)]" />
      <div className="pointer-events-none absolute -left-16 top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
            ← Back to home
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
