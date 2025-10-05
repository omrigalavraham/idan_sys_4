interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
}

interface UsersResponse {
  users: User[];
  total: number;
}

export const usersService = {
  async getAllUsers(
    limit = 50,
    offset = 0,
    role?: string
  ): Promise<UsersResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (role) {
      params.append('role', role);
    }

    const response = await fetch(`/api/users?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return await response.json();
  },

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await this.getAllUsers(50, 0, role);
    return response.users;
  },

  async getAgents(): Promise<User[]> {
    return await this.getUsersByRole('agent');
  },

  async getManagers(): Promise<User[]> {
    return await this.getUsersByRole('manager');
  },

  async getAllActiveUsers(): Promise<User[]> {
    const response = await this.getAllUsers(100, 0);
    return response.users;
  },
};

export type { User };
