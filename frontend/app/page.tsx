import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <ShieldCheck className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Secure Authentication System
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          A modern, full-stack authentication solution built with Next.js 14 and Fastify.
          Fast, secure, and developer-friendly.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "default" }))}
            href="/login"
          >
            Sign In
          </Link>
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/register"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Secure by Design</CardTitle>
            <CardDescription>
              Built with industry-standard security practices including JWT tokens,
              password hashing with bcrypt, and secure HTTP-only cookies.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Modern Stack</CardTitle>
            <CardDescription>
              Powered by Next.js 14 with App Router, React 18, TypeScript,
              and Fastify backend for blazing-fast performance.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="rounded-full bg-primary/10 p-3 w-fit mb-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Type-Safe</CardTitle>
            <CardDescription>
              End-to-end TypeScript for better developer experience, fewer bugs,
              and improved maintainability across the entire stack.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Tech Stack Section */}
      <section className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
        <div className="flex flex-wrap gap-3 justify-center text-sm">
          <span className="px-4 py-2 bg-secondary rounded-full">Next.js 14</span>
          <span className="px-4 py-2 bg-secondary rounded-full">React 18</span>
          <span className="px-4 py-2 bg-secondary rounded-full">TypeScript</span>
          <span className="px-4 py-2 bg-secondary rounded-full">Fastify</span>
          <span className="px-4 py-2 bg-secondary rounded-full">PostgreSQL</span>
          <span className="px-4 py-2 bg-secondary rounded-full">Prisma</span>
          <span className="px-4 py-2 bg-secondary rounded-full">Tailwind CSS</span>
          <span className="px-4 py-2 bg-secondary rounded-full">JWT</span>
        </div>
      </section>
    </div>
  );
}
