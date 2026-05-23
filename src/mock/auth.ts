import type { ApiResponse, LoginResult, UserInfo } from '@/types'

/** Mock 用户数据库 */
const mockUsers: Array<{ username: string; password: string; info: UserInfo }> = [
  {
    username: 'admin',
    password: 'admin123',
    info: {
      id: 1,
      username: 'admin',
      nickname: '系统管理员',
      avatar: '',
      email: 'admin@health.com',
      phone: '13800001111',
      gender: 'male',
      age: 35,
      role: 'admin',
      createdAt: '2025-01-01',
    },
  },
  {
    username: 'zhangsan',
    password: '123456',
    info: {
      id: 2,
      username: 'zhangsan',
      nickname: '张三',
      avatar: '',
      email: 'zhangsan@example.com',
      phone: '13800002222',
      gender: 'male',
      age: 45,
      role: 'user',
      createdAt: '2025-03-15',
    },
  },
  {
    username: 'lisi',
    password: '123456',
    info: {
      id: 3,
      username: 'lisi',
      nickname: '李四',
      avatar: '',
      email: 'lisi@example.com',
      phone: '13800003333',
      gender: 'female',
      age: 52,
      role: 'user',
      createdAt: '2025-02-20',
    },
  },
]

/** 模拟登录 */
export function mockLogin(username: string, password: string): Promise<ApiResponse<LoginResult>> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find((u) => u.username === username && u.password === password)
      if (user) {
        resolve({
          code: 200,
          message: '登录成功',
          data: {
            token: 'mock_token_' + Date.now(),
            refreshToken: 'mock_refresh_' + Date.now(),
            userInfo: { ...user.info },
          },
        })
      } else {
        reject(new Error('用户名或密码错误'))
      }
    }, 800)
  })
}

/** 模拟获取当前用户信息 */
export function mockGetUserInfo(_token: string): Promise<ApiResponse<UserInfo>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 简单从 token 推断用户（实际应从 token 解析）
      const user = mockUsers[0]
      resolve({
        code: 200,
        message: 'ok',
        data: { ...user.info },
      })
    }, 300)
  })
}

/** 模拟登出 */
export function mockLogout(): Promise<ApiResponse<null>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ code: 200, message: 'ok', data: null })
    }, 200)
  })
}
