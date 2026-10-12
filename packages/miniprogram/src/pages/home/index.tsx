import React, { useMemo, useState } from 'react'
import { View, Text, Image, ScrollView, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMenuStore } from '../../store/menuStore'
import type { ShoppingItem } from '../../types'
import './index.scss'

interface MockRecipe {
  id: string
  name: string
  imageUrl: string
  status: 'ready' | 'missing'
  statusText: string
  cookTime: number
  selected: boolean
  ingredients: ShoppingItem[]
}

const pantryItems = [
  { name: '番茄', amount: '2个' },
  { name: '鸡蛋', amount: '5个' },
  { name: '豆腐', amount: '1块' },
]

const recipePool: MockRecipe[] = [
  {
    id: 'tomato-egg',
    name: '番茄炒蛋',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Stir%20Fried%20Tomatoes%20with%20Scrambled%20Eggs.jpg',
    status: 'ready',
    statusText: '今日可做',
    cookTime: 30,
    selected: true,
    ingredients: [
      { name: '番茄', quantity: 2, unit: '个', checked: false, isFromPantry: true, pantryQuantity: 2, neededQuantity: 2 },
      { name: '鸡蛋', quantity: 3, unit: '个', checked: false, isFromPantry: true, pantryQuantity: 5, neededQuantity: 3 },
      { name: '小葱', quantity: 2, unit: '根', checked: false, isFromPantry: false },
    ],
  },
  {
    id: 'broccoli',
    name: '清炒西兰花',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Stir-fried_broccoli.jpg',
    status: 'missing',
    statusText: '需购买 1 种',
    cookTime: 15,
    selected: true,
    ingredients: [
      { name: '西兰花', quantity: 1, unit: '颗', checked: false, isFromPantry: false },
      { name: '大蒜', quantity: 3, unit: '瓣', checked: false, isFromPantry: true, isStaple: true },
    ],
  },
  {
    id: 'winter-melon-soup',
    name: '冬瓜丸子汤',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/WintermelonSoup.jpg',
    status: 'missing',
    statusText: '需购买 2 种',
    cookTime: 35,
    selected: false,
    ingredients: [
      { name: '冬瓜', quantity: 500, unit: 'g', checked: false, isFromPantry: false },
      { name: '猪肉馅', quantity: 250, unit: 'g', checked: false, isFromPantry: false },
      { name: '生抽', checked: false, isFromPantry: true, isStaple: true },
    ],
  },
]

const replacementRecipes: MockRecipe[] = [
  {
    id: 'tofu',
    name: '家常烧豆腐',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=640&q=80',
    status: 'ready',
    statusText: '今日可做',
    cookTime: 20,
    selected: false,
    ingredients: [
      { name: '豆腐', quantity: 1, unit: '块', checked: false, isFromPantry: true, pantryQuantity: 1, neededQuantity: 1 },
      { name: '青椒', quantity: 1, unit: '个', checked: false, isFromPantry: false },
    ],
  },
  {
    id: 'pork',
    name: '青椒肉丝',
    imageUrl: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?auto=format&fit=crop&w=640&q=80',
    status: 'missing',
    statusText: '需购买 1 种',
    cookTime: 25,
    selected: false,
    ingredients: [
      { name: '猪肉', quantity: 300, unit: 'g', checked: false, isFromPantry: true, pantryQuantity: 300, neededQuantity: 300 },
      { name: '青椒', quantity: 2, unit: '个', checked: false, isFromPantry: false },
    ],
  },
]

function mergeShoppingItems(recipes: MockRecipe[]): ShoppingItem[] {
  const merged = new Map<string, ShoppingItem>()

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((item) => {
      const current = merged.get(item.name)
      if (current && current.unit === item.unit) {
        merged.set(item.name, {
          ...current,
          quantity: (current.quantity ?? 0) + (item.quantity ?? 0),
          neededQuantity: (current.neededQuantity ?? 0) + (item.neededQuantity ?? item.quantity ?? 0),
        })
        return
      }

      merged.set(item.name, { ...item })
    })
  })

  return Array.from(merged.values())
}

