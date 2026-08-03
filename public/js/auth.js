/**
 * Authentication & User Switcher Module
 */

class AuthManager {
  constructor(onUserChanged) {
    this.onUserChanged = onUserChanged;
    this.selectedAvatar = 'icons/clean_avatar_boy.png?v=6';

    this.initElements();
    this.bindEvents();
    this.checkAuthState();
  }

  initElements() {
    this.userProfileBtn = document.getElementById('userProfileBtn');
    this.openAuthBtn = document.getElementById('openAuthBtn');
    this.authModal = document.getElementById('authModal');
    this.closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    
    this.userCardsGrid = document.getElementById('userCardsGrid');
    this.userSwitchSection = document.getElementById('userSwitchSection');
    
    this.showRegisterTabBtn = document.getElementById('showRegisterTabBtn');
    this.logoutCurrentBtn = document.getElementById('logoutCurrentBtn');
    
    this.registerForm = document.getElementById('registerForm');
    this.cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
    
    this.avatarSelector = document.getElementById('avatarSelector');
    this.userAvatar = document.getElementById('userAvatar');
    this.userNameDisplay = document.getElementById('userNameDisplay');

    // Landing Screen Elements
    this.authLandingScreen = document.getElementById('authLandingScreen');
    this.appContainer = document.getElementById('app');

    this.landingTabLogin = document.getElementById('landingTabLogin');
    this.landingTabRegister = document.getElementById('landingTabRegister');
    this.landingLoginSection = document.getElementById('landingLoginSection');
    this.landingRegisterSection = document.getElementById('landingRegisterSection');

    this.landingUserCardsGrid = document.getElementById('landingUserCardsGrid');
    this.landingLoginForm = document.getElementById('landingLoginForm');
    this.landingRegisterForm = document.getElementById('landingRegisterForm');
  }

