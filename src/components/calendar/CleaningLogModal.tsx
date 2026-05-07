'use client';

// React에서 사용하는 Hook들을 가져온다.
// useEffect: 컴포넌트가 처음 렌더링되거나 특정 값이 바뀔 때 실행할 코드를 작성할 때 사용
// useRef: 특정 DOM 요소를 직접 참조할 때 사용
// useState: 화면에서 변하는 값을 상태로 관리할 때 사용
import { useEffect, useRef, useState } from 'react';

// 화면에 사용할 아이콘들을 lucide-react 라이브러리에서 가져온다.
import { ChevronDown, Pencil, Trash2, Plus, X, Check } from 'lucide-react';

// 관리자 모드에서 청소 업무를 관리하는 모달 컴포넌트이다.
import CleaningTaskAdminModal from './CleaningTaskAdminModal';

// CSS Module 파일을 가져온다.
// styles['클래스명'] 형태로 CSS 클래스를 적용할 수 있다.
import styles from './calendar.module.css';

// 청소 기록 한 개의 타입이다.
//
// 예:
// {
//   id: 1,
//   taskName: "설거지",
//   memberName: "홍길동"
// }
type CleaningLog = {
  id: number;
  taskName: string;
  memberName: string;
};

// CleaningLogModal 컴포넌트가 부모 컴포넌트로부터 받는 props 타입이다.
type CleaningLogModalProps = {
  // 모달에서 보여줄 날짜이다.
  date: Date;

  // 해당 날짜에 등록된 청소 기록 목록이다.
  logs: CleaningLog[];

  // 모달을 닫을 때 실행할 함수이다.
  onClose: () => void;

  // 추가/수정/삭제 후 부모 캘린더에서 다시 조회하기 위한 함수이다.
  // ?가 붙어 있으므로 없어도 되는 선택 값이다.
  onChanged?: () => void;
};

// 청소 업무 선택 옵션 타입이다.
//
// 예:
// { id: 1, name: "바닥" }
type WorkOption = {
  id: number;
  name: string;
};

// 현재 로그인한 사용자 정보를 받을 때 사용하는 타입이다.
type CurrentUserResponse = {
  // id는 있을 수도 있고 없을 수도 있어서 ?를 붙였다.
  id?: number;

  // 사용자 고유 번호이다.
  userSeq: number;

  // 사용자 이름이다.
  name: string;

  // 사용자 권한이다.
  // ADMIN이면 관리자, USER이면 일반 사용자이다.
  role: 'ADMIN' | 'USER';
};

// 백엔드 API 기본 주소이다.
//
// .env.local에 NEXT_PUBLIC_API_BASE_URL 값이 있으면 그 값을 사용하고,
// 없으면 기본값으로 http://localhost:8080 을 사용한다.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

// 기존 UI 유지용 업무 목록이다.
//
// 주의:
// 이 id 값은 DB의 TB_WORK.WORK_SEQ 값과 반드시 맞아야 한다.
// 예를 들어 DB에서 바닥의 WORK_SEQ가 1이면 여기 id도 1이어야 한다.
const workOptions: WorkOption[] = [
  { id: 1, name: '바닥' },
  { id: 2, name: '빨래' },
  { id: 3, name: '설거지' },
  { id: 4, name: '화장실' },
];

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

// 업무 이름으로 업무 id를 찾는 함수이다.
//
// 예:
// getWorkIdByName("바닥")
// → workOptions에서 name이 "바닥"인 데이터를 찾아 id를 반환한다.
// → 결과: 1
function getWorkIdByName(workName: string) {
  return workOptions.find((work) => work.name === workName)?.id;
}

// 백엔드 요청이 실패했을 때 응답 메시지를 꺼내는 함수이다.
async function getErrorMessage(res: Response) {
  // 응답 body를 문자열로 읽는다.
  const text = await res.text();

  // 응답 body가 비어 있으면 상태코드만 반환한다.
  if (!text) {
    return `상태코드: ${res.status}`;
  }

  // 응답 body에 메시지가 있으면 그 메시지를 반환한다.
  return text;
}

