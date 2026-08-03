/**
 * Main Application Logic & Event Controllers
 * To Do List by Sxynn - Mobile Homework Manager
 */

document.addEventListener('DOMContentLoaded', async () => {
  // App State
  let currentUser = ApiClient.getCurrentUser();
  let currentFilter = 'all';
  let currentSort = 'smart';
  let searchQuery = '';
  
  // Theme State
  let currentTheme = localStorage.getItem('todo_theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Instantiations
  const confetti = new ConfettiEngine('confettiCanvas');
  const authManager = new AuthManager((newUser) => {
    currentUser = newUser;
    renderTasks();
  });

  // DOM Elements
  const taskListEl = document.getElementById('taskList');
  const emptyStateEl = document.getElementById('emptyState');
  const searchInputEl = document.getElementById('searchInput');
  const clearSearchBtnEl = document.getElementById('clearSearchBtn');
  const filterPillsEl = document.getElementById('filterPills');
  const sortSelectEl = document.getElementById('sortSelect');
  const toggleThemeBtnEl = document.getElementById('toggleThemeBtn');
  const toggleSoundBtnEl = document.getElementById('toggleSoundBtn');

  // Sound Toggle
  if (toggleSoundBtnEl) {
    toggleSoundBtnEl.addEventListener('click', () => {
      const isEnabled = window.soundEngine.toggleSound();
      toggleSoundBtnEl.innerHTML = isEnabled
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="1" x2="17" y2="7"/></svg>';
    });
  }

  // Task Modal Elements
  const taskModalEl = document.getElementById('taskModal');
  const openAddModalBtnEl = document.getElementById('openAddModalBtn');
  const closeTaskModalBtnEl = document.getElementById('closeTaskModalBtn');
  const cancelTaskBtnEl = document.getElementById('cancelTaskBtn');
  const taskFormEl = document.getElementById('taskForm');
  const modalTitleEl = document.getElementById('modalTitle');

  const taskIdInput = document.getElementById('taskId');
  const taskSubjectSelect = document.getElementById('taskSubject');
  const taskTitleInput = document.getElementById('taskTitle');
  const taskDetailInput = document.getElementById('taskDetail');
  const taskDueDateInput = document.getElementById('taskDueDate');
  const taskDueTimeInput = document.getElementById('taskDueTime');

  // Counter Elements
  const countAllEl = document.getElementById('countAll');
  const countPendingEl = document.getElementById('countPending');
  const countUrgentEl = document.getElementById('countUrgent');
  const countCompletedEl = document.getElementById('countCompleted');

  // Progress Bar Elements
  const progressStatusTextEl = document.getElementById('progressStatusText');
  const progressPercentEl = document.getElementById('progressPercent');
  const progressBarFillEl = document.getElementById('progressBarFill');

  // Initial Setup
  authManager.checkAuthState();
  setTodayDefaultDate();
  
  if (currentUser && ApiClient.isLoggedIn()) {
    renderTasks();
  }

  // --------------------------------------------------------------------------
  // Event Bindings
  // --------------------------------------------------------------------------

  // Theme Toggle
  toggleThemeBtnEl.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('todo_theme', currentTheme);
    toggleThemeBtnEl.innerHTML = currentTheme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  });

  // Search Bar
  searchInputEl.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtnEl.hidden = searchQuery === '';
    renderTasks();
  });

  clearSearchBtnEl.addEventListener('click', () => {
    searchInputEl.value = '';
    searchQuery = '';
    clearSearchBtnEl.hidden = true;
    renderTasks();
  });

  // Filter Pills
  filterPillsEl.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;

    filterPillsEl.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilter = pill.dataset.filter || 'all';
    renderTasks();
  });

  // Sort Select
  sortSelectEl.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTasks();
  });



  // Open Modal - Add Mode
  openAddModalBtnEl.addEventListener('click', () => {
    openModalForAdd();
  });

  closeTaskModalBtnEl.addEventListener('click', closeModal);
  cancelTaskBtnEl.addEventListener('click', closeModal);

  // Submit Add / Edit Task Form
  taskFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    let selectedSubject = taskSubjectSelect.value || 'ทั่วไป/อื่นๆ';

    const priorityInput = document.querySelector('input[name="taskPriority"]:checked');

    const taskData = {
      subject: selectedSubject,
      title: taskTitleInput.value.trim(),
      detail: taskDetailInput.value.trim(),
      dueDate: taskDueDateInput.value,
      dueTime: taskDueTimeInput.value || '23:59',
      priority: priorityInput ? priorityInput.value : 'medium'
    };

    const editingId = taskIdInput.value;
    try {
      if (editingId) {
        await ApiClient.updateTask(editingId, taskData);
      } else {
        await ApiClient.addTask(taskData);
      }
      closeModal();
      await renderTasks();
    } catch (err) {
      alert('Error saving task: ' + err.message);
    }
  });

  // --------------------------------------------------------------------------
  // Core Functions
  // --------------------------------------------------------------------------

  function setTodayDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    taskDueDateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  function openModalForAdd() {
    modalTitleEl.textContent = 'เพิ่มงานการบ้านใหม่';
    taskIdInput.value = '';
    taskFormEl.reset();
    setTodayDefaultDate();
    taskModalEl.classList.add('active');
  }

  function openModalForEdit(task) {
    modalTitleEl.textContent = 'แก้ไขงานการบ้าน';
    taskIdInput.value = task._id || task.id;
    taskSubjectSelect.value = task.subject || 'ทั่วไป/อื่นๆ';

    taskTitleInput.value = task.title;
    taskDetailInput.value = task.detail || '';
    taskDueDateInput.value = task.dueDate;
    taskDueTimeInput.value = task.dueTime || '23:59';

    const radio = document.querySelector(`input[name="taskPriority"][value="${task.priority}"]`);
    if (radio) radio.checked = true;

    taskModalEl.classList.add('active');
  }

  function closeModal() {
    taskModalEl.classList.remove('active');
  }

  // --------------------------------------------------------------------------
  // Tasks Renderer & Calculations
  // --------------------------------------------------------------------------

  async function renderTasks() {
    if (!currentUser) {
      authManager.openModal();
      return;
    }

    let allTasks = [];
    try {
      allTasks = await ApiClient.getTasks();
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
    
    // Calculate Summary Stats
    updateSummaryStats(allTasks);

    // Apply Filter & Search
    let filtered = allTasks.filter(task => {
      // Search
      if (searchQuery) {
        const matchesTitle = task.title.toLowerCase().includes(searchQuery);
        const matchesSubject = task.subject.toLowerCase().includes(searchQuery);
        const matchesDetail = (task.detail || '').toLowerCase().includes(searchQuery);
        if (!matchesTitle && !matchesSubject && !matchesDetail) return false;
      }

      // Filter Pill
      if (currentFilter === 'pending') return task.status === 'pending';
      if (currentFilter === 'completed') return task.status === 'completed';
      if (currentFilter === 'urgent') return task.status === 'pending' && (task.priority === 'high' || isOverdueOrToday(task.dueDate));
      
      return true;
    });

    // Sort Tasks
    filtered = sortTasks(filtered, currentSort);

    // Render Cards
    if (filtered.length === 0) {
      taskListEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');
    } else {
      emptyStateEl.classList.add('hidden');
      taskListEl.innerHTML = filtered.map(task => createTaskCardHTML(task)).join('');

      // Attach Event Listeners to Cards
      taskListEl.querySelectorAll('.task-card').forEach(card => {
        const taskId = card.dataset.id;
        const checkbox = card.querySelector('.task-checkbox');
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');

        checkbox.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            const updated = await ApiClient.toggleTaskStatus(taskId);
            if (updated) {
              if (updated.status === 'completed') {
                window.soundEngine.playTaskComplete();
                confetti.fire();
              } else {
                window.soundEngine.playTaskUncomplete();
              }
            }
            await renderTasks();
          } catch (err) {
            console.error(err);
          }
        });

        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetTask = allTasks.find(t => (t._id || t.id) === taskId);
          if (targetTask) openModalForEdit(targetTask);
        });

        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('คุณต้องการลบการบ้านชิ้นนี้ใช่หรือไม่?')) {
            try {
              await ApiClient.deleteTask(taskId);
              await renderTasks();
            } catch (err) {
              console.error(err);
            }
          }
        });
      });
    }
  }

  function sortTasks(tasks, mode) {
    return tasks.sort((a, b) => {
      // Completed items go to bottom automatically
      if (a.status !== b.status) {
        return a.status === 'completed' ? 1 : -1;
      }

      if (mode === 'dueDate') {
        const dateA = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`);
        const dateB = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`);
        return dateA - dateB;
      }

      if (mode === 'priority') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }

      if (mode === 'createdAt') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }

      // Default 'smart' mode: Combined Priority Weight + Due Date Urgency
      const pWeightA = (a.priority === 'high' ? 30 : a.priority === 'medium' ? 20 : 10);
      const pWeightB = (b.priority === 'high' ? 30 : b.priority === 'medium' ? 20 : 10);

      const dateA = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`).getTime();
      const dateB = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`).getTime();

      // Lower timestamp (nearer due date) gets higher score
      const now = Date.now();
      const diffDaysA = Math.max(0.1, (dateA - now) / (1000 * 60 * 60 * 24));
      const diffDaysB = Math.max(0.1, (dateB - now) / (1000 * 60 * 60 * 24));

      const scoreA = pWeightA + (100 / diffDaysA);
      const scoreB = pWeightB + (100 / diffDaysB);

      return scoreB - scoreA;
    });
  }

  function updateSummaryStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const urgent = tasks.filter(t => t.status === 'pending' && (t.priority === 'high' || isOverdueOrToday(t.dueDate))).length;

    countAllEl.textContent = total;
    countPendingEl.textContent = pending;
    countUrgentEl.textContent = urgent;
    countCompletedEl.textContent = completed;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    progressStatusTextEl.textContent = `เสร็จแล้ว ${completed} จาก ${total} งาน`;
    progressPercentEl.textContent = `${percent}%`;
    progressBarFillEl.style.width = `${percent}%`;

    // Play Victory Fanfare if 100% completed!
    if (total > 0 && completed === total && !window.hasPlayedVictoryToday) {
      window.hasPlayedVictoryToday = true;
      setTimeout(() => {
        window.soundEngine.playAllCompletedFanfare();
      }, 200);
    } else if (completed < total) {
      window.hasPlayedVictoryToday = false;
    }
  }

  function createTaskCardHTML(task) {
    const isDone = task.status === 'completed';
    const dueInfo = getDueDateBadgeInfo(task.dueDate, task.dueTime);
    const priorityLabel = task.priority === 'high' ? 'สูง' : task.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ';

    return `
      <div class="task-card ${isDone ? 'completed' : ''}" data-id="${task._id || task.id}">
        <div class="task-header">
          <div class="task-checkbox" title="${isDone ? 'ทำยังไม่เสร็จ' : 'ทำเสร็จแล้ว'}">
            ${isDone ? '✓' : ''}
          </div>
          <div class="task-content">
            <div class="task-meta-top">
              <span class="subject-badge">${escapeHtml(task.subject)}</span>
              <span class="priority-badge ${task.priority}">${priorityLabel}</span>
            </div>
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.detail ? `<div class="task-detail">${escapeHtml(task.detail)}</div>` : ''}
          </div>
        </div>
        <div class="task-footer">
          <span class="due-badge ${dueInfo.className}">
            ${dueInfo.text} (${formatThaiDate(task.dueDate)} ${task.dueTime ? task.dueTime + ' น.' : ''})
          </span>
          <div class="task-actions">
            <button class="action-btn edit-btn" title="แก้ไข">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete-btn" title="ลบ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Date Helpers & Countdown
  // --------------------------------------------------------------------------

  function getDueDateBadgeInfo(dateStr, timeStr = '23:59') {
    const target = new Date(`${dateStr}T${timeStr}`);
    const now = new Date();
    
    // Normalize to midnight for day comparison
    const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = targetMidnight - nowMidnight;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || (diffDays === 0 && target < now)) {
      return { text: 'เลยกำหนดส่ง!', className: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'ส่งวันนี้!', className: 'today' };
    } else if (diffDays === 1) {
      return { text: 'ส่งพรุ่งนี้!', className: 'today' };
    } else if (diffDays <= 3) {
      return { text: `เหลืออีก ${diffDays} วัน`, className: 'soon' };
    } else {
      return { text: `เหลืออีก ${diffDays} วัน`, className: 'soon' };
    }
  }

  function isOverdueOrToday(dateStr) {
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(23, 59, 59, 999);
    return target <= now || target.toDateString() === now.toDateString();
  }

  function formatThaiDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const monthsThai = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${day} ${monthsThai[monthIndex]}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
});

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW reg failed: ', err));
  });
}