  bindEvents() {
    // Open Profile Modal (clicking on "สวัสดี, Name")
    if (this.userProfileBtn) {
      this.userProfileBtn.addEventListener('click', () => this.openProfileModal());
    }
    if (this.openAuthBtn) {
      this.openAuthBtn.addEventListener('click', () => this.openModal());
    }

    // Close Auth Modal
    if (this.closeAuthModalBtn) {
      this.closeAuthModalBtn.addEventListener('click', () => this.closeModal());
    }

    // Toggle Forms inside Modal
    if (this.showRegisterTabBtn) {
      this.showRegisterTabBtn.addEventListener('click', () => {
        this.userSwitchSection.classList.add('hidden');
        this.registerForm.classList.remove('hidden');
      });
    }

    if (this.cancelRegisterBtn) {
      this.cancelRegisterBtn.addEventListener('click', () => {
        this.registerForm.classList.add('hidden');
        this.userSwitchSection.classList.remove('hidden');
      });
    }

    // Avatar Pickers Setup
    this.selectedLandingAvatar = 'icons/clean_avatar_boy.png?v=8';
    this.selectedModalAvatar = 'icons/clean_avatar_boy.png?v=8';

    const landingPicker = document.getElementById('landingAvatarPicker');
    if (landingPicker) {
      landingPicker.querySelectorAll('.avatar-picker-item').forEach(item => {
        item.addEventListener('click', () => {
          landingPicker.querySelectorAll('.avatar-picker-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          this.selectedLandingAvatar = item.dataset.avatar;
        });
      });
    }

    const modalPicker = document.getElementById('modalAvatarPicker');
    if (modalPicker) {
      modalPicker.querySelectorAll('.avatar-picker-item').forEach(item => {
        item.addEventListener('click', () => {
          modalPicker.querySelectorAll('.avatar-picker-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          this.selectedModalAvatar = item.dataset.avatar;
        });
      });
    }

    // Submit Modal Register Form
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const displayName = document.getElementById('regDisplayName').value;
        const password = document.getElementById('regPassword').value;

        try {
          await ApiClient.register(username, displayName, password, this.selectedModalAvatar);
          const loginData = await ApiClient.login(username, password);
          const newUser = loginData.user;
          this.updateUserUI(newUser);
          this.closeModal();
          this.registerForm.reset();
          this.registerForm.classList.add('hidden');
          this.userSwitchSection.classList.remove('hidden');
          
          if (this.onUserChanged) this.onUserChanged(newUser);
          this.checkAuthState();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // Submit Landing Register Form
    if (this.landingRegisterForm) {
      this.landingRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('landingRegUsername').value.trim();
        const displayName = document.getElementById('landingRegDisplayName').value.trim();
        const password = document.getElementById('landingRegPassword').value;

        try {
          await ApiClient.register(username, displayName, password, this.selectedLandingAvatar);
          const loginData = await ApiClient.login(username, password);
          this.landingRegisterForm.reset();
          this.checkAuthState();
          if (this.onUserChanged) this.onUserChanged(loginData.user);
        } catch (err) {
          alert('สมัครสมาชิกไม่สำเร็จ: ' + err.message);
        }
      });
    }

    // Logout Button
    if (this.logoutCurrentBtn) {
      this.logoutCurrentBtn.addEventListener('click', () => {
        ApiClient.logout();
        this.updateUserUI(null);
        this.closeModal();
        if (this.onUserChanged) this.onUserChanged(null);
        this.checkAuthState();
      });
    }

    // Landing Tabs
    if (this.landingTabLogin && this.landingTabRegister) {
      this.landingTabLogin.addEventListener('click', () => {
        this.landingTabLogin.classList.add('active');
        this.landingTabRegister.classList.remove('active');
        this.landingLoginSection.classList.remove('hidden');
        this.landingRegisterSection.classList.add('hidden');
      });

      this.landingTabRegister.addEventListener('click', () => {
        this.landingTabRegister.classList.add('active');
        this.landingTabLogin.classList.remove('active');
        this.landingRegisterSection.classList.remove('hidden');
        this.landingLoginSection.classList.add('hidden');
      });
    }

    // Submit Landing Login Form
    if (this.landingLoginForm) {
      this.landingLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('landingLoginUsername').value.trim();
        const password = document.getElementById('landingLoginPassword').value;

        try {
          const loginData = await ApiClient.login(username, password);
          this.landingLoginForm.reset();
          this.checkAuthState();
          if (this.onUserChanged) this.onUserChanged(loginData.user);
        } catch (err) {
          alert('เข้าสู่ระบบไม่สำเร็จ: ' + (err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'));
        }
      });
    }
  }

  async checkAuthState() {
    const currentUser = ApiClient.getCurrentUser();
    if (ApiClient.isLoggedIn() && currentUser) {
      if (this.authLandingScreen) this.authLandingScreen.classList.add('hidden');
      if (this.appContainer) this.appContainer.classList.remove('hidden');
      this.updateUserUI(currentUser);
    } else {
      if (this.appContainer) this.appContainer.classList.add('hidden');
      if (this.authLandingScreen) this.authLandingScreen.classList.remove('hidden');
      await this.renderLandingUserCards();
    }
  }

  openModal() {
    this.renderUserCards();
    this.authModal.classList.add('active');
  }

  closeModal() {
    this.authModal.classList.remove('active');
  }

  async openProfileModal() {
    const profileModal = document.getElementById('profileModal');
    const currentUser = ApiClient.getCurrentUser();
    if (!profileModal || !currentUser) return;

    // Avatar
    const avatarEl = document.getElementById('profileAvatarLg');
    const isImg = currentUser.avatar && (currentUser.avatar.includes('/') || currentUser.avatar.includes('.'));
    if (isImg) {
      avatarEl.innerHTML = `<img src="${currentUser.avatar}" alt="${this.escapeHtml(currentUser.displayName)}">`;
    } else {
      avatarEl.textContent = currentUser.avatar || '✏️';
    }

    // Name
    document.getElementById('profileName').textContent = currentUser.displayName || currentUser.username;
    document.getElementById('profileUsername').textContent = '@' + currentUser.username;

    // Task Stats
    let tasks = [];
    try {
      tasks = await ApiClient.getTasks();
    } catch (err) {
      console.error(err);
    }
    const completed = tasks.filter(t => t.status === 'completed').length;
    const remaining = tasks.length - completed;
    const total = tasks.length;

    document.getElementById('profileCompleted').textContent = completed;
    document.getElementById('profileRemaining').textContent = remaining;
    document.getElementById('profileTotal').textContent = total;

    // On-time percentage (completed tasks that were completed before/on due date)
    let onTimePercent = 0;
    if (completed > 0) {
      const onTimeTasks = tasks.filter(t => {
        if (t.status !== 'completed' || !t.dueDate) return false;
        const due = new Date(t.dueDate + (t.dueTime ? 'T' + t.dueTime : 'T23:59:59'));
        const completedAt = t.completedAt ? new Date(t.completedAt) : new Date();
        return completedAt <= due;
      }).length;
      onTimePercent = Math.round((onTimeTasks / completed) * 100);
    } else if (total === 0) {
      onTimePercent = 0;
    }

    // Update ring
    const circumference = 2 * Math.PI * 60; // r=60
    const ringFill = document.getElementById('profileRingFill');
    const offset = circumference - (onTimePercent / 100) * circumference;
    
    // Reset first for animation
    ringFill.style.strokeDashoffset = circumference;
    document.getElementById('profileRingPercent').textContent = onTimePercent + '%';

    // Show modal
    profileModal.classList.add('active');

    // Animate ring after small delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        ringFill.style.strokeDashoffset = offset;
      }, 100);
    });

    // Interactive Avatar Drawer Toggle & Selection
    const profileAvatarWrapper = document.getElementById('profileAvatarWrapper');
    const profileAvatarDrawer = document.getElementById('profileAvatarDrawer');
    const profileModalAvatarPicker = document.getElementById('profileModalAvatarPicker');
    const btnUploadPhoto = document.getElementById('btnUploadPhoto');
    const customPhotoFileInput = document.getElementById('customPhotoFileInput');

    if (profileAvatarDrawer) {
      profileAvatarDrawer.classList.add('hidden');
    }

    if (profileAvatarWrapper && profileAvatarDrawer) {
      profileAvatarWrapper.onclick = () => {
        profileAvatarDrawer.classList.toggle('hidden');
      };
    }

    if (profileModalAvatarPicker) {
      profileModalAvatarPicker.querySelectorAll('.avatar-picker-item').forEach(item => {
        item.onclick = async () => {
          const newAvatar = item.dataset.avatar;
          try {
            const updatedUser = await ApiClient.updateProfile(newAvatar);
            this.updateUserUI(updatedUser);
            if (this.onUserChanged) this.onUserChanged(updatedUser);
            
            avatarEl.innerHTML = `<img src="${updatedUser.avatar}" alt="${this.escapeHtml(updatedUser.displayName)}">`;
            profileAvatarDrawer.classList.add('hidden');
          } catch (err) {
            alert('ไม่สามารถเปลี่ยนรูปโปรไฟล์ได้: ' + err.message);
          }
        };
      });
    }

    if (btnUploadPhoto && customPhotoFileInput) {
      btnUploadPhoto.onclick = () => customPhotoFileInput.click();

      customPhotoFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const maxDim = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const base64Avatar = canvas.toDataURL('image/jpeg', 0.85);

            try {
              const updatedUser = await ApiClient.updateProfile(base64Avatar);
              this.updateUserUI(updatedUser);
              if (this.onUserChanged) this.onUserChanged(updatedUser);

              avatarEl.innerHTML = `<img src="${updatedUser.avatar}" alt="${this.escapeHtml(updatedUser.displayName)}">`;
              profileAvatarDrawer.classList.add('hidden');
            } catch (err) {
              alert('ไม่สามารถอัปโหลดรูปได้: ' + err.message);
            }
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      };
    }

    // Close button
    const closeBtn = document.getElementById('closeProfileModalBtn');
    if (closeBtn) {
      closeBtn.onclick = () => profileModal.classList.remove('active');
    }

    // Delete Account button
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (confirm(`คุณต้องการลบบัญชี "${currentUser.displayName}" และข้อมูลการบ้านทั้งหมดใช่หรือไม่?`)) {
          try {
            await ApiClient.deleteAccount();
            profileModal.classList.remove('active');
            alert('ลบบัญชีเรียบร้อยแล้ว');
            
            // Auto switch to remaining available user or reload
            const users = await ApiClient.getUsers();
            if (users.length > 0) {
              const autoUser = users[0];
              const pwd = ApiClient.getSavedPassword(autoUser.username) || 'demo123';
              try {
                const loginData = await ApiClient.login(autoUser.username, pwd);
                this.updateUserUI(loginData.user);
                if (this.onUserChanged) this.onUserChanged(loginData.user);
              } catch (e) {
                location.reload();
              }
            } else {
              location.reload();
            }
          } catch (err) {
            alert('เกิดข้อผิดพลาดในการลบบัญชี: ' + err.message);
          }
        }
      };
    }
  }

  async renderLandingUserCards() {
    if (!this.landingUserCardsGrid) return;
    const savedAccountsObj = ApiClient.getSavedAccounts();
    const users = Object.values(savedAccountsObj);

    if (users.length === 0) {
      this.landingUserCardsGrid.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:10px;">ยังไม่มีบัญชีสมาชิกบนเครื่องนี้ กรุณาสมัครสมาชิกใหม่</div>';
      return;
    }

    this.landingUserCardsGrid.innerHTML = users.map(u => {
      const isImg = u.avatar && (u.avatar.includes('/') || u.avatar.includes('.'));
      const avatarHTML = isImg 
        ? `<img src="${u.avatar}" class="user-card-avatar-img" alt="${this.escapeHtml(u.displayName || u.username)}">` 
        : `<span class="user-card-avatar">${u.avatar || '✏️'}</span>`;

      return `
        <div class="user-card" data-username="${this.escapeHtml(u.username)}">
          ${avatarHTML}
          <span class="user-card-name">${this.escapeHtml(u.displayName || u.username)}</span>
        </div>
      `;
    }).join('');

    // Attach click events for quick login on landing screen
    this.landingUserCardsGrid.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', async () => {
        const username = card.dataset.username;
        let password = ApiClient.getSavedPassword(username);

        if (!password && username === 'demo') {
          password = 'demo123';
        } else if (!password) {
          password = prompt(`กรุณากรอกรหัสผ่านสำหรับ ${username}:`);
        }

        if (password) {
          try {
            const loginData = await ApiClient.login(username, password);
            this.checkAuthState();
            if (this.onUserChanged) this.onUserChanged(loginData.user);
          } catch (err) {
            alert('เข้าสู่ระบบไม่สำเร็จ: ' + (err.message || 'รหัสผ่านไม่ถูกต้อง'));
          }
        }
      });
    });
  }

  async renderUserCards() {
    if (!this.userCardsGrid) return;
    const savedAccountsObj = ApiClient.getSavedAccounts();
    const users = Object.values(savedAccountsObj);
    const currentUser = ApiClient.getCurrentUser();
    const currentUsername = currentUser?.username;

    this.userCardsGrid.innerHTML = users.map(u => {
      const isImg = u.avatar && (u.avatar.includes('/') || u.avatar.includes('.'));
      const avatarHTML = isImg 
        ? `<img src="${u.avatar}" class="user-card-avatar-img" alt="${this.escapeHtml(u.displayName || u.username)}">` 
        : `<span class="user-card-avatar">${u.avatar || '✏️'}</span>`;

      return `
        <div class="user-card ${u.username === currentUsername ? 'active' : ''}" data-username="${this.escapeHtml(u.username)}">
          ${avatarHTML}
          <span class="user-card-name">${this.escapeHtml(u.displayName || u.username)}</span>
        </div>
      `;
    }).join('');

    // Attach click events for user switching
    this.userCardsGrid.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', async () => {
        const username = card.dataset.username;

        // If already current user, just close modal
        if (username === currentUsername) {
          this.closeModal();
          return;
        }

        // Check for saved password first for instant passwordless switching
        let password = ApiClient.getSavedPassword(username);

        if (!password && username === 'demo') {
          password = 'demo123';
        } else if (!password) {
          password = prompt(`กรุณากรอกรหัสผ่านสำหรับ ${username}:`);
        }

        if (password) {
          try {
            const loginData = await ApiClient.login(username, password);
            this.updateUserUI(loginData.user);
            await this.renderUserCards();
            this.closeModal();
            if (this.onUserChanged) this.onUserChanged(loginData.user);
          } catch (err) {
            alert('สลับบัญชีไม่สำเร็จ: ' + (err.message || 'รหัสผ่านไม่ถูกต้อง'));
          }
        }
      });
    });
  }

  updateUserUI(user) {
    if (!user) return;
    if (this.userAvatar) {
      const isImg = user.avatar && (user.avatar.includes('/') || user.avatar.includes('.'));
      if (isImg) {
        this.userAvatar.innerHTML = `<img src="${user.avatar}" class="avatar-header-img" alt="${this.escapeHtml(user.displayName)}">`;
      } else {
        this.userAvatar.textContent = user.avatar || '✏️';
      }
    }
    if (this.userNameDisplay) this.userNameDisplay.textContent = user.displayName || user.username;
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
