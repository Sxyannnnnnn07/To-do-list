/**
 * Authentication & User Switcher Module
 */

class AuthManager {
  constructor(onUserChanged) {
    this.onUserChanged = onUserChanged;
    this.selectedAvatar = 'icons/clean_avatar_boy.png?v=6';
    this.googleClientId = '';

    this.initElements();
    this.bindEvents();
    this.checkAuthState();
    this.initGoogleAuth();
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
        const username = document.getElementById('regUsername').value.trim();
        const displayName = document.getElementById('regDisplayName').value.trim();
        const password = document.getElementById('regPassword').value;
        const email = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : null;

        try {
          await ApiClient.register(username, displayName, password, this.selectedModalAvatar, email);
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
          alert('สมัครสมาชิกไม่สำเร็จ: ' + err.message);
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
        const email = document.getElementById('landingRegEmail') ? document.getElementById('landingRegEmail').value.trim() : null;

        try {
          await ApiClient.register(username, displayName, password, this.selectedLandingAvatar, email);
          const loginData = await ApiClient.login(username, password);
          this.landingRegisterForm.reset();
          this.checkAuthState();
          if (this.onUserChanged) this.onUserChanged(loginData.user);
        } catch (err) {
          alert('สมัครสมาชิกไม่สำเร็จ: ' + err.message);
        }
      });
    }

    // Google Sign In Buttons Setup
    document.querySelectorAll('.google-auth-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerGoogleLogin();
      });
    });

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

    // Edit Display Name handler
    const editDisplayNameBtn = document.getElementById('editDisplayNameBtn');
    if (editDisplayNameBtn) {
      editDisplayNameBtn.onclick = async () => {
        const currentName = currentUser.displayName || currentUser.username;
        const newName = prompt('แก้ไขชื่อแสดงผลของคุณ:', currentName);
        if (newName !== null && newName.trim() && newName.trim() !== currentName) {
          try {
            const updated = await ApiClient.updateProfile({ displayName: newName.trim() });
            this.updateUserUI(updated);
            if (this.onUserChanged) this.onUserChanged(updated);
            document.getElementById('profileName').textContent = updated.displayName;
          } catch (err) {
            alert('ไม่สามารถแก้ไขชื่อแสดงผลได้: ' + err.message);
          }
        }
      };
    }

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

    // On-time vs Late percentage calculation for completed tasks
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completedCount = completedTasks.length;

    let onTimeCount = 0;
    let lateCount = 0;

    completedTasks.forEach(t => {
      if (!t.dueDate) {
        onTimeCount++;
      } else {
        const due = new Date(t.dueDate + (t.dueTime ? 'T' + t.dueTime : 'T23:59:59'));
        const completedAt = t.completedAt ? new Date(t.completedAt) : new Date();
        if (completedAt <= due) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      }
    });

    let onTimePercent = 0;
    let latePercent = 0;

    if (completedCount > 0) {
      onTimePercent = Math.round((onTimeCount / completedCount) * 100);
      latePercent = 100 - onTimePercent;
    }

    // Update legend counters & text
    document.getElementById('profileRingPercent').textContent = onTimePercent + '%';
    const greenPercentEl = document.getElementById('profileGreenPercent');
    const greenCountEl = document.getElementById('profileGreenCount');
    const redPercentEl = document.getElementById('profileRedPercent');
    const redCountEl = document.getElementById('profileRedCount');

    if (greenPercentEl) greenPercentEl.textContent = onTimePercent + '%';
    if (greenCountEl) greenCountEl.textContent = onTimeCount;
    if (redPercentEl) redPercentEl.textContent = latePercent + '%';
    if (redCountEl) redCountEl.textContent = lateCount;

    // Update ring SVG strokes
    const circumference = 2 * Math.PI * 60; // r=60 (approx 376.99)
    const ringOnTime = document.getElementById('profileRingOnTime');
    const ringLate = document.getElementById('profileRingLate');

    if (ringOnTime && ringLate) {
      if (completedCount === 0) {
        ringOnTime.style.strokeDashoffset = circumference;
        ringLate.style.strokeDashoffset = circumference;
      } else {
        const onTimeOffset = circumference - (onTimePercent / 100) * circumference;
        const lateOffset = lateCount > 0 ? 0 : circumference;

        ringLate.style.strokeDashoffset = circumference;
        ringOnTime.style.strokeDashoffset = circumference;

        requestAnimationFrame(() => {
          setTimeout(() => {
            ringLate.style.strokeDashoffset = lateOffset;
            ringOnTime.style.strokeDashoffset = onTimeOffset;
          }, 100);
        });
      }
    }

    // Show modal
    profileModal.classList.add('active');

    // Interactive Avatar Drawer Toggle & Selection
    const profileAvatarWrapper = document.getElementById('profileAvatarWrapper');
    const profileAvatarDrawer = document.getElementById('profileAvatarDrawer');
    const profileModalAvatarPicker = document.getElementById('profileModalAvatarPicker');
    const btnUploadPhoto = document.getElementById('btnUploadPhoto');
    const customPhotoFileInput = document.getElementById('customPhotoFileInput');

    // Email & Google Binding Section
    const profileEmailInput = document.getElementById('profileEmailInput');
    const emailBindingStatus = document.getElementById('emailBindingStatus');
    const linkEmailForm = document.getElementById('linkEmailForm');

    if (profileEmailInput) {
      profileEmailInput.value = currentUser.email || '';
    }

    if (emailBindingStatus) {
      if (currentUser.email) {
        emailBindingStatus.innerHTML = `<span style="color: #10b981; font-weight: 600;">✓ ผูกอีเมลแล้ว: ${this.escapeHtml(currentUser.email)}</span> (เข้าสู่ระบบด้วย Google ได้ทันที)`;
      } else {
        emailBindingStatus.textContent = 'ผูกอีเมลเพื่อเข้าสู่ระบบด้วย Google กับบัญชีเดิมนี้ได้';
      }
    }

    if (linkEmailForm) {
      linkEmailForm.onsubmit = async (e) => {
        e.preventDefault();
        const inputEmail = document.getElementById('profileEmailInput').value.trim();
        if (!inputEmail) {
          alert('กรุณากรอกอีเมลที่ต้องการผูก');
          return;
        }

        try {
          const updated = await ApiClient.linkEmail(inputEmail);
          this.updateUserUI(updated);
          if (this.onUserChanged) this.onUserChanged(updated);
          if (emailBindingStatus) {
            emailBindingStatus.innerHTML = `<span style="color: #10b981; font-weight: 600;">✓ ผูกอีเมลเรียบร้อย: ${this.escapeHtml(updated.email)}</span>`;
          }
          alert(`ผูกอีเมล (${updated.email}) กับบัญชีเดิมเรียบร้อยแล้ว!\nคราวหน้าสามารถกดล้อคอินด้วย Google ได้เลยครับ`);
        } catch (err) {
          alert('ผูกอีเมลไม่สำเร็จ: ' + err.message);
        }
      };
    }

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

  async initGoogleAuth() {
    try {
      const config = await ApiClient.getConfig();
      this.googleClientId = config.googleClientId || window.GOOGLE_CLIENT_ID || '';

      if (this.googleClientId && window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: async (response) => {
            if (response && response.credential) {
              try {
                const loginData = await ApiClient.loginWithGoogle({
                  credential: response.credential
                });
                this.closeModal();
                this.checkAuthState();
                if (this.onUserChanged) this.onUserChanged(loginData.user);
                alert(`เข้าสู่ระบบด้วย Google สำเร็จ!\nยินดีต้อนรับ ${loginData.user.displayName}`);
              } catch (err) {
                alert('เข้าสู่ระบบด้วย Google ไม่สำเร็จ: ' + err.message);
              }
            }
          }
        });
      }
    } catch (e) {
      console.error('Failed to initialize Google Auth:', e);
    }
  }

  async triggerGoogleLogin() {
    // If Google Client ID is configured
    if (this.googleClientId) {
      this.openGoogleOAuthPopup();
      return;
    }

    // Show setup instruction alert if GOOGLE_CLIENT_ID is not configured in .env yet
    alert(
      "ยังไม่ได้ระบุ GOOGLE_CLIENT_ID ในไฟล์ .env\n\n" +
      "วิธีสร้าง Google Client ID:\n" +
      "1. เข้าไปยัง Google Cloud Console (console.cloud.google.com)\n" +
      "2. ไปที่ Credentials -> Create Credentials -> OAuth client ID\n" +
      "3. เลือก Web application\n" +
      "4. คัดลอก Client ID นำมาใส่ในไฟล์ .env ตัวอย่างเช่น:\n" +
      "   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com"
    );
  }

  openGoogleOAuthPopup() {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: this.googleClientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await userInfoRes.json();

              const loginData = await ApiClient.loginWithGoogle({
                googleId: profile.sub,
                email: profile.email,
                displayName: profile.name,
                avatar: profile.picture
              });

              this.closeModal();
              this.checkAuthState();
              if (this.onUserChanged) this.onUserChanged(loginData.user);
              alert(`เข้าสู่ระบบด้วย Google สำเร็จ!\nยินดีต้อนรับ ${loginData.user.displayName}`);
            } catch (err) {
              alert('เข้าสู่ระบบด้วย Google ไม่สำเร็จ: ' + err.message);
            }
          }
        }
      });
      client.requestAccessToken();
    } else {
      alert('ระบบ Google SDK ยังโหลดไม่เสร็จสิ้น กรุณาลองใหม่อีกครั้ง');
    }
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
