import Taro from '@tarojs/taro'
import type { Recipe, Family, ShoppingItem, PantryItem } from '../types'

const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'
  : 'https://your-production-domain.com/api' // TODO: 替换为生产域名

// ─── HTTP 工具 ────────────────────────────────────────────────────────────────

async function request<T>(url: string, options: Taro.request.Option = {}): Promise<T> {
  const token = Taro.getStorageSync('token')
  const res = await Taro.request({
    url: `${BASE_URL}${url}`,
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  if (res.statusCode >= 400) {
    throw new Error(`API Error ${res.statusCode}: ${JSON.stringify(res.data)}`)
  }
  return res.data as T
}

// ─── 认证 ─────────────────────────────────────────────────────────────────────

export async function loginWithWechat(): Promise<{ token: string }> {
  const { code } = await Taro.login()
  return request('/auth/login', {
    method: 'POST',
    data: { code },
  })
}

// ─── 家庭 ─────────────────────────────────────────────────────────────────────

export async function getFamily(): Promise<Family> {
  return request('/family')
}

export async function updateFamily(data: Partial<Family>): Promise<Family> {
  return request('/family', { method: 'PUT', data })
}

// ─── 菜单推荐 ─────────────────────────────────────────────────────────────────

export async function getMenuRecommendation(params: {
  count?: number
  lockedIds?: string[]
  excludeIds?: string[]
}): Promise<Recipe[]> {
  return request('/menus/recommend', {
    method: 'POST',
    data: params,
  })
}

export async function confirmMenu(recipeIds: string[]): Promise<{ menuId: string }> {
  return request('/menus/confirm', {
    method: 'POST',
    data: { recipeIds },
  })
}

// ─── 购物清单 ─────────────────────────────────────────────────────────────────

export async function generateShoppingList(params: {
  recipeIds: string[]
}): Promise<ShoppingItem[]> {
  return request('/shopping/generate', {
    method: 'POST',
    data: params,
  })
}

// ─── 菜谱 ─────────────────────────────────────────────────────────────────────

export async function getRecipes(params?: {
  search?: string
  tags?: string[]
  page?: number
}): Promise<{ recipes: Recipe[]; total: number }> {
  return request(`/recipes?${new URLSearchParams(params as any).toString()}`)
}

export async function getRecipeDetail(id: string): Promise<Recipe> {
  return request(`/recipes/${id}`)
}

// ─── 库存（Pantry）────────────────────────────────────────────────────────────

export async function getPantryItems(): Promise<PantryItem[]> {
  return request('/pantry')
}

export async function updatePantryItem(
  item: Partial<PantryItem> & { ingredientName: string }
): Promise<PantryItem> {
  return request('/pantry', { method: 'POST', data: item })
}

export async function deletePantryItem(ingredientName: string): Promise<void> {
  return request(`/pantry/${encodeURIComponent(ingredientName)}`, { method: 'DELETE' })
}

/** 上传冰箱/橱柜照片，让AI识别食材 */
export async function analyzePantryPhoto(filePath: string): Promise<{
  items: Array<{ name: string; quantity: number; unit: string; confidence: number }>
  scanLogId: string
}> {
  // 先上传图片到COS
  const uploadRes = await Taro.uploadFile({
    url: `${BASE_URL}/pantry/upload`,
    filePath,
    name: 'photo',
  })
  const { photoUrl, scanLogId, items } = JSON.parse(uploadRes.data)
  return { items, scanLogId }
}

/** 用户确认AI识别结果后，批量入库 */
export async function confirmPantryItems(params: {
  scanLogId: string
  confirmedItems: Array<{ name: string; quantity: number; unit: string }>
}): Promise<PantryItem[]> {
  return request('/pantry/confirm-scan', { method: 'POST', data: params })
}
