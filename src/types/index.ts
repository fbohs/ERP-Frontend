export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: 'MERCHANT' | 'ADMIN' | 'MANAGER' | 'VIEWER'
  readonly avatarUrl?: string
}

export interface Product {
  readonly id: string
  readonly name: string
  readonly sku: string
  readonly price: number
  readonly stock: number
  readonly category: string
  readonly status: 'active' | 'draft' | 'archived'
  readonly imageUrl?: string
  readonly createdAt: string
}

export interface Order {
  readonly id: string
  readonly orderNumber: string
  readonly customerId: string
  readonly customerName: string
  readonly status: OrderStatus
  readonly total: number
  readonly itemCount: number
  readonly createdAt: string
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Customer {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly phone?: string
  readonly orderCount: number
  readonly totalSpent: number
  readonly createdAt: string
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
  readonly totalPages: number
}

export interface ApiError {
  readonly message: string
  readonly code: string
  readonly status: number
}
