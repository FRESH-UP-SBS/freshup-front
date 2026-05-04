import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // 인증이 필요한 페이지 접근 시 
  if (pathname.startsWith('/calendar') || pathname.startsWith('/myPage')) {
    console.log('Middleware: Checking authentication for ', pathname);

    // 1. accessToken이 없다면?
    if (!accessToken) {
      
      // 2. refreshToken마저 없다면 로그인 페이지로
      if (!refreshToken) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // 3. refreshToken이 있다면 백엔드에 재발급 요청 (Silent Refresh)
      try {
        const response = await fetch('http://localhost:8080/api/auth/reissue', {
          method: 'POST',
          headers: {
            // 미들웨어에서 서버로 요청 보낼 때 쿠키를 수동으로 전달해야 할 수도 있습니다.
            Cookie: `refreshToken=${refreshToken}`
          },
        });

        if (response.ok) {
          // 재발급 성공: 서버가 새 accessToken 쿠키를 줬으므로 다음 단계로 진행
          const nextResponse = NextResponse.next();
          
          // 백엔드 응답에서 온 새로운 쿠키를 미들웨어 응답에도 복사해준다.
          const setCookie = response.headers.get('set-cookie');
          if (setCookie) {
            nextResponse.headers.set('set-cookie', setCookie);
          }
          return nextResponse;
        } else {
          // 재발급 실패 (리프레시 토큰 만료 등)
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } 
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/calendar/:path*'],
};