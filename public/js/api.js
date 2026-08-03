class ApiClient {
  static get token() {
    return localStorage.getItem('todo_jwt_token');
  }

  static set token(value) {
    if (value) {
      localStorage.setItem('todo_jwt_token', value);
    } else {
      localStorage.removeItem('todo_jwt_token');
    }
  }

  static getCurrentUser() {
    const userStr = localStorage.getItem('todo_current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static setCurrentUser(user) {
    if (user) {
      localStorage.setItem('todo_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('todo_current_user');
    }
  }

  static getSavedAccounts() {
    try {
      const data = localStorage.getItem('todo_saved_accounts');
      const accounts = data ? JSON.parse(data) : {};
      // Ensure default demo account is saved
      if (!accounts['demo']) {
        accounts['demo'] = { username: 'demo', password: 'demo123', displayName: 'Demo User', avatar: 'icons/clean_avatar_boy.png?v=8' };
      }
      return accounts;
    } catch (e) {
      return { 'demo': { username: 'demo', password: 'demo123', displayName: 'Demo User', avatar: 'icons/clean_avatar_boy.png?v=8' } };
    }
  }

  static saveAccount(username, password, token, displayName, avatar) {
    const accounts = this.getSavedAccounts();
    accounts[username.toLowerCase()] = { username, password, token, displayName, avatar };
    localStorage.setItem('todo_saved_accounts', JSON.stringify(accounts));
  }

  static getSavedPassword(username) {
    const accounts = this.getSavedAccounts();
    const acc = accounts[username.toLowerCase()];
    return acc ? acc.password : null;
  }

  static isLoggedIn() {
    return !!this.token;
  }

  static logout() {
    this.token = null;
    this.setCurrentUser(null);
  }

  static async _fetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  static async getConfig() {
    try {
      return await this._fetch('/auth/config');
    } catch (e) {
      return { googleClientId: '' };
    }
  }

  static async register(username, displayName, password, avatar, email = null) {
    const res = await this._fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, displayName, password, avatar, email })
    });
    if (res.token) {
      this.token = res.token;
      this.setCurrentUser(res.user);
      this.saveAccount(username, password, res.token, res.user.displayName, res.user.avatar);
    }
    return res;
  }

  static async loginWithGoogle(googleData) {
    const data = await this._fetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData)
    });
    this.token = data.token;
    this.setCurrentUser(data.user);
    this.saveAccount(data.user.username, '', data.token, data.user.displayName, data.user.avatar);
    return data;
  }

  static async linkEmail(email, googleId = null) {
    const res = await this._fetch('/auth/link-email', {
      method: 'PUT',
      body: JSON.stringify({ email, googleId })
    });
    this.setCurrentUser(res);
    return res;
  }

  static async login(username, password) {
    const data = await this._fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.token = data.token;
    this.setCurrentUser(data.user);
    this.saveAccount(username, password, data.token, data.user.displayName, data.user.avatar);
    return data;
  }

  static async getMe() {
    return this._fetch('/auth/me');
  }

  static async updateProfile(avatar) {
    const res = await this._fetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ avatar })
    });
    this.setCurrentUser(res);
    
    // Sync updated avatar locally
    const accounts = this.getSavedAccounts();
    if (accounts[res.username.toLowerCase()]) {
      accounts[res.username.toLowerCase()].avatar = res.avatar;
      localStorage.setItem('todo_saved_accounts', JSON.stringify(accounts));
    }
    return res;
  }

  static async getUsers() {
    return this._fetch('/auth/users');
  }

  static async deleteAccount() {
    const res = await this._fetch('/auth/me', {
      method: 'DELETE'
    });
    this.logout();
    return res;
  }

  static async getTasks() {
    return this._fetch('/tasks');
  }

  static async addTask(taskData) {
    return this._fetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  static async updateTask(taskId, data) {
    return this._fetch(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async toggleTaskStatus(taskId) {
    return this._fetch(`/tasks/${taskId}/toggle`, {
      method: 'PATCH'
    });
  }

  static async deleteTask(taskId) {
    return this._fetch(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
  }
}