// 청소 기록 모달 컴포넌트이다.
//
// 날짜를 클릭했을 때 열리는 모달이며,
// 청소 기록 조회, 등록, 수정, 삭제 기능을 담당한다.
// 관리자 모드로 전환하면 청소 업무 관리 컴포넌트도 보여준다.
export default function CleaningLogModal({
  date,
  logs,
  onClose,
  onChanged,
}: CleaningLogModalProps) {
  // 현재 모달 화면이 청소 기록 화면인지, 관리자 업무 관리 화면인지 상태로 관리한다.
  //
  // 'log' → 청소 기록 화면
  // 'admin' → 관리자 업무 관리 화면
  const [modalMode, setModalMode] = useState<'log' | 'admin'>('log');

  // 모달 안에서 사용할 청소 기록 목록이다.
  //
  // 부모가 내려준 logs를 바로 수정하지 않고,
  // 모달 내부에서 localLogs로 따로 관리한다.
  const [localLogs, setLocalLogs] = useState<CleaningLog[]>(logs);

  // 현재 로그인한 사용자 정보를 상태로 관리한다.
  // null이면 아직 사용자 정보를 못 가져온 상태이다.
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(
    null
  );

  // 청소 기록 추가 모드인지 여부를 관리한다.
  //
  // true이면 업무 선택 드롭다운과 저장 버튼이 보인다.
  // false이면 추가 입력 영역이 보이지 않는다.
  const [isAddMode, setIsAddMode] = useState(false);

  // 추가할 청소 업무 이름을 상태로 관리한다.
  const [selectedWork, setSelectedWork] = useState('');

  // 추가 모드의 업무 선택 드롭다운이 열려 있는지 관리한다.
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);

  // 현재 수정 중인 청소 기록의 id를 관리한다.
  //
  // null이면 수정 중인 기록이 없다는 뜻이다.
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  // 수정할 업무 이름을 상태로 관리한다.
  const [editTaskName, setEditTaskName] = useState('');

  // 수정 모드의 업무 선택 드롭다운이 열려 있는지 관리한다.
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);

  // 삭제 확인 알림창이 열려 있는지 관리한다.
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // 삭제하려는 청소 기록의 id를 관리한다.
  //
  // null이면 삭제 대상이 없다는 뜻이다.
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // 저장, 수정, 삭제 요청이 진행 중인지 관리한다.
  //
  // true이면 버튼을 비활성화해서 중복 클릭을 막는다.
  const [isSaving, setIsSaving] = useState(false);

  // 추가 모드 드롭다운 영역을 참조하기 위한 ref이다.
  //
  // 드롭다운 바깥쪽을 클릭했는지 확인할 때 사용한다.
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 수정 모드 드롭다운 영역을 참조하기 위한 ref이다.
  //
  // 드롭다운 바깥쪽을 클릭했는지 확인할 때 사용한다.
  const editDropdownRef = useRef<HTMLDivElement>(null);

  // 모달 제목에 표시할 월이다.
  // getMonth()는 0부터 시작하므로 +1을 해준다.
  const month = date.getMonth() + 1;

  // 모달 제목에 표시할 일이다.
  const day = date.getDate();

  // 현재 로그인한 사용자 정보를 백엔드에서 가져오는 함수이다.
  const fetchCurrentUser = async () => {
    try {
      // 현재 로그인한 사용자 정보를 요청한다.
      //
      // credentials: 'include'는
      // 쿠키 기반 로그인 정보를 요청에 포함시키기 위해 사용한다.
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'GET',
        credentials: 'include',
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 읽고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('현재 로그인 사용자 조회 실패:', errorMessage);
        return;
      }

      // 응답 JSON을 CurrentUserResponse 타입으로 변환한다.
      const data: CurrentUserResponse = await res.json();

      // 가져온 사용자 정보를 상태에 저장한다.
      setCurrentUser(data);
    } catch (error) {
      // 사용자 정보 조회 중 오류가 발생하면 콘솔에 출력한다.
      console.error('현재 로그인 사용자 조회 중 오류:', error);
    }
  };

  // 컴포넌트가 처음 화면에 나타날 때 한 번 실행된다.
  //
  // 현재 로그인한 사용자 정보를 가져온다.
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // 부모 컴포넌트에서 내려준 logs 값이 바뀔 때마다 실행된다.
  //
  // 부모의 최신 청소 기록 목록을 모달 내부 상태에도 반영한다.
  useEffect(() => {
    setLocalLogs(logs);
  }, [logs]);

  // 드롭다운 바깥쪽을 클릭하면 드롭다운을 닫기 위한 처리이다.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 클릭한 대상을 Node 타입으로 변환한다.
      const target = e.target as Node;

      // 추가 모드 드롭다운이 존재하고,
      // 클릭한 위치가 추가 모드 드롭다운 내부가 아니면 드롭다운을 닫는다.
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsWorkDropdownOpen(false);
      }

      // 수정 모드 드롭다운이 존재하고,
      // 클릭한 위치가 수정 모드 드롭다운 내부가 아니면 드롭다운을 닫는다.
      if (
        editDropdownRef.current &&
        !editDropdownRef.current.contains(target)
      ) {
        setIsEditDropdownOpen(false);
      }
    };

    // 문서 전체에 마우스 클릭 이벤트를 등록한다.
    document.addEventListener('mousedown', handleClickOutside);

    // 컴포넌트가 사라질 때 이벤트를 제거한다.
    //
    // 이벤트를 제거하지 않으면
    // 컴포넌트가 사라진 뒤에도 이벤트가 남아서 문제가 생길 수 있다.
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 관리자 모드로 전환하는 함수이다.
  const handleChangeAdminMode = () => {
    // 모달 화면을 관리자 모드로 바꾼다.
    setModalMode('admin');

    // 관리자 모드로 갈 때 기존 추가/수정 상태를 초기화한다.
    setIsAddMode(false);
    setIsWorkDropdownOpen(false);
    setEditingLogId(null);
    setEditTaskName('');
    setIsEditDropdownOpen(false);
  };

  // 청소 기록 모드로 전환하는 함수이다.
  const handleChangeLogMode = () => {
    setModalMode('log');
  };

  // 특정 청소 기록의 수정 모드를 시작하는 함수이다.
  const handleStartEdit = (log: CleaningLog) => {
    // 어떤 청소 기록을 수정 중인지 id를 저장한다.
    setEditingLogId(log.id);

    // 기존 업무 이름을 수정 입력값으로 넣는다.
    setEditTaskName(log.taskName);

    // 수정 모드에 들어갈 때 추가 모드는 꺼둔다.
    setIsAddMode(false);
    setSelectedWork('');
    setIsWorkDropdownOpen(false);
    setIsEditDropdownOpen(false);
  };

  // 수정한 청소 기록을 저장하는 함수이다.
  const handleSaveEdit = async () => {
    // 수정 중인 기록이 없거나,
    // 수정할 업무명이 비어 있으면 실행하지 않는다.
    if (editingLogId === null || !editTaskName.trim()) {
      return;
    }

    // 로그인 사용자 정보가 없으면 수정 요청을 보낼 수 없다.
    if (!currentUser) {
      alert('로그인 사용자 정보를 불러오지 못했습니다.');
      return;
    }

    // 선택한 업무 이름에 해당하는 workId를 찾는다.
    const workId = getWorkIdByName(editTaskName);

    // 업무 이름에 맞는 id를 찾지 못하면 요청을 중단한다.
    if (!workId) {
      alert('업무 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      // 저장 중 상태로 바꿔서 버튼 중복 클릭을 막는다.
      setIsSaving(true);

      // 백엔드에 일정 수정 요청을 보낸다.
      //
      // editingLogId는 수정할 일정 id이다.
      const res = await fetch(`${API_BASE_URL}/api/schedules/${editingLogId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          // 요청 body를 JSON 형식으로 보낸다는 의미이다.
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 현재 로그인한 사용자의 번호를 담당자로 보낸다.
          userId: currentUser.userSeq,

          // 선택한 업무의 id를 보낸다.
          workId,

          // 모달 날짜를 yyyy-MM-dd 형식으로 변환해서 보낸다.
          date: formatDate(date),
        }),
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 출력하고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 내역 수정 실패:', errorMessage);
        alert('청소 내역 수정에 실패했습니다.');
        return;
      }

      // 백엔드에서 수정된 청소 기록을 응답으로 받는다.
      const updatedLog: CleaningLog = await res.json();

      // localLogs에서 수정한 기록만 updatedLog로 교체한다.
      setLocalLogs((prev) =>
        prev.map((log) => (log.id === editingLogId ? updatedLog : log))
      );

      // 수정 모드 관련 상태를 초기화한다.
      setEditingLogId(null);
      setEditTaskName('');
      setIsEditDropdownOpen(false);

      // 부모 컴포넌트에게 데이터가 변경되었음을 알린다.
      // 부모에서는 보통 일정 목록을 다시 조회한다.
      onChanged?.();
    } catch (error) {
      // 수정 중 오류가 발생하면 콘솔과 alert로 알려준다.
      console.error('청소 내역 수정 중 오류:', error);
      alert('청소 내역 수정 중 오류가 발생했습니다.');
    } finally {
      // 성공/실패와 상관없이 저장 중 상태를 해제한다.
      setIsSaving(false);
    }
  };

  // 삭제 버튼을 눌렀을 때 실행되는 함수이다.
  const handleDeleteClick = (id: number) => {
    // 삭제할 대상 id를 저장한다.
    setDeleteTargetId(id);

    // 삭제 확인 알림창을 연다.
    setIsAlertOpen(true);
  };

  // 삭제 확인 알림창에서 확인 버튼을 눌렀을 때 실행되는 함수이다.
  const handleConfirmDelete = async () => {
    // 삭제 대상이 없으면 실행하지 않는다.
    if (deleteTargetId === null) {
      return;
    }

    try {
      // 삭제 요청 중 상태로 바꿔서 버튼 중복 클릭을 막는다.
      setIsSaving(true);

      // 백엔드에 일정 삭제 요청을 보낸다.
      const res = await fetch(`${API_BASE_URL}/api/schedules/${deleteTargetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 출력하고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 내역 삭제 실패:', errorMessage);
        alert('청소 내역 삭제에 실패했습니다.');
        return;
      }

      // localLogs에서 삭제한 기록을 제거한다.
      setLocalLogs((prev) => prev.filter((log) => log.id !== deleteTargetId));

      // 삭제 관련 상태를 초기화하고 알림창을 닫는다.
      setDeleteTargetId(null);
      setIsAlertOpen(false);

      // 부모 컴포넌트에게 데이터가 변경되었음을 알린다.
      onChanged?.();
    } catch (error) {
      // 삭제 중 오류가 발생하면 콘솔과 alert로 알려준다.
      console.error('청소 내역 삭제 중 오류:', error);
      alert('청소 내역 삭제 중 오류가 발생했습니다.');
    } finally {
      // 성공/실패와 상관없이 저장 중 상태를 해제한다.
      setIsSaving(false);
    }
  };

  // 삭제 확인 알림창에서 취소 버튼을 눌렀을 때 실행되는 함수이다.
  const handleCancelDelete = () => {
    // 삭제 대상 id를 초기화한다.
    setDeleteTargetId(null);

    // 삭제 확인 알림창을 닫는다.
    setIsAlertOpen(false);
  };

  // 새로운 청소 기록을 등록하는 함수이다.
  const handleCreateLog = async () => {
    // 업무를 선택하지 않았으면 등록하지 않는다.
    if (!selectedWork.trim()) {
      alert('업무를 선택하세요.');
      return;
    }

    // 로그인 사용자 정보가 없으면 등록 요청을 보낼 수 없다.
    if (!currentUser) {
      alert('로그인 사용자 정보를 불러오지 못했습니다.');
      return;
    }

    // 선택한 업무 이름에 해당하는 workId를 찾는다.
    const workId = getWorkIdByName(selectedWork);

    // 업무 이름에 맞는 id를 찾지 못하면 요청을 중단한다.
    if (!workId) {
      alert('업무 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      // 저장 중 상태로 바꿔서 버튼 중복 클릭을 막는다.
      setIsSaving(true);

      // 백엔드에 일정 등록 요청을 보낸다.
      const res = await fetch(`${API_BASE_URL}/api/schedules`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          // 요청 body를 JSON 형식으로 보낸다는 의미이다.
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 현재 로그인한 사용자의 번호를 담당자로 보낸다.
          userId: currentUser.userSeq,

          // 선택한 업무의 id를 보낸다.
          workId,

          // 모달 날짜를 yyyy-MM-dd 형식으로 변환해서 보낸다.
          date: formatDate(date),
        }),
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 출력하고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 내역 등록 실패:', errorMessage);
        alert('청소 내역 등록에 실패했습니다.');
        return;
      }

      // 백엔드에서 새로 등록된 청소 기록을 응답으로 받는다.
      const createdLog: CleaningLog = await res.json();

      // 기존 목록 뒤에 새 청소 기록을 추가한다.
      setLocalLogs((prev) => [...prev, createdLog]);

      // 추가 모드 관련 상태를 초기화한다.
      setSelectedWork('');
      setIsAddMode(false);
      setIsWorkDropdownOpen(false);

      // 부모 컴포넌트에게 데이터가 변경되었음을 알린다.
      onChanged?.();
    } catch (error) {
      // 등록 중 오류가 발생하면 콘솔과 alert로 알려준다.
      console.error('청소 내역 등록 중 오류:', error);
      alert('청소 내역 등록 중 오류가 발생했습니다.');
    } finally {
      // 성공/실패와 상관없이 저장 중 상태를 해제한다.
      setIsSaving(false);
    }
  };

  return (
    // 모달 뒤의 어두운 배경 영역이다.
    // 배경을 클릭하면 모달이 닫힌다.
    <div className={styles['cleaning-modal-backdrop']} onClick={onClose}>
      {/* 실제 모달 영역이다.
          stopPropagation()을 사용해서 모달 내부 클릭은 배경 클릭으로 전달되지 않게 한다.
          즉, 모달 안을 클릭해도 모달이 닫히지 않는다. */}
      <section
        className={styles['cleaning-modal']}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 영역이다. */}
        <header className={styles['cleaning-modal-header']}>
          <h2>
            {/* 현재 모드에 따라 제목을 다르게 보여준다.
                log 모드이면 날짜를 보여주고,
                admin 모드이면 Work라는 제목을 보여준다. */}
            {modalMode === 'log'
              ? `${month}.${String(day).padStart(2, '0')}`
              : 'Work'}
          </h2>

          {/* 상단 오른쪽 버튼 영역이다. */}
          <div className={styles['cleaning-header-actions']}>
            {/* 청소 기록 모드일 때는 Admin Mode 버튼을 보여준다. */}
            {modalMode === 'log' && (
              <button
                type="button"
                className={styles['cleaning-admin-btn']}
                onClick={handleChangeAdminMode}
                disabled={isSaving}
              >
                Admin Mode
              </button>
            )}

            {/* 관리자 모드일 때는 Schedule Mode 버튼을 보여준다. */}
            {modalMode === 'admin' && (
              <button
                type="button"
                className={styles['cleaning-admin-btn']}
                onClick={handleChangeLogMode}
                disabled={isSaving}
              >
                Schedule Mode
              </button>
            )}

            {/* 모달 닫기 버튼이다. */}
            <button
              type="button"
              className={styles['cleaning-close-btn']}
              onClick={onClose}
              disabled={isSaving}
            >
              <X size={22} />
            </button>
          </div>
        </header>

        {/* 모달 본문 영역이다. */}
        <div className={styles['cleaning-modal-body']}>
          {/* 청소 기록 모드일 때 보여줄 화면이다. */}
          {modalMode === 'log' && (
            <>
              {/* 청소 기록 목록 영역이다. */}
              <div className={styles['cleaning-log-list']}>
                {localLogs.length > 0 ? (
                  // 청소 기록이 있으면 목록을 출력한다.
                  localLogs.map((log) => (
                    // 청소 기록 한 줄이다.
                    <div key={log.id} className={styles['cleaning-log-row']}>
                      {editingLogId === log.id ? (
                        // 현재 이 기록이 수정 중이면
                        // 업무 선택 드롭다운을 보여준다.
                        <div
                          className={styles['cleaning-log-edit-wrap']}
                          ref={editDropdownRef}
                        >
                          {/* 수정할 업무를 선택하는 버튼이다. */}
                          <button
                            type="button"
                            className={styles['cleaning-log-edit-button']}
                            onClick={() =>
                              setIsEditDropdownOpen((prev) => !prev)
                            }
                            disabled={isSaving}
                          >
                            <span>{editTaskName || '업무를 선택하세요'}</span>

                            {/* 드롭다운 화살표 아이콘이다.
                                드롭다운이 열려 있으면 open 스타일을 추가한다. */}
                            <ChevronDown
                              size={22}
                              className={`${styles['cleaning-log-edit-icon']} ${
                                isEditDropdownOpen ? styles.open : ''
                              }`}
                            />
                          </button>

                          {/* 수정용 드롭다운이 열려 있을 때만 업무 목록을 보여준다. */}
                          {isEditDropdownOpen && (
                            <ul className={styles['cleaning-log-edit-list']}>
                              {workOptions.map((work) => (
                                <li key={work.id}>
                                  <button
                                    type="button"
                                    className={`${styles['cleaning-log-edit-option']} ${
                                      editTaskName === work.name
                                        ? styles.selected
                                        : ''
                                    }`}
                                    onClick={() => {
                                      // 선택한 업무 이름을 수정 값으로 저장한다.
                                      setEditTaskName(work.name);

                                      // 선택 후 드롭다운을 닫는다.
                                      setIsEditDropdownOpen(false);
                                    }}
                                    disabled={isSaving}
                                  >
                                    {work.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        // 수정 중이 아니면 일반 텍스트로 청소 기록을 보여준다.
                        <p>
                          {log.taskName}({log.memberName})
                        </p>
                      )}

                      {/* 수정/삭제 버튼 영역이다. */}
                      <div className={styles['cleaning-log-actions']}>
                        {editingLogId === log.id ? (
                          // 수정 중인 기록이면 체크 버튼을 보여준다.
                          // 클릭하면 수정 내용을 저장한다.
                          <button
                            type="button"
                            className={styles['cleaning-action-btn']}
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                          >
                            <Check size={18} />
                          </button>
                        ) : (
                          // 수정 중이 아니면 연필 버튼을 보여준다.
                          // 클릭하면 해당 기록이 수정 모드로 바뀐다.
                          <button
                            type="button"
                            className={styles['cleaning-action-btn']}
                            onClick={() => handleStartEdit(log)}
                            disabled={isSaving}
                          >
                            <Pencil size={18} />
                          </button>
                        )}

                        {/* 삭제 버튼이다.
                            클릭하면 바로 삭제하지 않고 삭제 확인 알림창을 연다. */}
                        <button
                          type="button"
                          className={`${styles['cleaning-action-btn']} ${styles.danger}`}
                          onClick={() => handleDeleteClick(log.id)}
                          disabled={isSaving}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // 청소 기록이 없을 때 보여주는 문구이다.
                  <p className={styles['cleaning-empty']}>
                    등록된 청소 기록이 없습니다.
                  </p>
                )}
              </div>

              {/* 추가 모드일 때만 업무 선택 영역을 보여준다. */}
              {isAddMode && (
                <div
                  className={styles['cleaning-dropdown-row']}
                  ref={dropdownRef}
                >
                  {/* 업무 선택 드롭다운 영역이다. */}
                  <div className={styles['cleaning-dropdown-wrap']}>
                    <button
                      type="button"
                      className={styles['cleaning-dropdown-button']}
                      onClick={() => setIsWorkDropdownOpen((prev) => !prev)}
                      disabled={isSaving}
                    >
                      {/* selectedWork가 없으면 placeholder 스타일을 적용한다. */}
                      <span className={!selectedWork ? styles.placeholder : ''}>
                        {selectedWork || '업무를 선택하세요'}
                      </span>

                      {/* 드롭다운 화살표 아이콘이다.
                          드롭다운이 열려 있으면 open 스타일을 추가한다. */}
                      <ChevronDown
                        size={22}
                        className={`${styles['cleaning-dropdown-icon']} ${
                          isWorkDropdownOpen ? styles.open : ''
                        }`}
                      />
                    </button>

                    {/* 추가용 드롭다운이 열려 있을 때만 업무 목록을 보여준다. */}
                    {isWorkDropdownOpen && (
                      <ul className={styles['cleaning-dropdown-list']}>
                        {workOptions.map((work) => (
                          <li key={work.id}>
                            <button
                              type="button"
                              className={`${styles['cleaning-dropdown-option']} ${
                                selectedWork === work.name ? styles.selected : ''
                              }`}
                              onClick={() => {
                                // 선택한 업무 이름을 저장한다.
                                setSelectedWork(work.name);

                                // 선택 후 드롭다운을 닫는다.
                                setIsWorkDropdownOpen(false);
                              }}
                              disabled={isSaving}
                            >
                              {work.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 청소 기록 등록 저장 버튼이다. */}
                  <button
                    type="button"
                    className={styles['cleaning-log-save-btn']}
                    onClick={handleCreateLog}
                    disabled={isSaving}
                  >
                    <Check size={22} />
                  </button>
                </div>
              )}

              {/* 오른쪽 하단의 플러스 버튼이다.
                  추가 모드나 수정 모드일 때는 닫기 모드 스타일이 적용된다. */}
              <button
                type="button"
                className={`${styles['cleaning-modal-icon-btn']} ${
                  isAddMode || editingLogId !== null
                    ? styles['close-mode']
                    : ''
                }`}
                onClick={() => {
                  // 저장 중이면 아무 동작도 하지 않는다.
                  if (isSaving) {
                    return;
                  }

                  // 이미 추가 모드이거나 수정 모드라면
                  // 버튼 클릭 시 추가/수정 상태를 취소한다.
                  if (isAddMode || editingLogId !== null) {
                    setIsAddMode(false);
                    setEditingLogId(null);
                    setEditTaskName('');
                    setSelectedWork('');
                    setIsWorkDropdownOpen(false);
                    setIsEditDropdownOpen(false);
                    return;
                  }

                  // 아무 모드도 아니면 추가 모드로 전환한다.
                  setIsAddMode(true);
                }}
                disabled={isSaving}
              >
                <Plus size={28} />
              </button>
            </>
          )}

          {/* 관리자 모드일 때 청소 업무 관리 모달 내용을 보여준다. */}
          {modalMode === 'admin' && <CleaningTaskAdminModal />}
        </div>

        {/* 삭제 확인 알림창이다.
            isAlertOpen이 true일 때만 화면에 보인다. */}
        {isAlertOpen && (
          <div className={styles['custom-alert-backdrop']}>
            <div className={styles['custom-alert']}>
              <p>해당 업무를 삭제하시겠습니까?</p>

              {/* 삭제 확인 알림창의 버튼 영역이다. */}
              <div className={styles['custom-alert-actions']}>
                {/* 삭제 취소 버튼이다. */}
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={handleCancelDelete}
                  disabled={isSaving}
                >
                  취소
                </button>

                {/* 삭제 확인 버튼이다. */}
                <button
                  type="button"
                  className={styles.confirm}
                  onClick={handleConfirmDelete}
                  disabled={isSaving}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}