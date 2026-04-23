'use client';

export default function LoginButton() {
    const handleLogin = () => {
        window.location.href = process.env.NEXT_PUBLIC_KAKAO_LOGIN_URL!;
    };

    return (
        <button
            onClick={handleLogin}
            className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition"
        >
            카카오로 로그인dd
        </button>
    );
}