export default function HomePage() {
  const [usePantry, setUsePantry] = useState(true)
  const [recipes, setRecipes] = useState(recipePool)
  const [replacementIndex, setReplacementIndex] = useState(0)

  const selectedRecipes = useMemo(() => recipes.filter((recipe) => recipe.selected), [recipes])
  const shoppingItems = useMemo(() => mergeShoppingItems(selectedRecipes), [selectedRecipes])
  const missingCount = shoppingItems.filter((item) => !item.isFromPantry).length
  const totalCookTime = selectedRecipes.reduce((total, recipe) => total + recipe.cookTime, 0)

  const toggleRecipe = (id: string) => {
    setRecipes((current) =>
      current.map((recipe) =>
        recipe.id === id ? { ...recipe, selected: !recipe.selected } : recipe
      )
    )
  }

  const refreshRecipe = (id: string) => {
    const nextRecipe = replacementRecipes[replacementIndex % replacementRecipes.length]
    setReplacementIndex((index) => index + 1)
    setRecipes((current) =>
      current.map((recipe) =>
        recipe.id === id ? { ...nextRecipe, selected: recipe.selected } : recipe
      )
    )
  }

  const openSummary = () => {
    const missingText = shoppingItems
      .filter((item) => !item.isFromPantry)
      .map((item) => `${item.name}${item.quantity ? ` ${item.quantity}${item.unit ?? ''}` : ''}`)
      .join('、')

    Taro.showModal({
      title: `${selectedRecipes.length} 道菜概览`,
      content: missingText
        ? `需购买：${missingText}\n晚餐概览：蔬菜充足，适合工作日晚餐。`
        : '食材基本齐全。\n晚餐概览：搭配轻松，适合工作日晚餐。',
      showCancel: false,
      confirmText: '知道了',
    })
  }

  const generateShoppingList = () => {
    if (selectedRecipes.length === 0) {
      Taro.showToast({ title: '先选择要做的菜', icon: 'none' })
      return
    }

    useMenuStore.setState({ shoppingList: shoppingItems })
    Taro.navigateTo({ url: '/pages/shopping/index' })
  }

  return (
    <View className='home-page'>
      <ScrollView scrollY className='home-scroll'>
        <View className='pantry-card'>
          <View className='card-title-row'>
            <Text className='card-title'>家中库存</Text>
            <View className='switch-row'>
              <Text className='switch-label'>优先使用</Text>
              <Switch
                checked={usePantry}
                color='#2F8F5B'
                onChange={(event) => setUsePantry(event.detail.value)}
              />
            </View>
          </View>

          <View className='pantry-content'>
            <View className='pantry-chips'>
              {usePantry ? (
                <>
                  {pantryItems.map((item) => (
                    <View className='pantry-chip' key={item.name}>
                      <Text className='chip-name'>{item.name}</Text>
                      <Text className='chip-amount'>{item.amount}</Text>
                    </View>
                  ))}
                  <View className='pantry-chip pantry-more'>
                    <Text className='chip-name'>+12</Text>
                  </View>
                </>
              ) : (
                <Text className='pantry-off'>本次推荐不参考库存</Text>
              )}
            </View>
            <Text className='update-action'>更新</Text>
          </View>
        </View>

        <View className='recommend-section'>
          <View className='section-heading'>
            <Text className='section-title'>今晚建议</Text>
            <Text className='section-subtitle'>已按你家口味筛选</Text>
          </View>

          <View className='recipe-list'>
            {recipes.map((recipe) => (
              <View
                className={`recipe-row ${recipe.selected ? 'selected' : 'unselected'}`}
                key={recipe.id}
              >
                <View className='select-control' onClick={() => toggleRecipe(recipe.id)}>
                  <Text className='select-mark'>{recipe.selected ? '✓' : '○'}</Text>
                </View>

                <Image className='recipe-image' src={recipe.imageUrl} mode='aspectFill' />

                <View className='recipe-info' onClick={() => toggleRecipe(recipe.id)}>
                  <Text className='recipe-name'>{recipe.name}</Text>
                  <View className='recipe-meta'>
                    <Text className={`status-text ${recipe.status}`}>{recipe.statusText}</Text>
                    <Text className='dot'>·</Text>
                    <Text className='time-text'>{recipe.cookTime}分钟</Text>
                  </View>
                </View>

                <View className='refresh-action' onClick={() => refreshRecipe(recipe.id)}>
                  <Text>换一道</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className='summary-panel' onClick={openSummary}>
          <View>
            <Text className='summary-main'>
              {selectedRecipes.length} 道菜 · 还需购买 {missingCount} 种
            </Text>
            <Text className='summary-sub'>
              {selectedRecipes.length > 0 ? `约 ${totalCookTime} 分钟` : '请选择今晚要做的菜'}
            </Text>
          </View>
          <Text className='chevron'>›</Text>
        </View>

        <View className='bottom-spacer' />
      </ScrollView>

      <View className='fixed-action'>
        <View
          className={`primary-button ${selectedRecipes.length === 0 ? 'disabled' : ''}`}
          onClick={generateShoppingList}
        >
          <Text>生成购物清单</Text>
        </View>
      </View>
    </View>
  )
}
