import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return <LoginForm error={searchParams.error} />;
}
