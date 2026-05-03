'use client';

import Image from 'next/image';
import { de } from 'react-day-picker/locale';

export default function LoginButton() {
    const handleLogin = () => {
        console.log('Redirecting to Kakao login URL:', process.env.NEXT_PUBLIC_KAKAO_LOGIN_URL);
        window.location.href = process.env.NEXT_PUBLIC_KAKAO_LOGIN_URL!;

    };

    return (
        <div>
            <button className="flex w-90 justify-center cursor-pointer" onClick={handleLogin}>
                <Image src="/images/kakao_login_large_wide.png" alt="Kakao Icon" width={300} height={0} style={{ height: 'auto', width: '90%' }} className="mr-2" />
            </button>
        </div>


        // <button
        //     onClick={handleLogin}
        //     className="bg-400 text-black px-6 py-3 rounded-lg"
        // >

        // </button>
    );
}