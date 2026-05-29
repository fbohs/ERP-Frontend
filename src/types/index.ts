export type UserRole =
  | 'ADMIN'
  | 'MERCHANT'
  | 'PRODUCT_VERIFIER'
  | 'CONTENT_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'PURCHASING_MANAGER'
  | 'SALES_MANAGER'
  | 'WAREHOUSE_OPERATOR'
  | 'REPORT_VIEWER'

export interface User {
  readonly id: string
  readonly name: string
  readonly email?: string
  readonly role: UserRole
  readonly avatarUrl?: string
}

export interface AuthTenant {
  readonly id: string
  readonly slug: string
  readonly name: string
}

// Token is set as httpOnly cookie by the route handler — never returned to the client.
export interface LoginSuccessResponse {
  readonly requiresPasswordChange: false
  readonly user: User
  readonly tenant: AuthTenant
}

export interface LoginSetupResponse {
  readonly requiresPasswordChange: true
  readonly setupToken: string
}

export type LoginResponse = LoginSuccessResponse | LoginSetupResponse

// Token is set as httpOnly cookie by the route handler — never returned to the client.
export interface SetupPasswordResponse {
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

export interface VariantView {
  readonly id: string
  readonly sku: string
  readonly listPrice: string
  readonly compareAtPrice: string | null
  readonly standardCost: string | null
  readonly isActive: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export interface MediaView {
  readonly s3Key: string
  readonly url: string
  readonly altText: string | null
  readonly isPrimary: boolean
  readonly sortOrder: number
}

export interface ProductListView {
  readonly id: string
  readonly sku: string
  readonly name: string
  readonly slug: string
  readonly description: string | null
  readonly type: 'GOODS' | 'SERVICE'
  readonly status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  readonly categoryId: string
  readonly uomCode: string
  readonly tags: readonly string[]
  readonly hsnCode: string | null
  readonly isPublished: boolean
  readonly isSuspendedByOperator?: boolean
  readonly verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ProductView extends ProductListView {
  readonly variants: readonly VariantView[]
  readonly media: readonly MediaView[]
}

export interface ListProductsResponse {
  readonly products: readonly ProductListView[]
}

export interface CreateProductBody {
  readonly name: string
  readonly sku: string
  readonly categoryId: string
  readonly uomCode: string
  readonly listPrice: string
  readonly slug?: string
  readonly description?: string | null
  readonly type?: 'GOODS' | 'SERVICE'
  readonly tags?: readonly string[]
  readonly hsnCode?: string | null
  readonly variantSku?: string
  readonly compareAtPrice?: string | null
}

export interface UpdateProductBody {
  readonly name?: string
  readonly sku?: string
  readonly description?: string | null
  readonly type?: 'GOODS' | 'SERVICE'
  readonly tags?: readonly string[]
  readonly categoryId?: string
  readonly uomCode?: string
  readonly status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  readonly hsnCode?: string | null
}

export interface PresignResponse {
  readonly s3Key: string
  readonly uploadUrl: string
  readonly expiresAt: string
}

export interface ConfirmImagesBody {
  readonly images: {
    readonly primary?: { readonly s3Key: string; readonly altText?: string | null }
    readonly others?: ReadonlyArray<{ readonly s3Key: string; readonly altText?: string | null }>
  }
}

export type ProductErrorCode =
  | 'PRODUCT_SKU_EXISTS'
  | 'PRODUCT_SLUG_EXISTS'
  | 'VARIANT_SKU_EXISTS'
  | 'INVALID_CATEGORY'
  | 'INVALID_UOM'
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_IMAGE_PRIMARY_REQUIRED'
  | 'PRODUCT_IMAGE_KEY_MISMATCH'
  | 'PRODUCT_IMAGE_NOT_UPLOADED'
  | 'PRODUCT_IMAGE_TOO_LARGE'
  | 'PRODUCT_IMAGE_NOT_FOUND'
  | 'PRODUCT_IMAGE_REORDER_MISMATCH'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'

export interface ProductApiError {
  readonly error: { readonly code: ProductErrorCode; readonly message: string }
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

// ── Tenant user management ────────────────────────────────────────────────────

export interface MerchantSpecs {
  readonly merchant: {
    readonly businessName: string
    readonly registrationNumber: string
    readonly address: string
    readonly phoneNumber: string
    readonly website?: string
  }
}

export interface VerifierSpecs {
  readonly verifier: {
    readonly badgeId: string
    readonly certificationLevel: 'JUNIOR' | 'SENIOR' | 'LEAD'
    readonly specializations: readonly string[]
    readonly certifiedUntil: string
  }
}

export interface TenantUser {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: UserRole
  readonly isActive: boolean
  readonly specs: MerchantSpecs | VerifierSpecs | null
  readonly createdAt: string
}

export type CreateUserBody =
  | { readonly role: 'MERCHANT'; readonly email: string; readonly name: string; readonly specs: MerchantSpecs }
  | { readonly role: 'PRODUCT_VERIFIER'; readonly email: string; readonly name: string; readonly specs: VerifierSpecs }
  | {
      readonly role: Exclude<UserRole, 'ADMIN' | 'MERCHANT' | 'PRODUCT_VERIFIER'>
      readonly email: string
      readonly name: string
      readonly specs: null
    }

export type UserErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CANNOT_MODIFY_SELF'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_TAKEN'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export interface UserApiError {
  readonly error: { readonly code: UserErrorCode; readonly message: string }
}

// ── Categories ────────────────────────────────────────────────────────────────

export interface Category {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description: string | null
  readonly parentId: string | null
  readonly isActive: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ListCategoriesResponse {
  readonly categories: readonly Category[]
}

export interface CreateCategoryBody {
  readonly name: string
  readonly slug: string
  readonly description: string | null
  readonly parentId: string | null
}

export interface UpdateCategoryBody {
  name?: string
  slug?: string
  description?: string | null
  parentId?: string | null
  isActive?: boolean
}

export type CategoryErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_SLUG_EXISTS'
  | 'CIRCULAR_CATEGORY_REFERENCE'
  | 'CATEGORY_HAS_PRODUCTS'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export interface CategoryApiError {
  readonly error: { readonly code: CategoryErrorCode; readonly message: string }
}

// ── Role labels ───────────────────────────────────────────────────────────────

export const ROLE_LABELS: Readonly<Record<UserRole, string>> = {
  ADMIN: 'Admin',
  MERCHANT: 'Merchant',
  PRODUCT_VERIFIER: 'Product Verifier',
  CONTENT_MANAGER: 'Content Manager',
  INVENTORY_MANAGER: 'Inventory Manager',
  PURCHASING_MANAGER: 'Purchasing Manager',
  SALES_MANAGER: 'Sales Manager',
  WAREHOUSE_OPERATOR: 'Warehouse Operator',
  REPORT_VIEWER: 'Report Viewer',
}
