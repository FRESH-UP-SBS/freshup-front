'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import CleaningTaskAdminModal from './CleaningTaskAdminModal';
import styles from './calendar.module.css';

type CleaningLog = {
  id: number;
  taskName: string;
  memberName: string;
};

type CleaningLogModalProps = {
  date: Date;
  logs: CleaningLog[];
  onClose: () => void;

  // 추가/수정/삭제 후 부모 캘린더에서 다시 조회하기 위한 함수
  onChanged?: () => void;
};

type WorkOption = {
  id: number;
  name: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

// 임시 로그인 사용자 ID
// 현재 TB_USER 기준 이세빈 USER_SEQ = 1
const CURRENT_USER_ID = 1;

// 기존 UI 유지용 업무 목록
// TB_WORK.WORK_SEQ와 반드시 맞아야 함
const workOptions: WorkOption[] = [
  { id: 1, name: '바닥' },
  { id: 2, name: '빨래' },
  { id: 3, name: '설거지' },
  { id: 4, name: '화장실' },
];

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function getWorkIdByName(workName: string) {
  return workOptions.find((work) => work.name === workName)?.id;
}

async function getErrorMessage(res: Response) {
  const text = await res.text();

  if (!text) {
    return `상태코드: ${res.status}`;
  }

  return text;
}

export default function CleaningLogModal({
  date,
  logs,
  onClose,
  onChanged,
}: CleaningLogModalProps) {
  const [modalMode, setModalMode] = useState<'log' | 'admin'>('log');
  const [localLogs, setLocalLogs] = useState<CleaningLog[]>(logs);

  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedWork, setSelectedWork] = useState('');
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);

  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  const month = date.getMonth() + 1;
  const day = date.getDate();

  useEffect(() => {
    setLocalLogs(logs);
  }, [logs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsWorkDropdownOpen(false);
      }

      if (
        editDropdownRef.current &&
        !editDropdownRef.current.contains(target)
      ) {
        setIsEditDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChangeAdminMode = () => {
    setModalMode('admin');
    setIsAddMode(false);
    setIsWorkDropdownOpen(false);
    setEditingLogId(null);
    setEditTaskName('');
    setIsEditDropdownOpen(false);
  };

  const handleChangeLogMode = () => {
    setModalMode('log');
  };

  const handleStartEdit = (log: CleaningLog) => {
    setEditingLogId(log.id);
    setEditTaskName(log.taskName);

    setIsAddMode(false);
    setSelectedWork('');
    setIsWorkDropdownOpen(false);
    setIsEditDropdownOpen(false);
  };

  const handleSaveEdit = async () => {
    if (editingLogId === null || !editTaskName.trim()) {
      return;
    }

    const workId = getWorkIdByName(editTaskName);

    if (!workId) {
      alert('업무 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/schedules/${editingLogId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: CURRENT_USER_ID,
          workId,
          date: formatDate(date),
        }),
      });

      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 내역 수정 실패:', errorMessage);
        alert('청소 내역 수정에 실패했습니다.');
        return;
      }

      const updatedLog: CleaningLog = await res.json();

      setLocalLogs((prev) =>
        prev.map((log) => (log.id === editingLogId ? updatedLog : log))
      );

      setEditingLogId(null);
      setEditTaskName('');
      setIsEditDropdownOpen(false);

      onChanged?.();
    } catch (error) {
      console.error('청소 내역 수정 중 오류:', error);
      alert('청소 내역 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) {
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/schedules/${deleteTargetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 내역 삭제 실패:', errorMessage);
        alert('청소 내역 삭제에 실패했습니다.');
        return;
      }

      setLocalLogs((prev) => prev.filter((log) => log.id !== deleteTargetId));

      setDeleteTargetId(null);
      setIsAlertOpen(false);

      onChanged?.();
    } catch (error) {
      console.error('청소 내역 삭제 중 오류:', error);
      alert('청소 내역 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTargetId(null);
    setIsAlertOpen(false);
  };

  const handleCreateLog = async () => {
    if (!selectedWork.trim()) {
      alert('업무를 선택하세요.');
      return;
    }

    const workId = getWorkIdByName(selectedWork);

    if (!workId) {
      alert('업무 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/schedules`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: CURRENT_USER_ID,
          workId,
          date: formatDate(date),
        }),
      });

      if (!res.ok) {
        const errorMessage = await getErrorMessage(res);
        console.error('청소 내역 등록 실패:', errorMessage);
        alert('청소 내역 등록에 실패했습니다.');
        return;
      }

      const createdLog: CleaningLog = await res.json();

      setLocalLogs((prev) => [...prev, createdLog]);

      setSelectedWork('');
      setIsAddMode(false);
      setIsWorkDropdownOpen(false);

      onChanged?.();
    } catch (error) {
      console.error('청소 내역 등록 중 오류:', error);
      alert('청소 내역 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles['cleaning-modal-backdrop']} onClick={onClose}>
      <section
        className={styles['cleaning-modal']}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles['cleaning-modal-header']}>
          <h2>
            {modalMode === 'log'
              ? `${month}.${String(day).padStart(2, '0')}`
              : 'Work'}
          </h2>

          <div className={styles['cleaning-header-actions']}>
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

        <div className={styles['cleaning-modal-body']}>
          {modalMode === 'log' && (
            <>
              <div className={styles['cleaning-log-list']}>
                {localLogs.length > 0 ? (
                  localLogs.map((log) => (
                    <div key={log.id} className={styles['cleaning-log-row']}>
                      {editingLogId === log.id ? (
                        <div
                          className={styles['cleaning-log-edit-wrap']}
                          ref={editDropdownRef}
                        >
                          <button
                            type="button"
                            className={styles['cleaning-log-edit-button']}
                            onClick={() =>
                              setIsEditDropdownOpen((prev) => !prev)
                            }
                            disabled={isSaving}
                          >
                            <span>{editTaskName || '업무를 선택하세요'}</span>

                            <ChevronDown
                              size={22}
                              className={`${styles['cleaning-log-edit-icon']} ${
                                isEditDropdownOpen ? styles.open : ''
                              }`}
                            />
                          </button>

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
                                      setEditTaskName(work.name);
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
                        <p>
                          {log.taskName}({log.memberName})
                        </p>
                      )}

                      <div className={styles['cleaning-log-actions']}>
                        {editingLogId === log.id ? (
                          <button
                            type="button"
                            className={styles['cleaning-action-btn']}
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                          >
                            <Check size={18} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles['cleaning-action-btn']}
                            onClick={() => handleStartEdit(log)}
                            disabled={isSaving}
                          >
                            <Pencil size={18} />
                          </button>
                        )}

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
                  <p className={styles['cleaning-empty']}>
                    등록된 청소 기록이 없습니다.
                  </p>
                )}
              </div>

              {isAddMode && (
                <div
                  className={styles['cleaning-dropdown-row']}
                  ref={dropdownRef}
                >
                  <div className={styles['cleaning-dropdown-wrap']}>
                    <button
                      type="button"
                      className={styles['cleaning-dropdown-button']}
                      onClick={() => setIsWorkDropdownOpen((prev) => !prev)}
                      disabled={isSaving}
                    >
                      <span className={!selectedWork ? styles.placeholder : ''}>
                        {selectedWork || '업무를 선택하세요'}
                      </span>

                      <ChevronDown
                        size={22}
                        className={`${styles['cleaning-dropdown-icon']} ${
                          isWorkDropdownOpen ? styles.open : ''
                        }`}
                      />
                    </button>

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
                                setSelectedWork(work.name);
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

              <button
                type="button"
                className={`${styles['cleaning-modal-icon-btn']} ${
                  isAddMode || editingLogId !== null
                    ? styles['close-mode']
                    : ''
                }`}
                onClick={() => {
                  if (isSaving) {
                    return;
                  }

                  if (isAddMode || editingLogId !== null) {
                    setIsAddMode(false);
                    setEditingLogId(null);
                    setEditTaskName('');
                    setSelectedWork('');
                    setIsWorkDropdownOpen(false);
                    setIsEditDropdownOpen(false);
                    return;
                  }

                  setIsAddMode(true);
                }}
                disabled={isSaving}
              >
                <Plus size={28} />
              </button>
            </>
          )}

          {modalMode === 'admin' && <CleaningTaskAdminModal />}
        </div>

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
      </section>
    </div>
  );
}