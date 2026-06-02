'use client';

// React에서 제공하는 Hook을 가져온다.
// useEffect: 컴포넌트가 처음 렌더링되거나 특정 값이 바뀔 때 실행할 코드를 작성할 때 사용
// useState: 화면에서 변하는 값을 상태로 관리할 때 사용
import { useEffect, useState } from 'react';

// 달력 UI를 만들어주는 react-day-picker 라이브러리의 컴포넌트이다.
import { DayPicker } from 'react-day-picker';

// 달력 화면에 적용할 CSS Module 파일을 가져온다.
// CSS Module을 사용하면 클래스명이 다른 파일과 충돌하는 것을 줄일 수 있다.
import styles from '@/components/calendar/calendar.module.css';

// 날짜를 클릭했을 때 뜨는 청소 기록 모달 컴포넌트이다.
import CleaningLogModal from '../../components/calendar/CleaningLogModal';

// Next.js에서 페이지 이동을 할 때 사용하는 Hook이다.
// 현재 코드에서는 router를 선언만 하고 실제로 사용하지는 않는다.
import { useRouter } from 'next/navigation';

// 하단 네비게이션 컴포넌트이다.
import BottomNav from '../../components/ui/BottomNav';

// 청소 업무 한 개의 타입을 정의한다.
//
// 예:
// {
//   id: 1,
//   taskName: "화장실 청소",
//   memberName: "홍길동"
// }
type CleaningTask = {
  id: number;
  taskName: string;
  memberName: string;
};

// 특정 날짜에 들어있는 청소 업무 목록 타입이다.
//
// 예:
// {
//   date: "2026-05-07",
//   tasks: [
//     { id: 1, taskName: "설거지", memberName: "홍길동" }
//   ]
// }
type CleaningEvent = {
  date: string;
  tasks: CleaningTask[];
};

// 백엔드에서 일정 목록을 조회했을 때 받는 응답 타입이다.
//
// 백엔드 ScheduleResponseDto와 맞춰서 사용하는 타입이다.
type ScheduleResponse = {
  id: number;
  date: string;
  taskName: string;
  memberName: string;
};

// 백엔드에서 벌금 목록을 조회했을 때 받는 응답 타입이다.
//
// adjustmentYn은 정산 여부를 의미한다.
// 'Y' → 정산 완료
// 'N' → 정산 필요
type PenaltyResponse = {
  id: number;
  userId: number;
  name: string;
  amount: number;
  adjustmentYn: 'Y' | 'N';
  status: string;
};

// 현재 로그인한 사용자 정보를 받을 때 사용하는 타입이다.
//
// id와 userSeq는 둘 중 어떤 이름으로 내려와도 받을 수 있게
// optional(?)로 선언되어 있다.
type CurrentUserResponse = {
  id?: number;
  userSeq?: number;
  name: string;
  role: 'ADMIN' | 'USER';
};

// 백엔드 API 기본 주소이다.
//
// .env.local에 NEXT_PUBLIC_API_BASE_URL 값이 있으면 그 값을 사용하고,
// 없으면 기본값으로 http://localhost:8080 을 사용한다.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

// Date 객체를 "yyyy-MM-dd" 형식의 문자열로 바꿔주는 함수이다.
//
// 예:
// 2026년 5월 7일 → "2026-05-07"
function formatDate(date: Date) {
  const yyyy = date.getFullYear();

  // getMonth()는 0부터 시작한다.
  // 1월은 0, 2월은 1, 5월은 4이므로 +1을 해준다.
  //
  // padStart(2, '0')은 한 자리 숫자 앞에 0을 붙여준다.
  // 예: 5 → "05"
  const mm = String(date.getMonth() + 1).padStart(2, '0');

  // 날짜도 두 자리로 맞춘다.
  // 예: 7 → "07"
  const dd = String(date.getDate()).padStart(2, '0');

  // 최종적으로 "yyyy-MM-dd" 형태로 반환한다.
  return `${yyyy}-${mm}-${dd}`;
}

// 정산일까지 며칠 남았는지 D-DAY 문구를 계산하는 함수이다.
//
// 현재 로직 기준:
// 일요일이면 D-DAY
// 월요일이면 D-6
// 화요일이면 D-5
// 수요일이면 D-4
// 목요일이면 D-3
// 금요일이면 D-2
// 토요일이면 D-1
function getSettlementDday() {
  const today = new Date();

  // getDay()는 요일을 숫자로 반환한다.
  // 일요일: 0
  // 월요일: 1
  // 화요일: 2
  // ...
  // 토요일: 6
  const day = today.getDay();

  // 오늘이 일요일이면 남은 날짜를 0으로 본다.
  // 일요일이 아니면 다음 일요일까지 남은 날짜를 계산한다.
  const remainDays = day === 0 ? 0 : 7 - day;

  // 남은 날짜가 0이면 D-DAY,
  // 아니면 D-숫자 형태로 반환한다.
  return remainDays === 0 ? 'D-DAY' : `D-${remainDays}`;
}

