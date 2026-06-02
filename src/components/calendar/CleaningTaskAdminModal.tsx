'use client';

// React에서 사용하는 Hook들을 가져온다.
// useEffect: 컴포넌트가 처음 렌더링되거나 특정 값이 바뀔 때 실행할 코드를 작성할 때 사용
// useRef: 특정 DOM 요소를 직접 참조할 때 사용
// useState: 화면에서 변하는 값을 상태로 관리할 때 사용
import { useEffect, useRef, useState } from 'react';

// 화면에서 사용할 아이콘들을 lucide-react 라이브러리에서 가져온다.
import { Pencil, Trash2, Check, Plus } from 'lucide-react';

// CSS Module 파일을 가져온다.
// styles['클래스명'] 형태로 CSS 클래스를 적용할 수 있다.
import styles from './calendar.module.css';

// 관리자 모드에서 사용하는 청소 업무 한 개의 타입이다.
//
// 예:
// {
//   id: 1,
//   taskName: "화장실",
//   memberName: "홍길동, 김철수",
//   memberIds: [1, 2]
// }
type AdminTask = {
  id: number;
  taskName: string;
  memberName: string;
  memberIds: number[];
};

// 백엔드에서 청소 업무 목록을 조회했을 때 받는 응답 타입이다.
//
// WorkResponseDto와 맞춰서 사용하는 타입이다.
type WorkResponse = {
  id: number;
  workName: string;

  // 담당자 id 목록이다.
  // ?가 붙어 있으므로 응답에 없을 수도 있다.
  memberIds?: number[];

  // 담당자 이름 목록이다.
  // ?가 붙어 있으므로 응답에 없을 수도 있다.
  memberNames?: string[];
};

// 담당자 선택 목록에 사용할 회원 정보 타입이다.
//
// 예:
// {
//   id: 1,
//   name: "홍길동"
// }
type MemberOption = {
  id: number;
  name: string;
};

// 백엔드 API 기본 주소이다.
//
// .env.local에 NEXT_PUBLIC_API_BASE_URL 값이 있으면 그 값을 사용하고,
// 없으면 기본값으로 http://localhost:8080 을 사용한다.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

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

// 백엔드에서 받은 WorkResponse 데이터를
// 화면에서 사용할 AdminTask 형태로 변환하는 함수이다.
function mapWorkToAdminTask(work: WorkResponse): AdminTask {
  // memberIds가 없으면 빈 배열로 처리한다.
  //
  // ??는 왼쪽 값이 null 또는 undefined일 때
  // 오른쪽 값을 대신 사용한다.
  const memberIds = work.memberIds ?? [];

  // memberNames가 없으면 빈 배열로 처리한다.
  const memberNames = work.memberNames ?? [];

  return {
    // 청소 업무 고유 번호이다.
    id: work.id,

    // 화면에서 사용할 업무 이름이다.
    taskName: work.workName,

    // 담당자 이름 배열을 ", "로 이어붙여서 문자열로 만든다.
    //
    // 예:
    // ["홍길동", "김철수"] → "홍길동, 김철수"
    memberName: memberNames.join(', '),

    // 담당자 id 목록이다.
    memberIds,
  };
}

