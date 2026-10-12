// ─── 共享类型定义 ──────────────────────────────────────────────────────────────

export interface Recipe {
  id: string
  name: string
  imageUrl?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  cookTime: number       // 分钟
  servings: number
  flavorTags: string[]
  categoryTags: string[]
  seasonTags: string[]
  steps: RecipeStep[]
  ingredients: RecipeIngredient[]
  // 库存驱动推荐的元数据
  pantryMatchRate?: number  // 0-1，库存食材命中率
  pantryStatus?: 'CAN_COOK' | 'PARTIAL' | 'NEED_SHOPPING'
  missingIngredientCount?: number
}

export interface RecipeStep {
  order: number
  description: string
  imageUrl?: string
}

export interface RecipeIngredient {
  ingredientName: string
  quantity?: number
  unit?: string
  isOptional: boolean
  ingredientType: 'MAIN' | 'SEASONING' | 'GARNISH'
  // 库存状态
  inPantry?: boolean
  pantryQuantity?: number
}

export interface Family {
  id: string
  name: string
  memberCount: number
  hasElder: boolean
  hasChildren: boolean
  cookingLevel: 'SIMPLE' | 'MEDIUM' | 'ADVANCED'
  flavorTags: string[]
  restrictions: FamilyRestriction[]
}

export interface FamilyRestriction {
  restrictionType: 'ALLERGY' | 'RELIGION' | 'DISLIKE'
  ingredientName: string
}

export interface ShoppingItem {
  name: string
  quantity?: number
  unit?: string
  checked: boolean
  isFromPantry: boolean   // true = 家中已有，默认不需购买
  pantryQuantity?: number // 库存现有量
  neededQuantity?: number // 菜谱需要量
  isStaple?: boolean      // 是否为常备品
}

export interface PantryItem {
  id: string
  ingredientName: string
  quantity?: number
  unit?: string
  isStaple: boolean
  isDepleted: boolean
  source: 'PHOTO_AI' | 'MANUAL' | 'BARCODE'
  expiryDate?: string
  lastUpdated: string
}

export interface DailyMenu {
  id: string
  menuDate: string
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER'
  isConfirmed: boolean
  items: DailyMenuItem[]
}

export interface DailyMenuItem {
  recipeId: string
  recipe: Recipe
  isLocked: boolean
  order: number
}
