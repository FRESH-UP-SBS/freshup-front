import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 쿠키에서 accessToken 확인 (서버 측에서는 HttpOnly 쿠키도 읽을 수 있음)
    const token = request.cookies.get('accessToken')?.value;

  // 2. 메인 페이지(/)에 접속했는데 토큰이 있다면 /calendar로 리다이렉트
    if (request.nextUrl.pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/calendar', request.url));
        }
    }

    return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
    matcher: ['/'],
};