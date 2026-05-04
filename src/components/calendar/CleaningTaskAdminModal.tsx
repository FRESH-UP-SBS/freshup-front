'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, Check, Plus } from 'lucide-react';
import styles from './calendar.module.css';

type AdminTask = {
  id: number;
  taskName: string;
  memberName: string;
  memberIds: number[];
};

type WorkResponse = {
  id: number;
  workName: string;
  memberNames?: string[];
};

type MemberOption = {
  id: number;
  name: string;
};

// 현재 DB의 TB_USER 기준
const memberOptions: MemberOption[] = [
  { id: 1, name: '이세빈' },
  { id: 2, name: '이해슬' },
  { id: 3, name: '이다슬' },
  { id: 5, name: '한현수' },
  { id: 93, name: '이보슬' },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

async function getErrorMessage(res: Response) {
  const text = await res.text();

  if (!text) {
    return `상태코드: ${res.status}`;
  }

  return text;
}

function getMemberIdsByNames(memberNames: string[] = []) {
  return memberNames
    .map((name) => memberOptions.find((member) => member.name === name)?.id)
    .filter((id): id is number => id !== undefined);
}

function getMemberNamesByIds(memberIds: number[]) {
  return memberIds
    .map((id) => memberOptions.find((member) => member.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

function mapWorkToAdminTask(work: WorkResponse): AdminTask {
  const memberNames = work.memberNames ?? [];

  return {
    id: work.id,
    taskName: work.workName,
    memberName: memberNames.join(', '),
    memberIds: getMemberIdsByNames(memberNames),
  };
}

export default function CleaningTaskAdminModal() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);

  const [taskName, setTaskName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [isMemberOpen, setIsMemberOpen] = useState(false);

  const [isAddMode, setIsAddMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsMemberOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchWorks = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/works`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 업무 조회 실패:', errorMessage);
        alert('청소 업무 조회에 실패했습니다.');
        return;
      }

      const data: WorkResponse[] = await res.json();
      const mappedTasks: AdminTask[] = data.map(mapWorkToAdminTask);

      setTasks(mappedTasks);
    } catch (error) {
      console.error('청소 업무 조회 중 오류:', error);
      alert('청소 업무 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  const resetForm = () => {
    setTaskName('');
    setSelectedMemberIds([]);
    setIsMemberOpen(false);
    setIsAddMode(false);
    setEditingTaskId(null);
  };

  const toggleMember = (memberId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getSelectedMemberText = () => {
    const names = getMemberNamesByIds(selectedMemberIds);

    return names.length > 0 ? names.join(', ') : '담당자 선택';
  };

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      alert('업무명을 입력하세요.');
      return;
    }

    if (selectedMemberIds.length === 0) {
      alert('담당자를 선택하세요.');
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/works`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workName: taskName.trim(),
          memberIds: selectedMemberIds,
        }),
      });

      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 업무 추가 실패:', errorMessage);
        alert('청소 업무 추가에 실패했습니다.');
        return;
      }

      const createdWork: WorkResponse = await res.json();

      setTasks((prev) => [...prev, mapWorkToAdminTask(createdWork)]);

      resetForm();
    } catch (error) {
      console.error('청소 업무 추가 중 오류:', error);
      alert('청소 업무 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (task: AdminTask) => {
    setEditingTaskId(task.id);
    setIsAddMode(true);
    setTaskName(task.taskName);
    setSelectedMemberIds(task.memberIds);
    setIsMemberOpen(false);
  };

  const handleUpdateTask = async () => {
    if (editingTaskId === null) return;

    if (!taskName.trim()) {
      alert('업무명을 입력하세요.');
      return;
    }

    if (selectedMemberIds.length === 0) {
      alert('담당자를 선택하세요.');
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/works/${editingTaskId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workName: taskName.trim(),
          memberIds: selectedMemberIds,
        }),
      });

      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 업무 수정 실패:', errorMessage);
        alert('청소 업무 수정에 실패했습니다.');
        return;
      }

      const updatedWork: WorkResponse = await res.json();

      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTaskId ? mapWorkToAdminTask(updatedWork) : task
        )
      );

      resetForm();
    } catch (error) {
      console.error('청소 업무 수정 중 오류:', error);
      alert('청소 업무 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => {
    if (editingTaskId !== null) {
      handleUpdateTask();
      return;
    }

    handleAddTask();
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;

    try {
      setIsSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/works/${deleteTargetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 업무 삭제 실패:', errorMessage);
        alert('청소 업무 삭제에 실패했습니다.');
        return;
      }

      setTasks((prev) => prev.filter((task) => task.id !== deleteTargetId));

      setDeleteTargetId(null);
      setIsAlertOpen(false);
    } catch (error) {
      console.error('청소 업무 삭제 중 오류:', error);
      alert('청소 업무 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTargetId(null);
    setIsAlertOpen(false);
  };

  return (
    <>
      <div className={styles['cleaning-admin-current-list']}>
        {isLoading ? (
          <p className={styles['cleaning-empty']}>
            청소 업무를 불러오는 중입니다.
          </p>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className={styles['cleaning-admin-current-row']}>
              {editingTaskId === task.id ? (
                <div className={styles['cleaning-admin-edit-inline']}>
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
                <p>
                  {task.memberName
                    ? `${task.taskName}(${task.memberName})`
                    : task.taskName}
                </p>
              )}

              <div className={styles['cleaning-log-actions']}>
                {editingTaskId === task.id ? (
                  <button
                    type="button"
                    className={styles['cleaning-action-btn']}
                    onClick={handleSubmit}
                    disabled={isSaving}
                  >
                    <Check size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles['cleaning-action-btn']}
                    onClick={() => handleStartEdit(task)}
                    disabled={isSaving}
                  >
                    <Pencil size={18} />
                  </button>
                )}

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
          <p className={styles['cleaning-empty']}>
            등록된 청소 업무가 없습니다.
          </p>
        )}
      </div>

      {isAddMode && editingTaskId === null && (
        <div className={styles['cleaning-admin-input-group']}>
          <div className={styles['cleaning-admin-input-row']}>
            <input
              type="text"
              className={styles['cleaning-admin-input']}
              placeholder="업무 입력"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              disabled={isSaving}
            />

            <button
              type="button"
              className={styles['cleaning-admin-save-btn']}
              onClick={handleSubmit}
              disabled={isSaving}
            >
              <Check size={22} />
            </button>
          </div>

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

      <button
        type="button"
        className={`${styles['cleaning-modal-icon-btn']} ${
          isAddMode ? styles['close-mode'] : ''
        }`}
        onClick={() => {
          if (isSaving) return;

          if (isAddMode) {
            resetForm();
            return;
          }

          setIsAddMode(true);
          setEditingTaskId(null);
        }}
        disabled={isSaving}
      >
        <Plus size={28} />
      </button>

      {isAlertOpen && (
        <div className={styles['custom-alert-backdrop']}>
          <div className={styles['custom-alert']}>
            <p>해당 업무를 삭제하시겠습니까?</p>

            <div className={styles['custom-alert-actions']}>
              <button
                type="button"
                className={styles.cancel}
                onClick={handleCancelDelete}
                disabled={isSaving}
              >
                취소
              </button>

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