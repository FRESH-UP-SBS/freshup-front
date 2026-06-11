import { cookies } from 'next/headers';

type CurrentUserResponse = {
    id?: number;
    userSeq?: number;
    name: string;
    role: 'ADMIN' | 'USER';
};

export async function getCurrentUser() {

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');
    }

    const cookieStore = await cookies();
    
    // 만약 쿠키에 accessToken이 없다면 null을 반환한다.
    if (!cookieStore.get('accessToken')) {
        return null;
    }

    const res = await fetch(
        `${apiBaseUrl}/api/users/me`,
        {
            headers: {
                Cookie: cookieStore.getAll()
                                    .map((c) => `${c.name}=${c.value}`)
                                    .join('; '),
            },
        }
    );

    const userData: CurrentUserResponse = await res.json();
    return userData;
}