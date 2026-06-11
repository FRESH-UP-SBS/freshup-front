'use client';
import styles from '@/components/calendar/calendar.module.css';
import BottomNav from '@/components/ui/BottomNav';
import { getCurrentUser } from '@/lib/api/users.client';
import { useQuery } from '@tanstack/react-query';
import { filterAndSortList } from 'next/dist/build/utils';
import { useEffect, useState } from 'react';
import { Button, Radio, RadioGroup, CheckPicker, SelectPicker, DateRangePicker } from 'rsuite';
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";



type PageResponse<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
};


type PenaltyResponse = {
    id: number;
    userId: number;
    name: string;
    amount: number;
    adjustmentYn: 'Y' | 'N';
    status: string;
};

type CurrentUserResponse = {
    id?: number;
    userSeq?: number;
    name: string;
    role: 'ADMIN' | 'USER';
};

// 벌금 현황 페이지에서 사용할 담당자 옵션 타입
type MemberOption = {
    value: number;
    label: string;
};

// 벌금 현황 페이지에서 사용할 필터 상태 타입 
type FilterState = {
    assignees: number[];       // 담당자 (다중 선택)
    paymentStatus: string;     // 수납 여부
    dateRange: [Date, Date] | null;  // 날짜 범위
    size?: number;           // 페이지당 항목 수
    page?: number;           // 현재 페이지 번호
};
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function PenaltyListPage() {
    // null이면 사용자 정보를 아직 못 가져왔거나 조회 실패한 상태이다.
    const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(
        null
    );
    // role이 ADMIN이면 true, 아니면 false이다.
    const isAdmin = currentUser?.role === 'ADMIN';
    // 현재 로그인한 사용자 정보를 백엔드에서 가져오는 함수이다.

    const fetchCurrentUser = async () => {
        const currentUser = await getCurrentUser() as CurrentUserResponse;
        setCurrentUser(currentUser);
    };

    // 벌금 현황 목록을 상태로 관리한다.
    const [penalties, setPenalties] = useState<PenaltyResponse[]>([]);

    // 페이지네이션을 위한 상태
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(0);


    // 필터 상태를 관리하는 useState 훅
    const [filters, setFilters] = useState<FilterState>({
        assignees: [],
        paymentStatus: 'ALL',
        dateRange: new Date() === null ? null : [new Date(new Date().setDate(new Date().getDate() - 60)), new Date()], // 초기값을 한달 전 ~ 오늘 날짜로 설정
        size: 10,
        page: 0,
    });


    // 벌금 현황 목록을 백엔드에서 가져오는 함수이다.
    const fetchPenalties = async (filters: FilterState, page: number = 0) => {

        try {
            // 쿼리 파라미터를 생성 start !! 
            const params = new URLSearchParams();
            if (filters.assignees.length > 0) {
                filters.assignees.forEach(id => params.append('assignees', String(id)));
            }
            if (filters.paymentStatus !== 'ALL') {
                params.append('paymentStatus', filters.paymentStatus);
            }
            if (filters.dateRange) {
                params.append('startDate', filters.dateRange[0].toISOString().split('T')[0]);
                params.append('endDate', filters.dateRange[1].toISOString().split('T')[0]);
            }
            // 페이지네이션을 위한 쿼리 파라미터 추가
            params.append('page', String(page));
            params.append('size', '10'); // 페이지당 10개 항목
            // 쿼리 파라미터를 생성 end !!

            // 벌금 목록 API를 호출한다.
            const res = await fetch(`${API_BASE_URL}/api/penalties?${params.toString()}`, {
                credentials: 'include',// 브라우저가 쿠키(Cookie), 세션 정보, 인증 정보를 함께 보내도록 하는 옵션
            });

            // 응답이 정상 범위가 아니면 에러를 발생시킨다.
            if (!res.ok) {
                throw new Error('벌금 현황 조회 실패');
            }

            // 응답 JSON을 PenaltyResponse 배열로 변환한다.
            // const data: PenaltyResponse[] = await res.json();
            const data: PageResponse<PenaltyResponse> = await res.json();

            // 벌금 목록을 상태에 저장한다.
            setPenalties(data.content);

            // 페이지네이션 상태 업데이트
            setTotalPages(data.totalPages);
            setCurrentPage(data.number);

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

    // 필터 초기화 버튼을 눌렀을 때 실행되는 함수이다.
    const handleReset = () => {
        setFilters({
            assignees: [],
            paymentStatus: 'ALL',
            dateRange: new Date() === null ? null : [new Date(new Date().setDate(new Date().getDate() - 60)), new Date()], // 초기값을 한달 전 ~ 오늘 날짜로 설정
            size: 10,
            page: 0,
        });
    };


    const [assignees, setAssignees] = useState<MemberOption[]>([]);

    const fetchAssignees = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users`, {
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error('사용자 목록 조회 실패');
            }

            const data: { id: number; name: string }[] = await res.json();
            const options = data.map((user) => ({ value: user.id, label: user.name }));
            setAssignees(options);
        }
        catch (err) {
            console.error('사용자 목록 조회 실패:', err);
        }
    }


    useEffect(() => {
        fetchCurrentUser();
        fetchPenalties(filters, 0);
        fetchAssignees();
    }, []);


    useEffect(() => {
        fetchPenalties(filters, 0);
    }, [filters]); // filters가 바뀔 때마다 자동 검색


    return (
        <main className={styles['calendar-page']}>
            {/* 달력과 벌금 영역을 감싸는 카드 영역이다. */}
            <section className={styles['calendar-card']}>
                <section className={styles['penalty-section']}>
                    {/* 벌금 영역 상단 제목 부분이다. */}
                    <div className={styles['penalty-header']}>
                        <h2>Penalty</h2>

                    </div>
                    <div className='flex justify-between mb-10'>
                        <div className='flex flex-col gap-4 justify-start ' >
                            <div className='flex gap-4 justify-start' >
                                <CheckPicker className='color-navy'
                                    value={filters.assignees}
                                    data={assignees} searchable={false}
                                    placeholder="담당자"
                                    onChange={(value) => setFilters((prev) => ({ ...prev, assignees: value }))}
                                />
                                <SelectPicker className='color-navy'
                                    value={filters.paymentStatus}
                                    defaultValue='ALL'
                                    data={[{ value: "ALL", label: "전체" },
                                    { value: "Y", label: "수납" },
                                    { value: "N", label: "미수납" }]}
                                    searchable={false} placeholder="수납 여부"
                                    onChange={(value) => setFilters((prev) => ({ ...prev, paymentStatus: value ?? 'ALL' }))}
                                />
                            </div>

                            <DateRangePicker
                                value={filters.dateRange}
                                defaultCalendarValue={[new Date(), new Date()]}
                                onChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
                                placeholder="날짜 범위"
                                format="yyyy-MM-dd"
                                // 너비를 auto로 설정하여 내용에 맞게 조절한다.
                                w={230}
                                size="md"
                            />

                        </div>



                        <div className='justify-end' >
                            <Button onClick={handleReset} >초기화</Button>
                        </div>
                    </div>


                    {/* 벌금 목록 영역이다. */}
                    <div className={styles['penalty-list']}>
                        {penalties.length > 0 ? (
                            // 벌금 데이터가 있으면 목록을 출력한다.
                            penalties.map((penalty) => (
                                // 벌금 한 줄이다.
                                <label key={penalty.id} className={`${styles['penalty-row']}`}>
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
                                        >
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

                                    <span className={styles['penalty-amount']}>
                                        {penalty.amount.toLocaleString()}원
                                    </span>

                                    <span className={""}>
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
                    {/* 페이지네이션 */}
                    <div className='flex justify-center gap-2 mt-4'>
                        <button
                            onClick={() => fetchPenalties(filters, currentPage - 1)}
                            disabled={currentPage === 0}
                        >
                            <FiChevronLeft />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                className='w-100'
                                key={i}
                                onClick={() => fetchPenalties(filters, i)}
                                style={{
                                    fontWeight: currentPage === i ? 'bold' : 'normal',
                                    backgroundColor: currentPage === i ? '#1B3A6B' : 'transparent',
                                    color: currentPage === i ? '#fff' : '#000',
                                    borderRadius: '4px',
                                    width: '28px',
                                    height: '28px',
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => fetchPenalties(filters, currentPage + 1)}
                            disabled={currentPage === totalPages - 1}
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </section>

                {/* 하단 네비게이션이다.
                active="calendar"는 현재 선택된 메뉴가 calendar라는 의미이다. */}
                <BottomNav active="calendar" />
            </section>
        </main >
    );
}