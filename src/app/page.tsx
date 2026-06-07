import LoginButton from '@/components/LoginButton';
import { getCurrentUser } from '@/lib/api/users';
import { redirect } from 'next/navigation';

type CurrentUserResponse = {
  id?: number;
  userSeq?: number;
  name: string;
  role: 'ADMIN' | 'USER';
};

export default async function HomePage() {

  // api/users.ts의 getCurrentUser 함수를 사용하여 현재 로그인한 사용자의 정보를 가져온다.
  // 만약 로그인한 사용자가 없다면 getCurrentUser 함수는 null을 반환 받는다.
  const currentUser = await getCurrentUser() as CurrentUserResponse;

  // 현재 로그인한 사용자의 정보가 있으면 마이페이지로 이동한다.
  if (currentUser) {
    redirect('/calendar');
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="main-title-box mb-15">
        <h1 className="text-3xl font-bold mb-8">청소를 시작해볼까요? 🔥</h1>
      </div>

      <LoginButton />
    </main>
  );
}