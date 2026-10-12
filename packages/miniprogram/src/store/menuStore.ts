import { create } from 'zustand'
import type { Recipe, Family, DailyMenu, ShoppingItem, PantryItem } from '../types'
import * as api from '../services/api'

interface MenuStore {
  // 家庭信息
  family: Family | null
  initFamily: () => Promise<void>

  // 今日推荐
  todayMenu: Recipe[]
  isLoadingMenu: boolean
  fetchTodayMenu: () => Promise<void>
  refreshOneRecipe: (index: number) => Promise<void>
  lockRecipe: (index: number) => void
  lockedIndexes: number[]

  // 购物清单
  shoppingList: ShoppingItem[]
  generateShoppingList: () => Promise<void>
  toggleShoppingItem: (name: string) => void

  // 库存
  pantryItems: PantryItem[]
  fetchPantry: () => Promise<void>
  updatePantryItem: (item: Partial<PantryItem> & { ingredientName: string }) => Promise<void>
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  family: null,
  todayMenu: [],
  isLoadingMenu: false,
  lockedIndexes: [],
  shoppingList: [],
  pantryItems: [],

  initFamily: async () => {
    try {
      const family = await api.getFamily()
      set({ family })
    } catch {
      // 未设置家庭信息，跳转到onboarding
    }
  },

  fetchTodayMenu: async () => {
    set({ isLoadingMenu: true })
    try {
      const { lockedIndexes, todayMenu } = get()
      const lockedIds = lockedIndexes.map((i) => todayMenu[i]?.id).filter(Boolean)
      const recipes = await api.getMenuRecommendation({ lockedIds })
      set({ todayMenu: recipes })
    } finally {
      set({ isLoadingMenu: false })
    }
  },

  refreshOneRecipe: async (index: number) => {
    const { todayMenu } = get()
    const excludeIds = todayMenu.map((r) => r.id)
    const [newRecipe] = await api.getMenuRecommendation({ count: 1, excludeIds })
    if (newRecipe) {
      const updated = [...todayMenu]
      updated[index] = newRecipe
      set({ todayMenu: updated })
    }
  },

  lockRecipe: (index: number) => {
    const { lockedIndexes } = get()
    const already = lockedIndexes.includes(index)
    set({
      lockedIndexes: already
        ? lockedIndexes.filter((i) => i !== index)
        : [...lockedIndexes, index],
    })
  },

  generateShoppingList: async () => {
    const { todayMenu } = get()
    const recipeIds = todayMenu.map((r) => r.id)
    const items = await api.generateShoppingList({ recipeIds })
    set({ shoppingList: items })
  },

  toggleShoppingItem: (name: string) => {
    set((state) => ({
      shoppingList: state.shoppingList.map((item) =>
        item.name === name ? { ...item, checked: !item.checked } : item
      ),
    }))
  },

  fetchPantry: async () => {
    const items = await api.getPantryItems()
    set({ pantryItems: items })
  },

  updatePantryItem: async (item) => {
    await api.updatePantryItem(item)
    await get().fetchPantry()
  },
}))
