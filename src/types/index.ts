export type UserRole =
  | 'ADMIN'
  | 'INVENTORY_MANAGER'
  | 'PURCHASING_MANAGER'
  | 'SALES_MANAGER'
  | 'WAREHOUSE_OPERATOR'
  | 'ACCOUNTANT'
  | 'VIEWER'

export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
  readonly avatarUrl?: string
}

export interface AuthTenant {
  readonly id: string
  readonly slug: string
  readonly name: string
}

export interface LoginSuccessResponse {
  readonly requiresPasswordChange: false
  readonly token: string
  readonly user: User
  readonly tenant: AuthTenant
}

export interface LoginSetupResponse {
  readonly requiresPasswordChange: true
  readonly setupToken: string
}

export type LoginResponse = LoginSuccessResponse | LoginSetupResponse

export interface SetupPasswordResponse {
  readonly token: string
  readonly user: { readonly name: string }
  readonly tenant: AuthTenant
}

export type AuthErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'

export interface AuthApiError {
  readonly error: { readonly code: AuthErrorCode; readonly message: string }
}

export interface PlatformAdmin {
  readonly publicId: string
  readonly email: string
  readonly name: string
  readonly isActive: boolean
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

export interface Tenant {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly isActive: boolean
  readonly plan: string
  readonly createdAt: string
}

export interface CreateTenantBody {
  readonly tenant: { readonly name: string; readonly slug: string }
  readonly admin: { readonly email: string; readonly name: string }
}

export type TenantErrorCode =
  | 'UNAUTHORIZED'
  | 'TENANT_SLUG_TAKEN'
  | 'TENANT_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export interface BackendError {
  readonly error: { readonly code: TenantErrorCode; readonly message: string }
}
