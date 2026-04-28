import LoginButton from '@/components/LoginButton';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="main-title-box mb-15">
        <h1 className="text-3xl font-bold mb-8">청소를 시작해볼까요? 🔥</h1>
      </div>

      <LoginButton />
    </main>
  );
}