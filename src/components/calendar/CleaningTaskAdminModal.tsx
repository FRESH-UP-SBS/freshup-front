'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, Check, Plus } from 'lucide-react';
import styles from './calendar.module.css';

type AdminTask = {
  id: number;
  taskName: string;
  memberName: string;
};

const memberOptions = ['이다슬', '이세빈', '이보슬', '이해슬', '한현수'];

const initialTasks: AdminTask[] = [
  { id: 1, taskName: '바닥', memberName: '이다슬' },
  { id: 2, taskName: '빨래', memberName: '이해슬, 한현수' },
  { id: 3, taskName: '설거지', memberName: '이보슬' },
  { id: 4, taskName: '화장실', memberName: '이세빈' },
];

export default function CleaningTaskAdminModal() {
  const [tasks, setTasks] = useState<AdminTask[]>(initialTasks);

  const [taskName, setTaskName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [isAddMode, setIsAddMode] = useState(false);
  const [isMemberOpen, setIsMemberOpen] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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

  const toggleMember = (member: string) => {
    setSelectedMembers((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member]
    );
  };

  const resetForm = () => {
    setTaskName('');
    setSelectedMembers([]);
    setIsMemberOpen(false);
    setIsAddMode(false);
    setEditingTaskId(null);
  };

  const handleAddTask = () => {
    if (!taskName.trim() || selectedMembers.length === 0) return;

    const newTask: AdminTask = {
      id: Date.now(),
      taskName: taskName.trim(),
      memberName: selectedMembers.join(', '),
    };

    setTasks((prev) => [...prev, newTask]);
    resetForm();
  };

  const handleStartEdit = (task: AdminTask) => {
    setEditingTaskId(task.id);
    setIsAddMode(true);
    setTaskName(task.taskName);
    setSelectedMembers(
      task.memberName.split(',').map((member) => member.trim())
    );
    setIsMemberOpen(false);
  };

  const handleUpdateTask = () => {
    if (editingTaskId === null) return;
    if (!taskName.trim() || selectedMembers.length === 0) return;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              taskName: taskName.trim(),
              memberName: selectedMembers.join(', '),
            }
          : task
      )
    );

    resetForm();
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

  const handleConfirmDelete = () => {
    if (deleteTargetId === null) return;

    setTasks((prev) => prev.filter((task) => task.id !== deleteTargetId));
    setDeleteTargetId(null);
    setIsAlertOpen(false);
  };

  const handleCancelDelete = () => {
    setDeleteTargetId(null);
    setIsAlertOpen(false);
  };

  return (
    <>
      <div className={styles['cleaning-admin-current-list']}>
        {tasks.map((task) => (
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
                  >
                    {selectedMembers.length > 0
                      ? selectedMembers.join(', ')
                      : '담당자 선택'}
                  </button>

                  {isMemberOpen && (
                    <ul className={styles['cleaning-admin-dropdown']}>
                      {memberOptions.map((member) => (
                        <li key={member}>
                          <button
                            type="button"
                            className={`${styles['cleaning-admin-option']} ${
                              selectedMembers.includes(member)
                                ? styles.selected
                                : ''
                            }`}
                            onClick={() => toggleMember(member)}
                          >
                            {member}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <p>
                {task.taskName}({task.memberName})
              </p>
            )}

            <div className={styles['cleaning-log-actions']}>
              {editingTaskId === task.id ? (
                <button
                  type="button"
                  className={styles['cleaning-action-btn']}
                  onClick={handleSubmit}
                >
                  <Check size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles['cleaning-action-btn']}
                  onClick={() => handleStartEdit(task)}
                >
                  <Pencil size={18} />
                </button>
              )}

              <button
                type="button"
                className={`${styles['cleaning-action-btn']} ${styles.danger}`}
                onClick={() => handleDeleteClick(task.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
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
            />

            <button
              type="button"
              className={styles['cleaning-admin-save-btn']}
              onClick={handleSubmit}
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
            >
              {selectedMembers.length > 0
                ? selectedMembers.join(', ')
                : '담당자 선택'}
            </button>

            {isMemberOpen && (
              <ul className={styles['cleaning-admin-dropdown']}>
                {memberOptions.map((member) => (
                  <li key={member}>
                    <button
                      type="button"
                      className={`${styles['cleaning-admin-option']} ${
                        selectedMembers.includes(member) ? styles.selected : ''
                      }`}
                      onClick={() => toggleMember(member)}
                    >
                      {member}
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
          if (isAddMode) {
            resetForm();
            return;
          }

          setIsAddMode(true);
          setEditingTaskId(null);
        }}
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
              >
                취소
              </button>

              <button
                type="button"
                className={styles.confirm}
                onClick={handleConfirmDelete}
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