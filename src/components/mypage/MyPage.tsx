'use client';

// React에서 사용하는 Hook을 가져온다.
// useEffect: 컴포넌트가 처음 렌더링될 때 또는 특정 값이 바뀔 때 실행할 코드를 작성할 때 사용
// useState: 화면에서 변하는 값을 상태로 관리할 때 사용
import { useEffect, useState } from 'react';

// 하단 네비게이션 컴포넌트이다.
import BottomNav from '@/components/ui/BottomNav';

// 마이페이지 화면에 적용할 CSS Module 파일이다.
// styles.container, styles.card 같은 방식으로 CSS 클래스를 사용할 수 있다.
import styles from './MyPage.module.css';

// 백엔드에서 마이페이지 통계 정보를 조회했을 때 받는 응답 타입이다.
//
// 백엔드의 MyPageStatsResponseDto와 맞춰서 사용하는 타입이다.
type MyPageStatsResponse = {
  // 사용자 고유 번호이다.
  userSeq: number;

  // 사용자 이름이다.
  name: string;

  // 사용자 권한이다.
  // ADMIN이면 관리자, USER이면 일반 사용자이다.
  role: 'ADMIN' | 'USER';

  // 이번 주 청소 횟수이다.
  weeklyCleanCount: number;

  // 이번 주 남은 청소 횟수이다.
  remainingCleanCount: number;

  // 전체 벌금 금액이다.
  totalPenaltyAmount: number;

  // 아직 정산되지 않은 벌금 금액이다.
  unpaidPenaltyAmount: number;
};

// 백엔드 API 기본 주소이다.
//
// .env.local에 NEXT_PUBLIC_API_BASE_URL 값이 있으면 그 값을 사용하고,
// 없으면 기본값으로 http://localhost:8080 을 사용한다.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

// 마이페이지 컴포넌트이다.
export default function MyPage() {
  // 마이페이지 통계 정보를 상태로 관리한다.
  //
  // 처음에는 아직 데이터를 가져오기 전이므로 null이다.
  const [stats, setStats] = useState<MyPageStatsResponse | null>(null);

  // 마이페이지 정보를 불러오는 중인지 관리하는 상태이다.
  //
  // true이면 로딩 문구를 보여준다.
  // false이면 조회 결과를 보여준다.
  const [isLoading, setIsLoading] = useState(true);

  // 현재 로그인한 사용자의 마이페이지 통계 정보를 가져오는 함수이다.
  const fetchMyStats = async () => {
    try {
      // 요청을 시작하기 전에 로딩 상태로 바꾼다.
      setIsLoading(true);

      // 백엔드에 내 마이페이지 통계 정보를 요청한다.
      //
      // credentials: 'include'는
      // 쿠키 기반 로그인 정보를 요청에 포함시키기 위해 사용한다.
      const res = await fetch(`${API_BASE_URL}/api/user-stats/me`, {
        credentials: 'include',
      });

      // 응답 상태 코드가 401이면 인증되지 않은 상태라는 뜻이다.
      //
      // 즉, 로그인이 안 되어 있거나 로그인 정보가 만료된 상태이다.
      if (res.status === 401) {
        // 카카오 로그인 주소로 이동시킨다.
        window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
        return;
      }

      // 401은 아니지만 정상 응답이 아니면 에러를 발생시킨다.
      //
      // res.ok는 상태 코드가 200번대일 때 true이다.
      if (!res.ok) {
        throw new Error('마이페이지 정보 조회 실패');
      }

      // 백엔드에서 받은 JSON 데이터를 MyPageStatsResponse 타입으로 변환한다.
      const data: MyPageStatsResponse = await res.json();

      // 조회한 마이페이지 통계 정보를 상태에 저장한다.
      setStats(data);
    } catch (error) {
      // 요청 중 오류가 발생하면 콘솔에 출력한다.
      console.error('마이페이지 정보 조회 실패:', error);

      // 조회 실패 상태를 나타내기 위해 stats를 null로 설정한다.
      setStats(null);
    } finally {
      // 성공하든 실패하든 로딩 상태를 해제한다.
      setIsLoading(false);
    }
  };

  // 컴포넌트가 처음 화면에 나타날 때 한 번 실행된다.
  //
  // 마이페이지 통계 정보를 백엔드에서 가져온다.
  useEffect(() => {
    fetchMyStats();
  }, []);

  // 화면에 표시할 사용자 이름이다.
  //
  // stats가 아직 없으면 빈 문자열을 사용한다.
  const displayName = stats?.name ?? '';

  // 화면에 표시할 사용자 권한이다.
  //
  // stats가 아직 없으면 빈 문자열을 사용한다.
  const displayRole = stats?.role ?? '';

  // 프로필 원 안에 표시할 글자이다.
  //
  // 이름이 있으면 이름의 첫 글자를 보여주고,
  // 이름이 없으면 ?를 보여준다.
  const avatarText = displayName ? displayName.charAt(0) : '?';

  return (
    // 마이페이지 전체 영역이다.
    <main className={styles.container}>
      {/* 실제 콘텐츠를 감싸는 영역이다. */}
      <section className={styles.content}>
        {/* 페이지 제목이다. */}
        <h1 className={styles.title}>My Page</h1>

        {/* 사용자 정보와 통계 정보를 보여주는 카드 영역이다. */}
        <section className={styles.card}>
          {isLoading ? (
            // 데이터를 불러오는 중이면 로딩 문구를 보여준다.
            <p>마이페이지 정보를 불러오는 중입니다.</p>
          ) : stats ? (
            // 로딩이 끝났고 stats 데이터가 있으면 마이페이지 정보를 보여준다.
            <>
              {/* 프로필 영역이다. */}
              <div className={styles.profile}>
                {/* 사용자 이름의 첫 글자를 보여주는 프로필 원이다. */}
                <div className={styles.avatar}>{avatarText}</div>

                <div>
                  {/* 사용자 이름을 표시한다. */}
                  <p className={styles.name}>{displayName}</p>

                  {/* 사용자 권한을 표시한다.
                      예: ADMIN, USER */}
                  <p className={styles.role}>{displayRole}</p>
                </div>
              </div>

              {/* 통계 정보 목록 영역이다. */}
              <div className={styles.infoList}>
                {/* 이번 주 남은 청소 횟수 표시 영역이다. */}
                <div className={styles.infoItem}>
                  <span>금주 남은 청소 횟수</span>
                  <strong>{stats.remainingCleanCount}회</strong>
                </div>

                {/* 전체 벌금 금액 표시 영역이다. */}
                <div className={styles.infoItem}>
                  <span>총 벌금</span>
                  <strong>
                    {/* toLocaleString()은 숫자에 콤마를 넣어준다.
                        예: 10000 → 10,000 */}
                    {stats.totalPenaltyAmount.toLocaleString()}원
                  </strong>
                </div>

                {/* 미정산 벌금 금액 표시 영역이다. */}
                <div className={styles.infoItem}>
                  <span>미정산 벌금</span>

                  {/* warning 스타일을 적용해서 미정산 금액을 강조한다. */}
                  <strong className={styles.warning}>
                    {stats.unpaidPenaltyAmount.toLocaleString()}원
                  </strong>
                </div>
              </div>
            </>
          ) : (
            // 로딩은 끝났지만 stats가 없으면 실패 문구를 보여준다.
            <p>마이페이지 정보를 불러오지 못했습니다.</p>
          )}
        </section>
      </section>

      {/* 하단 네비게이션이다.
          active="mypage"는 현재 선택된 메뉴가 마이페이지라는 의미이다. */}
      <BottomNav active="mypage" />
    </main>
  );
}