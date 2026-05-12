import { LoginHero } from '@/components/auth/login-hero';
import { LoginCard } from '@/components/auth/login-card';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen">
      <LoginHero />
      <LoginCard error={searchParams.error} />
    </main>
  );
}
