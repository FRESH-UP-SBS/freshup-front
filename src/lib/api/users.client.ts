
type CurrentUserResponse = {
    id?: number;
    userSeq?: number;
    name: string;
    role: 'ADMIN' | 'USER';
};

// next/headers import 없음

export async function getCurrentUser() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');
    }
    const res = await fetch(`${apiBaseUrl}/api/users/me`, {
        credentials: 'include', // 쿠키를 브라우저가 자동으로 전송
    });
    return res.json();

    const userData: CurrentUserResponse = await res.json();
    return userData;
}