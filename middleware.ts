import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 1. Supabase Client를 미들웨어 옵션과 함께 생성
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 2. 현재 로그인한 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 인증이 필요 없는 공개 라우트
  const publicRoutes = ['/login', '/signup', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  // 비로그인 상태이면서 공개된 페이지가 아니라면 -> /login 으로 리다이렉트
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 3. 로그인 상태일 경우 커플 연결 상태 확인
  if (user) {
    // 쿠키에 연결 정보가 있으면 DB 조회 생략 (성능 최적화)
    const isConnectedCookie = request.cookies.get('couple_connected')?.value === 'true'
    
    if (isConnectedCookie) {
      if (['/login', '/signup', '/connect', '/'].includes(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // 본인이 속한 커플 데이터 조회
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .limit(1)
      .single()

    const isConnected = !!couple

    if (!isConnected) {
      if (pathname !== '/connect' && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
        const url = request.nextUrl.clone()
        url.pathname = '/connect'
        return NextResponse.redirect(url)
      }
    } else {
      // 연결 확인됨 -> 쿠키 설정 후 홈으로
      supabaseResponse.cookies.set('couple_connected', 'true', { maxAge: 60 * 60 * 24 * 30 }) // 30일
      if (['/login', '/signup', '/connect', '/'].includes(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

// 미들웨어를 실행할 경로 지정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
