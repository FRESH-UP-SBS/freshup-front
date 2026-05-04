'use client';
import Image from 'next/image';
import { useEffect } from 'react';

export default function LoginButton() {
    useEffect(() => {
        // 페이지가 로드될 때 사용자 인증 상태를 확인하는 API 호출 -> 그럼 로그인이 되어 있는지 확인 가능
        fetch('http://localhost:8080/api/me', {
            credentials: 'include', // 요청을 보낼 때 쿠키를 포함하도록 설정
        })
            .then(res => {
                if (res.ok) {
                    window.location.href = '/calendar';
                }
            });
    }, []);
    const handleLogin = () => {
        window.location.href = process.env.NEXT_PUBLIC_KAKAO_LOGIN_URL!;
    };

    return (
        <div>
            <button className="flex w-90 justify-center cursor-pointer" onClick={handleLogin}>
                <Image src="/images/kakao_login_large_wide.png" alt="Kakao Icon" width={300} height={0} style={{ height: 'auto', width: '90%' }} className="mr-2" />
            </button>
        </div>

    );
}