// 청소 업무 관리자 모달 컴포넌트이다.
//
// 관리자 모드에서 청소 업무를 조회, 추가, 수정, 삭제하고
// 각 업무의 담당자를 선택할 수 있게 해준다.
export default function CleaningTaskAdminModal() {
  // 화면에 표시할 청소 업무 목록 상태이다.
  const [tasks, setTasks] = useState<AdminTask[]>([]);

  // 담당자로 선택할 수 있는 회원 목록 상태이다.
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);

  // 추가 또는 수정할 청소 업무명을 저장하는 상태이다.
  const [taskName, setTaskName] = useState('');

  // 선택된 담당자 id 목록을 저장하는 상태이다.
  //
  // 여러 명을 선택할 수 있으므로 배열로 관리한다.
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // 담당자 선택 드롭다운이 열려 있는지 관리하는 상태이다.
  const [isMemberOpen, setIsMemberOpen] = useState(false);

  // 청소 업무 추가 입력창을 보여줄지 관리하는 상태이다.
  const [isAddMode, setIsAddMode] = useState(false);

  // 현재 수정 중인 청소 업무 id를 저장하는 상태이다.
  //
  // null이면 수정 중인 업무가 없다는 뜻이다.
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // 삭제 확인 알림창이 열려 있는지 관리하는 상태이다.
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // 삭제하려는 청소 업무 id를 저장하는 상태이다.
  //
  // null이면 삭제 대상이 없다는 뜻이다.
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // 청소 업무 목록을 불러오는 중인지 관리하는 상태이다.
  const [isLoading, setIsLoading] = useState(false);

  // 추가, 수정, 삭제 요청이 진행 중인지 관리하는 상태이다.
  //
  // true이면 버튼을 비활성화해서 중복 클릭을 막는다.
  const [isSaving, setIsSaving] = useState(false);

  // 담당자 선택 드롭다운 영역을 참조하기 위한 ref이다.
  //
  // 드롭다운 바깥쪽을 클릭했는지 확인할 때 사용한다.
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 회원 목록을 백엔드에서 가져오는 함수이다.
  const fetchMembers = async () => {
    try {
      // 회원 목록 API를 호출한다.
      //
      // credentials: 'include'는
      // 쿠키 기반 로그인 정보를 요청에 포함시키기 위해 사용한다.
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'GET',
        credentials: 'include',
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 읽고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('회원 목록 조회 실패:', errorMessage);
        return;
      }

      // 응답 JSON을 MemberOption 배열로 변환한다.
      const data: MemberOption[] = await res.json();

      // 회원 목록을 상태에 저장한다.
      setMemberOptions(data);
    } catch (error) {
      // 회원 목록 조회 중 오류가 발생하면 콘솔에 출력한다.
      console.error('회원 목록 조회 중 오류:', error);
    }
  };

  // 청소 업무 목록을 백엔드에서 가져오는 함수이다.
  const fetchWorks = async () => {
    try {
      // 로딩 상태를 true로 바꾼다.
      setIsLoading(true);

      // 청소 업무 목록 API를 호출한다.
      const res = await fetch(`${API_BASE_URL}/api/works`, {
        method: 'GET',
        credentials: 'include',
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 읽고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 업무 조회 실패:', errorMessage);
        alert('청소 업무 조회에 실패했습니다.');
        return;
      }

      // 응답 JSON을 WorkResponse 배열로 변환한다.
      const data: WorkResponse[] = await res.json();

      // 백엔드 응답 데이터를 화면에서 쓰기 좋은 AdminTask 형태로 변환한다.
      const mappedTasks: AdminTask[] = data.map(mapWorkToAdminTask);

      // 변환된 청소 업무 목록을 상태에 저장한다.
      setTasks(mappedTasks);
    } catch (error) {
      // 청소 업무 조회 중 오류가 발생하면 콘솔과 alert로 알려준다.
      console.error('청소 업무 조회 중 오류:', error);
      alert('청소 업무 조회 중 오류가 발생했습니다.');
    } finally {
      // 성공/실패와 상관없이 로딩 상태를 해제한다.
      setIsLoading(false);
    }
  };

  // 컴포넌트가 처음 화면에 나타날 때 한 번 실행된다.
  //
  // 담당자 선택에 사용할 회원 목록과
  // 현재 등록된 청소 업무 목록을 가져온다.
  useEffect(() => {
    fetchMembers();
    fetchWorks();
  }, []);

  // 담당자 드롭다운 바깥쪽을 클릭하면 드롭다운을 닫기 위한 처리이다.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 드롭다운 영역이 존재하고,
      // 클릭한 위치가 드롭다운 내부가 아니면 드롭다운을 닫는다.
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsMemberOpen(false);
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

  // 입력 폼과 모드 상태를 초기화하는 함수이다.
  const resetForm = () => {
    // 업무명 입력값을 비운다.
    setTaskName('');

    // 선택된 담당자 목록을 비운다.
    setSelectedMemberIds([]);

    // 담당자 드롭다운을 닫는다.
    setIsMemberOpen(false);

    // 추가 모드를 종료한다.
    setIsAddMode(false);

    // 수정 중인 업무 id를 초기화한다.
    setEditingTaskId(null);
  };

  // 담당자를 선택하거나 선택 해제하는 함수이다.
  const toggleMember = (memberId: number) => {
    setSelectedMemberIds((prev) =>
      // 이미 선택된 담당자라면 목록에서 제거한다.
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)

        // 아직 선택되지 않은 담당자라면 목록에 추가한다.
        : [...prev, memberId]
    );
  };

  // 현재 선택된 담당자 이름들을 화면에 표시할 문자열로 만드는 함수이다.
  const getSelectedMemberText = () => {
    const names = selectedMemberIds
      // 선택된 memberId를 기준으로 memberOptions에서 이름을 찾는다.
      .map((id) => memberOptions.find((member) => member.id === id)?.name)

      // 이름이 없는 값은 제외한다.
      //
      // name is string은 TypeScript에게
      // 이 filter 이후에는 name이 string이라고 알려주는 역할을 한다.
      .filter((name): name is string => Boolean(name));

    // 선택된 이름이 있으면 ", "로 이어붙여서 보여주고,
    // 없으면 "담당자 선택" 문구를 보여준다.
    return names.length > 0 ? names.join(', ') : '담당자 선택';
  };

  // 새로운 청소 업무를 추가하는 함수이다.
  const handleAddTask = async () => {
    // 업무명이 비어 있으면 추가하지 않는다.
    if (!taskName.trim()) {
      alert('업무명을 입력하세요.');
      return;
    }

    // 담당자를 한 명도 선택하지 않았으면 추가하지 않는다.
    if (selectedMemberIds.length === 0) {
      alert('담당자를 선택하세요.');
      return;
    }

    try {
      // 저장 중 상태로 바꿔서 버튼 중복 클릭을 막는다.
      setIsSaving(true);

      // 백엔드에 청소 업무 추가 요청을 보낸다.
      const res = await fetch(`${API_BASE_URL}/api/works`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          // 요청 body를 JSON 형식으로 보낸다는 의미이다.
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 앞뒤 공백을 제거한 업무명을 보낸다.
          workName: taskName.trim(),

          // 선택된 담당자 id 목록을 보낸다.
          memberIds: selectedMemberIds,
        }),
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 출력하고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 업무 추가 실패:', errorMessage);
        alert('청소 업무 추가에 실패했습니다.');
        return;
      }

      // 추가 후 최신 청소 업무 목록을 다시 조회한다.
      await fetchWorks();

      // 입력 폼을 초기화한다.
      resetForm();
    } catch (error) {
      // 추가 중 오류가 발생하면 콘솔과 alert로 알려준다.
      console.error('청소 업무 추가 중 오류:', error);
      alert('청소 업무 추가 중 오류가 발생했습니다.');
    } finally {
      // 성공/실패와 상관없이 저장 중 상태를 해제한다.
      setIsSaving(false);
    }
  };

  // 특정 청소 업무의 수정 모드를 시작하는 함수이다.
  const handleStartEdit = (task: AdminTask) => {
    // 수정 중인 업무 id를 저장한다.
    setEditingTaskId(task.id);

    // 수정 입력 영역을 보여주기 위해 추가 모드를 켠다.
    setIsAddMode(true);

    // 기존 업무명을 입력값에 넣는다.
    setTaskName(task.taskName);

    // 기존 담당자 목록을 선택된 담당자로 넣는다.
    setSelectedMemberIds(task.memberIds);

    // 담당자 드롭다운은 닫아둔다.
    setIsMemberOpen(false);
  };

  // 기존 청소 업무를 수정하는 함수이다.
  const handleUpdateTask = async () => {
    // 수정 중인 업무가 없으면 실행하지 않는다.
    if (editingTaskId === null) return;

    // 업무명이 비어 있으면 수정하지 않는다.
    if (!taskName.trim()) {
      alert('업무명을 입력하세요.');
      return;
    }

    // 담당자를 한 명도 선택하지 않았으면 수정하지 않는다.
    if (selectedMemberIds.length === 0) {
      alert('담당자를 선택하세요.');
      return;
    }

    try {
      // 저장 중 상태로 바꿔서 버튼 중복 클릭을 막는다.
      setIsSaving(true);

      // 백엔드에 청소 업무 수정 요청을 보낸다.
      const res = await fetch(`${API_BASE_URL}/api/works/${editingTaskId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          // 요청 body를 JSON 형식으로 보낸다는 의미이다.
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 앞뒤 공백을 제거한 업무명을 보낸다.
          workName: taskName.trim(),

          // 선택된 담당자 id 목록을 보낸다.
          memberIds: selectedMemberIds,
        }),
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 출력하고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 업무 수정 실패:', errorMessage);
        alert('청소 업무 수정에 실패했습니다.');
        return;
      }

      // 수정 후 최신 청소 업무 목록을 다시 조회한다.
      await fetchWorks();

      // 입력 폼을 초기화한다.
      resetForm();
    } catch (error) {
      // 수정 중 오류가 발생하면 콘솔과 alert로 알려준다.
      console.error('청소 업무 수정 중 오류:', error);
      alert('청소 업무 수정 중 오류가 발생했습니다.');
    } finally {
      // 성공/실패와 상관없이 저장 중 상태를 해제한다.
      setIsSaving(false);
    }
  };

  // 저장 버튼을 눌렀을 때 실행되는 함수이다.
  //
  // 현재 수정 중이면 수정 함수를 실행하고,
  // 수정 중이 아니면 추가 함수를 실행한다.
  const handleSubmit = () => {
    if (editingTaskId !== null) {
      handleUpdateTask();
      return;
    }

    handleAddTask();
  };

  // 삭제 버튼을 눌렀을 때 실행되는 함수이다.
  const handleDeleteClick = (id: number) => {
    // 삭제할 업무 id를 저장한다.
    setDeleteTargetId(id);

    // 삭제 확인 알림창을 연다.
    setIsAlertOpen(true);
  };

  // 삭제 확인 알림창에서 확인 버튼을 눌렀을 때 실행되는 함수이다.
  const handleConfirmDelete = async () => {
    // 삭제 대상이 없으면 실행하지 않는다.
    if (deleteTargetId === null) return;

    try {
      // 삭제 요청 중 상태로 바꿔서 버튼 중복 클릭을 막는다.
      setIsSaving(true);

      // 백엔드에 청소 업무 삭제 요청을 보낸다.
      const res = await fetch(`${API_BASE_URL}/api/works/${deleteTargetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      // 응답이 정상 범위가 아니면 에러 메시지를 출력하고 종료한다.
      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 업무 삭제 실패:', errorMessage);
        alert('청소 업무 삭제에 실패했습니다.');
        return;
      }

      // 삭제 후 최신 청소 업무 목록을 다시 조회한다.
      await fetchWorks();

      // 삭제 관련 상태를 초기화하고 알림창을 닫는다.
      setDeleteTargetId(null);
      setIsAlertOpen(false);
    } catch (error) {
      // 삭제 중 오류가 발생하면 콘솔과 alert로 알려준다.
      console.error('청소 업무 삭제 중 오류:', error);
      alert('청소 업무 삭제 중 오류가 발생했습니다.');
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

  return (
    <>
      {/* 현재 등록된 청소 업무 목록 영역이다. */}
      <div className={styles['cleaning-admin-current-list']}>
        {isLoading ? (
          // 청소 업무 목록을 불러오는 중일 때 보여주는 문구이다.
          <p className={styles['cleaning-empty']}>
            청소 업무를 불러오는 중입니다.
          </p>
        ) : tasks.length > 0 ? (
          // 청소 업무가 있으면 목록을 출력한다.
          tasks.map((task) => (
            // 청소 업무 한 줄이다.
            <div key={task.id} className={styles['cleaning-admin-current-row']}>
              {editingTaskId === task.id ? (
                // 현재 이 업무가 수정 중이면 입력 폼을 보여준다.
                <div className={styles['cleaning-admin-edit-inline']}>
                  {/* 업무명 입력 영역이다. */}
                  <div className={styles['cleaning-admin-input-row']}>
                    <input
                      type="text"
                      className={styles['cleaning-admin-input']}
                      placeholder="업무 입력"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>

                  {/* 담당자 선택 드롭다운 영역이다. */}
                  <div
                    className={styles['cleaning-admin-select-wrap']}
                    ref={dropdownRef}
                  >
                    <button
                      type="button"
                      className={styles['cleaning-admin-select-btn']}
                      onClick={() => setIsMemberOpen((prev) => !prev)}
                      disabled={isSaving}
                    >
                      {getSelectedMemberText()}
                    </button>

                    {/* 담당자 드롭다운이 열려 있을 때만 목록을 보여준다. */}
                    {isMemberOpen && (
                      <ul className={styles['cleaning-admin-dropdown']}>
                        {memberOptions.map((member) => (
                          <li key={member.id}>
                            <button
                              type="button"
                              className={`${styles['cleaning-admin-option']} ${
                                selectedMemberIds.includes(member.id)
                                  ? styles.selected
                                  : ''
                              }`}
                              onClick={() => toggleMember(member.id)}
                              disabled={isSaving}
                            >
                              {member.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                // 수정 중이 아니면 업무명과 담당자 이름을 텍스트로 보여준다.
                <p>
                  {task.memberName
                    ? `${task.taskName}(${task.memberName})`
                    : task.taskName}
                </p>
              )}

              {/* 수정/삭제 버튼 영역이다. */}
              <div className={styles['cleaning-log-actions']}>
                {editingTaskId === task.id ? (
                  // 수정 중인 업무이면 체크 버튼을 보여준다.
                  // 클릭하면 수정 내용을 저장한다.
                  <button
                    type="button"
                    className={styles['cleaning-action-btn']}
                    onClick={handleSubmit}
                    disabled={isSaving}
                  >
                    <Check size={18} />
                  </button>
                ) : (
                  // 수정 중이 아니면 연필 버튼을 보여준다.
                  // 클릭하면 해당 업무가 수정 모드로 바뀐다.
                  <button
                    type="button"
                    className={styles['cleaning-action-btn']}
                    onClick={() => handleStartEdit(task)}
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
                  onClick={() => handleDeleteClick(task.id)}
                  disabled={isSaving}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          // 등록된 청소 업무가 없을 때 보여주는 문구이다.
          <p className={styles['cleaning-empty']}>
            등록된 청소 업무가 없습니다.
          </p>
        )}
      </div>

      {/* 추가 모드이고, 수정 중이 아닐 때만 새 업무 입력 폼을 보여준다. */}
      {isAddMode && editingTaskId === null && (
        <div className={styles['cleaning-admin-input-group']}>
          {/* 업무명 입력과 저장 버튼 영역이다. */}
          <div className={styles['cleaning-admin-input-row']}>
            <input
              type="text"
              className={styles['cleaning-admin-input']}
              placeholder="업무 입력"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              disabled={isSaving}
            />

            {/* 새 업무 저장 버튼이다. */}
            <button
              type="button"
              className={styles['cleaning-admin-save-btn']}
              onClick={handleSubmit}
              disabled={isSaving}
            >
              <Check size={22} />
            </button>
          </div>

          {/* 담당자 선택 드롭다운 영역이다. */}
          <div
            className={styles['cleaning-admin-select-wrap']}
            ref={dropdownRef}
          >
            <button
              type="button"
              className={styles['cleaning-admin-select-btn']}
              onClick={() => setIsMemberOpen((prev) => !prev)}
              disabled={isSaving}
            >
              {getSelectedMemberText()}
            </button>

            {/* 담당자 드롭다운이 열려 있을 때만 목록을 보여준다. */}
            {isMemberOpen && (
              <ul className={styles['cleaning-admin-dropdown']}>
                {memberOptions.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      className={`${styles['cleaning-admin-option']} ${
                        selectedMemberIds.includes(member.id)
                          ? styles.selected
                          : ''
                      }`}
                      onClick={() => toggleMember(member.id)}
                      disabled={isSaving}
                    >
                      {member.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 오른쪽 하단의 플러스 버튼이다.
          추가 모드일 때는 close-mode 스타일이 적용된다. */}
      <button
        type="button"
        className={`${styles['cleaning-modal-icon-btn']} ${
          isAddMode ? styles['close-mode'] : ''
        }`}
        onClick={() => {
          // 저장 중이면 아무 동작도 하지 않는다.
          if (isSaving) return;

          // 이미 추가 모드이면 버튼 클릭 시 입력 폼을 닫고 초기화한다.
          if (isAddMode) {
            resetForm();
            return;
          }

          // 추가 모드가 아니면 새 업무 추가 모드로 전환한다.
          setIsAddMode(true);

          // 수정 중인 업무 id는 초기화한다.
          setEditingTaskId(null);
        }}
        disabled={isSaving}
      >
        <Plus size={28} />
      </button>

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
    </>
  );
}