// 캘린더 페이지 컴포넌트이다.
// 이 컴포넌트가 /calendar 같은 페이지 화면을 구성한다.
export default function CalendarPage() {
  // 페이지 이동에 사용할 수 있는 router 객체이다.
  // 현재 코드에서는 선언만 되어 있고 실제 사용되지는 않는다.
  const router = useRouter();

  // 현재 달력에서 보고 있는 월을 상태로 관리한다.
  // 기본값은 오늘 날짜가 포함된 월이다.
  const [month, setMonth] = useState(new Date());

  // 사용자가 클릭한 날짜를 상태로 관리한다.
  // 날짜를 클릭하면 모달을 띄우기 위해 사용한다.
  // null이면 선택된 날짜가 없다는 뜻이다.
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 달력에 표시할 청소 일정 목록을 상태로 관리한다.
  const [cleaningEvents, setCleaningEvents] = useState<CleaningEvent[]>([]);

  // 벌금 현황 목록을 상태로 관리한다.
  const [penalties, setPenalties] = useState<PenaltyResponse[]>([]);

  // 현재 로그인한 사용자 정보를 상태로 관리한다.
  // null이면 사용자 정보를 아직 못 가져왔거나 조회 실패한 상태이다.
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(
    null
  );

  // 정산 D-DAY 문구를 계산한다.
  const settlementDday = getSettlementDday();

  // 현재 로그인한 사용자가 관리자인지 확인한다.
  //
  // currentUser가 null일 수도 있으므로 ?. 를 사용한다.
  // role이 ADMIN이면 true, 아니면 false이다.
  const isAdmin = currentUser?.role === 'ADMIN';

  // 현재 로그인한 사용자 정보를 백엔드에서 가져오는 함수이다.
  const fetchCurrentUser = async () => {
    try {
      // 현재 로그인한 사용자 정보를 요청한다.
      //
      // credentials: 'include'는
      // 쿠키 기반 로그인 정보를 요청에 포함시키기 위해 사용한다.
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        credentials: 'include',
      });

      // 응답이 정상 범위가 아니면 에러를 발생시킨다.
      if (!res.ok) {
        throw new Error('현재 사용자 조회 실패');
      }

      // 응답 JSON을 CurrentUserResponse 타입으로 변환한다.
      const data: CurrentUserResponse = await res.json();

      // 가져온 사용자 정보를 상태에 저장한다.
      setCurrentUser(data);
    } catch (err) {
      // 사용자 정보 조회에 실패하면 콘솔에 에러를 출력한다.
      console.error('현재 사용자 조회 실패:', err);

      // 사용자 정보를 null로 설정한다.
      setCurrentUser(null);
    }
  };

  // 현재 보고 있는 월의 청소 일정을 백엔드에서 가져오는 함수이다.
  const fetchSchedules = async () => {
    try {
      // 현재 달력에서 보고 있는 연도를 구한다.
      const year = month.getFullYear();

      // 현재 달력에서 보고 있는 월을 구한다.
      // getMonth()는 0부터 시작하므로 +1을 해준다.
      const currentMonth = month.getMonth() + 1;

      // 백엔드에 해당 연도, 월의 일정 목록을 요청한다.
      const res = await fetch(
        `${API_BASE_URL}/api/schedules?year=${year}&month=${currentMonth}`,
        {
          credentials: 'include',
        }
      );

      // 응답이 정상 범위가 아니면 에러를 발생시킨다.
      if (!res.ok) {
        throw new Error('청소 일정 조회 실패');
      }

      // 백엔드 응답을 ScheduleResponse 배열로 변환한다.
      const data: ScheduleResponse[] = await res.json();

      // 날짜별로 청소 업무를 묶기 위한 객체이다.
      //
      // 예:
      // grouped["2026-05-07"] = [
      //   { id: 1, taskName: "설거지", memberName: "홍길동" }
      // ]
      const grouped: Record<string, CleaningTask[]> = {};

      // 백엔드에서 받은 일정 데이터를 하나씩 확인한다.
      data.forEach((item) => {
        // 해당 날짜에 대한 배열이 아직 없으면 새로 만든다.
        if (!grouped[item.date]) {
          grouped[item.date] = [];
        }

        // 해당 날짜 배열에 청소 업무 정보를 추가한다.
        grouped[item.date].push({
          id: item.id,
          taskName: item.taskName,
          memberName: item.memberName,
        });
      });

      // grouped 객체를 화면에서 사용하기 좋은 배열 형태로 바꾼다.
      //
      // 예:
      // {
      //   "2026-05-07": [...]
      // }
      //
      // 위 형태를 아래 형태로 변경한다.
      //
      // [
      //   { date: "2026-05-07", tasks: [...] }
      // ]
      const events: CleaningEvent[] = Object.keys(grouped).map((date) => ({
        date,
        tasks: grouped[date],
      }));

      // 변환한 일정 목록을 상태에 저장한다.
      setCleaningEvents(events);
    } catch (err) {
      // 일정 조회 실패 시 콘솔에 에러를 출력한다.
      console.error('청소 일정 불러오는 데 실패하였습니다.:', err);
    }
  };

  // 벌금 현황 목록을 백엔드에서 가져오는 함수이다.
  const fetchPenalties = async () => {
    try {
      // 벌금 목록 API를 호출한다.
      const res = await fetch(`${API_BASE_URL}/api/penalties`, {
        credentials: 'include',
      });

      // 응답이 정상 범위가 아니면 에러를 발생시킨다.
      if (!res.ok) {
        throw new Error('벌금 현황 조회 실패');
      }

      // 응답 JSON을 PenaltyResponse 배열로 변환한다.
      const data: PenaltyResponse[] = await res.json();

      // 벌금 목록을 상태에 저장한다.
      setPenalties(data);
    } catch (err) {
      // 벌금 조회 실패 시 콘솔에 에러를 출력한다.
      console.error('벌금 현황 불러오는 데 실패하였습니다.:', err);
    }
  };

  // 관리자가 벌금 정산 여부 체크박스를 눌렀을 때 실행되는 함수이다.
  const handleTogglePenalty = async (penaltyId: number) => {
    // 클릭한 벌금 id와 일치하는 벌금 데이터를 찾는다.
    const targetPenalty = penalties.find((penalty) => penalty.id === penaltyId);

    // 해당 벌금 데이터가 없으면 함수 실행을 중단한다.
    if (!targetPenalty) return;

    // 현재 정산 완료 상태면 N으로 바꾸고,
    // 현재 정산 필요 상태면 Y로 바꾼다.
    const nextAdjustmentYn = targetPenalty.adjustmentYn === 'Y' ? 'N' : 'Y';

    try {
      // 백엔드에 벌금 정산 여부 수정을 요청한다.
      const res = await fetch(`${API_BASE_URL}/api/penalties/${penaltyId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          // 요청 body를 JSON 형식으로 보낸다는 의미이다.
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adjustmentYn: nextAdjustmentYn,
        }),
      });

      // 응답이 정상 범위가 아니면 에러를 발생시킨다.
      if (!res.ok) {
        throw new Error('벌금 정산 여부 수정 실패');
      }

      // 백엔드에서 수정된 벌금 정보를 응답으로 받는다.
      const updatedPenalty: PenaltyResponse = await res.json();

      // 기존 벌금 목록에서 수정된 벌금만 updatedPenalty로 교체한다.
      setPenalties((prev) =>
        prev.map((penalty) =>
          penalty.id === penaltyId ? updatedPenalty : penalty
        )
      );
    } catch (error) {
      // 수정 실패 시 콘솔에 에러를 출력한다.
      console.error('벌금 정산 여부 수정 실패:', error);

      // 사용자에게 실패 안내창을 보여준다.
      alert('벌금 정산 여부 수정에 실패했습니다.');
    }
  };

  // month 값이 바뀔 때마다 실행된다.
  //
  // 즉, 달력에서 이전 달/다음 달로 이동하면
  // 해당 월의 일정을 다시 조회한다.
  useEffect(() => {
    fetchSchedules();
  }, [month]);

  // 컴포넌트가 처음 화면에 나타날 때 한 번 실행된다.
  //
  // 현재 사용자 정보와 벌금 현황을 가져온다.
  useEffect(() => {
    fetchCurrentUser();
    fetchPenalties();
  }, []);

  // 특정 날짜에 해당하는 청소 업무 목록을 가져오는 함수이다.
  const getTasks = (date: Date): CleaningTask[] => {
    return (
      // cleaningEvents에서 날짜가 같은 데이터를 찾고,
      // 있으면 그 날짜의 tasks를 반환한다.
      cleaningEvents.find((event) => event.date === formatDate(date))?.tasks ??

      // 해당 날짜에 일정이 없으면 빈 배열을 반환한다.
      []
    );
  };

  return (
    // 전체 캘린더 페이지 영역이다.
    <main className={styles['calendar-page']}>
      {/* 달력과 벌금 영역을 감싸는 카드 영역이다. */}
      <section className={styles['calendar-card']}>
        {/* 상단 제목과 D-DAY 박스를 감싸는 영역이다. */}
        <div className={styles['calendar-title-row']}>
          {/* 캘린더 제목 영역이다. */}
          <div className={styles['calendar-title-box']}>
            <p>FRESHUP</p>
            <h1>Cleaning Calendar</h1>
          </div>

          {/* 정산일까지 남은 D-DAY를 보여주는 영역이다. */}
          <div className={styles['settlement-dday-box']}>
            <strong>{settlementDday}</strong>
          </div>
        </div>

        {/* 달력 컴포넌트이다. */}
        <DayPicker
          // 현재 보여줄 달력 월이다.
          month={month}

          // 달력 월이 바뀌면 month 상태를 변경한다.
          // 예: 이전/다음 버튼 클릭 시 실행된다.
          onMonthChange={setMonth}

          // 현재 달 앞뒤의 날짜도 함께 보여준다.
          showOutsideDays

          // 한 주의 시작 요일을 월요일로 설정한다.
          weekStartsOn={1}

          // 달력 전체에 적용할 클래스명이다.
          className={styles['fresh-calendar']}

          // react-day-picker 내부 요소별 클래스명을 CSS Module로 연결한다.
          classNames={{
            root: styles['fresh-calendar-root'],
            months: styles['fresh-months'],
            month: styles['fresh-month'],
            month_caption: styles['fresh-caption'],
            caption_label: styles['fresh-caption-label'],
            nav: styles['fresh-nav'],
            button_previous: styles['fresh-nav-button'],
            button_next: styles['fresh-nav-button'],
            month_grid: styles['fresh-grid'],
            weekdays: styles['fresh-weekdays'],
            weekday: styles['fresh-weekday'],
            weeks: styles['fresh-weeks'],
            week: styles['fresh-week'],
            outside: styles['fresh-outside'],
          }}

          // 달력 상단 월 표시와 요일 표시 방식을 커스텀한다.
          formatters={{
            // 달력 제목을 "2026.05" 같은 형태로 표시한다.
            formatCaption: (date) =>
              `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`,

            // 요일 이름을 한글로 표시한다.
            formatWeekdayName: (date) =>
              ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
          }}

          // DayPicker 내부 컴포넌트를 직접 커스텀한다.
          components={{
            // 날짜 칸을 직접 그리는 부분이다.
            Day: ({ day, ...props }) => {
              // 현재 날짜 칸에 해당하는 청소 업무 목록을 가져온다.
              const tasks = getTasks(day.date);

              // 현재 날짜가 이번 달이 아닌 앞뒤 달 날짜인지 확인한다.
              const isOutside =
                day.date.getFullYear() !== month.getFullYear() ||
                day.date.getMonth() !== month.getMonth();

              // 현재 날짜가 오늘인지 확인한다.
              const isToday = formatDate(day.date) === formatDate(new Date());

              return (
                // 달력의 날짜 한 칸이다.
                <td
                  {...props}
                  className={`${styles['fresh-day']} ${isOutside ? styles['fresh-outside-day'] : ''
                    }`}
                >
                  {/* 날짜 칸 안의 버튼이다.
                      클릭하면 selectedDate에 해당 날짜가 저장되고 모달이 열린다. */}
                  <button
                    type="button"
                    className={styles['fresh-day-button']}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    {/* 날짜 숫자를 표시하는 영역이다. */}
                    <span
                      className={styles['fresh-day-number']}
                      style={
                        // 오늘 날짜이면 검은 원 배경 스타일을 적용한다.
                        isToday
                          ? {
                            backgroundColor: '#000',
                            color: '#fff',
                            borderRadius: '50%',
                            fontWeight: 600,
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '7px',
                          }
                          : undefined
                      }
                    >
                      {/* 날짜를 두 자리 숫자로 표시한다.
                          예: 7 → 07 */}
                      {String(day.date.getDate()).padStart(2, '0')}
                    </span>

                    {/* 해당 날짜의 청소 업무 목록을 표시하는 영역이다. */}
                    <span className={styles['fresh-task-list']}>
                      {tasks.map((task) => (
                        // 청소 업무 한 줄 표시이다.
                        // 예: 설거지(홍길동)
                        <span key={task.id} className={styles['fresh-task']}>
                          {task.taskName}({task.memberName})
                        </span>
                      ))}
                    </span>
                  </button>
                </td>
              );
            },

            // 달력 이전/다음 버튼 아이콘을 커스텀한다.
            Chevron: ({ orientation }) =>
              orientation === 'left' ? (
                // 이전 달 버튼 아이콘
                <span className={styles['nav-icon']}>‹</span>
              ) : (
                // 다음 달 버튼 아이콘
                <span className={styles['nav-icon']}>›</span>
              ),
          }}
        />

        {/* selectedDate가 있을 때만 모달을 보여준다.
            즉, 날짜를 클릭했을 때만 CleaningLogModal이 열린다. */}
        {selectedDate && (
          <CleaningLogModal
            // 선택한 날짜를 모달에 전달한다.
            date={selectedDate}

            // 선택한 날짜의 청소 업무 목록을 모달에 전달한다.
            logs={getTasks(selectedDate)}

            // 모달을 닫을 때 selectedDate를 null로 바꾼다.
            onClose={() => setSelectedDate(null)}

            // 모달 안에서 일정이 추가/수정/삭제되면
            // 다시 일정 목록을 불러오기 위해 fetchSchedules를 전달한다.
            onChanged={fetchSchedules}
          />
        )}

        {/* 벌금 현황 영역이다. */}
        <section className={styles['penalty-section']}>
          {/* 벌금 영역 상단 제목 부분이다. */}
          <div className={styles['penalty-header']}>
            <h2>Penalty</h2>

            {/* 더보기 버튼처럼 보이는 버튼이다.
                현재 코드에서는 클릭 기능은 따로 없다. */}
            <button type="button" className={styles['penalty-more-btn']}>
              ›
            </button>
          </div>

          {/* 벌금 목록 영역이다. */}
          <div className={styles['penalty-list']}>
            {penalties.length > 0 ? (
              // 벌금 데이터가 있으면 목록을 출력한다.
              penalties.map((penalty) => (
                // 벌금 한 줄이다.
                <label key={penalty.id} className={styles['penalty-row']}>
                  {isAdmin ? (
                    // 관리자인 경우 체크박스를 보여준다.
                    //
                    // 체크 상태:
                    // adjustmentYn이 'Y'이면 체크됨
                    // adjustmentYn이 'N'이면 체크 안 됨
                    <input
                      type="checkbox"
                      className={styles['penalty-checkbox']}
                      checked={penalty.adjustmentYn === 'Y'}
                      onChange={() => handleTogglePenalty(penalty.id)}
                    />
                  ) : (
                    // 일반 사용자인 경우 실제 input checkbox가 아니라
                    // 토글처럼 보이는 span을 보여준다.
                    //
                    // aria-hidden="true"는
                    // 화면 표시용 장식 요소라는 의미이다.
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#000',
                      }}
                    />
                      {/* 토글 안의 동그란 버튼처럼 보이는 부분이다. */}
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor:
                        penalty.adjustmentYn === 'Y' ? '#fff' : '#999',

                      // 정산 완료 Y이면 오른쪽으로 이동하고,
                      // 정산 필요 N이면 왼쪽에 둔다.
                      transform:
                        penalty.adjustmentYn === 'Y'
                          ? 'translateX(16px)'
                          : 'translateX(0)',

                      // 토글 위치가 바뀔 때 부드럽게 움직이도록 한다.
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </span>
              )}

            {/* 벌금 대상 사용자 이름을 표시한다. */}
            <span className={styles['penalty-name']}>{penalty.name}</span>

            {/* 벌금 금액을 표시한다.
                      toLocaleString()은 숫자에 콤마를 넣어준다.
                      예: 10000 → 10,000 */}
            <span className={styles['penalty-amount']}>
              {penalty.amount.toLocaleString()}원
            </span>

            {/* 벌금 정산 상태 문구를 표시한다.
                      예: 정산완료, 정산필요 */}
            <span className={styles['penalty-status']}>
              {penalty.status}
            </span>
          </label>
          ))
          ) : (
          // 벌금 데이터가 없으면 안내 문구를 보여준다.
          <p className={styles['cleaning-empty']}>
            등록된 벌금 현황이 없습니다.
          </p>
            )}
        </div>
      </section>
    </section>

      {/* 하단 네비게이션이다.
          active="calendar"는 현재 선택된 메뉴가 calendar라는 의미이다. */}
  <BottomNav active="calendar" />
    </main >
  );
}