import { PrismaClient, type Recipe, type Family, type PantryItem } from '@prisma/client'

const prisma = new PrismaClient()

interface RecommendParams {
  family: Family & { restrictions: Array<{ ingredientName: string }> }
  pantryItems: PantryItem[]
  count: number
  lockedIds: string[]
  excludeIds: string[]
}

interface ScoredRecipe {
  recipe: Recipe & { ingredients: Array<{ ingredientName: string; quantity: number | null; unit: string | null }> }
  score: number
  pantryMatchRate: number
  pantryStatus: 'CAN_COOK' | 'PARTIAL' | 'NEED_SHOPPING'
  missingIngredientCount: number
}

export class RecommendationEngine {
  /**
   * 核心推荐算法：规则引擎 v1.0
   * 综合口味匹配 + 库存命中 + 历史去重 + 时令 + 难度
   */
  async recommend(params: RecommendParams): Promise<ScoredRecipe[]> {
    const { family, pantryItems, count, lockedIds, excludeIds } = params

    // 1. 候选集过滤（硬规则）
    const restrictedIngredients = family.restrictions.map((r) => r.ingredientName)
    const candidates = await prisma.recipe.findMany({
      where: {
        isPublished: true,
        id: { notIn: [...excludeIds, ...lockedIds] },
        // 排除含禁忌食材的菜（通过tag粗过滤，精细过滤在评分阶段）
      },
      include: {
        ingredients: {
          select: { ingredientName: true, quantity: true, unit: true, ingredientType: true },
        },
      },
      take: 200, // 从候选池中取200道打分
    })

    // 精细过滤：排除含禁忌食材的菜
    const filtered = candidates.filter((recipe) =>
      !recipe.ingredients.some((ing) =>
        restrictedIngredients.some((r) => ing.ingredientName.includes(r))
      )
    )

    // 2. 评分层
    const pantryMap = new Map(pantryItems.map((p) => [p.ingredientName, p]))
    const currentSeason = this.getCurrentSeason()
    const isWeekday = [1, 2, 3, 4, 5].includes(new Date().getDay())

    const scored: ScoredRecipe[] = filtered.map((recipe) => {
      let score = 0

      // (a) 口味匹配度：35分
      const flavorMatch = recipe.flavorTags.filter((t) => family.flavorTags.includes(t)).length
      const flavorScore = recipe.flavorTags.length > 0
        ? (flavorMatch / recipe.flavorTags.length) * 35
        : 17.5
      score += flavorScore

      // (b) 库存食材匹配度：25分（新增核心逻辑）
      const mainIngredients = recipe.ingredients.filter((i) => i.ingredientType === 'MAIN')
      const matchedMainCount = mainIngredients.filter((ing) => {
        const pantryItem = pantryMap.get(ing.ingredientName)
        if (!pantryItem) return false
        if (pantryItem.isStaple && !pantryItem.isDepleted) return true
        if (!pantryItem.quantity || !ing.quantity) return true
        return pantryItem.quantity >= ing.quantity
      }).length
      const pantryMatchRate = mainIngredients.length > 0
        ? matchedMainCount / mainIngredients.length
        : 0
      score += pantryMatchRate * 25

      // (c) 时令加分：5分
      if (recipe.seasonTags.includes(currentSeason) || recipe.seasonTags.includes('全年')) {
        score += 5
      }

      // (d) 工作日快手菜加分：5分
      if (isWeekday && recipe.cookTime <= 30) {
        score += 5
      }

      // (e) 难度适配：15分
      const difficultyScores: Record<string, Record<string, number>> = {
        SIMPLE:   { EASY: 15, MEDIUM: 5,  HARD: 0  },
        MEDIUM:   { EASY: 10, MEDIUM: 15, HARD: 5  },
        ADVANCED: { EASY: 5,  MEDIUM: 10, HARD: 15 },
      }
      score += difficultyScores[family.cookingLevel]?.[recipe.difficulty] ?? 5

      // (f) 随机扰动（防止每次推荐完全一样）：±5分
      score += (Math.random() - 0.5) * 10

      // 计算库存状态
      const missingCount = mainIngredients.length - matchedMainCount
      const pantryStatus: ScoredRecipe['pantryStatus'] =
        pantryMatchRate === 1 ? 'CAN_COOK'
        : pantryMatchRate > 0 ? 'PARTIAL'
        : 'NEED_SHOPPING'

      return { recipe, score, pantryMatchRate, pantryStatus, missingIngredientCount: missingCount }
    })

    // 3. 多样性层：排序 + 荤素搭配
    scored.sort((a, b) => b.score - a.score)
    const selected = this.ensureDiversity(scored, count)

    return selected
  }

  /**
   * 多样性保证：确保荤素搭配，避免同一食材重复
   */
  private ensureDiversity(scored: ScoredRecipe[], count: number): ScoredRecipe[] {
    const result: ScoredRecipe[] = []
    const usedIngredients = new Set<string>()
    let hasVegetable = false
    let hasMeat = false

    for (const item of scored) {
      if (result.length >= count) break

      const isVegetable = item.recipe.categoryTags.includes('素')
      const isMeat = item.recipe.categoryTags.includes('荤')

      // 检查食材重复
      const mainIngredients = item.recipe.ingredients
        .filter((i) => i.ingredientType === 'MAIN')
        .map((i) => i.ingredientName)
      const hasOverlap = mainIngredients.some((i) => usedIngredients.has(i))
      if (hasOverlap && result.length > 0) continue

      // 如果已有足够道菜但荤素不均衡，优先补充缺失类型
      if (result.length === count - 1) {
        if (!hasVegetable && !isVegetable) continue
        if (!hasMeat && !isMeat) continue
      }

      result.push(item)
      mainIngredients.forEach((i) => usedIngredients.add(i))
      if (isVegetable) hasVegetable = true
      if (isMeat) hasMeat = true
    }

    // 若多样性约束导致数量不足，用最高分填充
    for (const item of scored) {
      if (result.length >= count) break
      if (!result.includes(item)) result.push(item)
    }

    return result
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5)  return '春'
    if (month >= 6 && month <= 8)  return '夏'
    if (month >= 9 && month <= 11) return '秋'
    return '冬'
  }
}
