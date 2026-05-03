import LoginButton from '@/components/LoginButton';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">청소 관리 시스템</h1>
      <LoginButton />
    </main>
  );
}