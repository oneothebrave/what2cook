import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import { Button, Tag } from '@nutui/nutui-taro'
import type { Recipe } from '../../types'
import './index.scss'

interface RecipeCardProps {
  recipe: Recipe
  isLocked: boolean
  onRefresh: () => void
  onLock: () => void
  onPress: () => void
}

const DIFFICULTY_LABELS = { EASY: '简单', MEDIUM: '中等', HARD: '复杂' }
const PANTRY_STATUS_CONFIG = {
  CAN_COOK:        { label: '✅ 今日可做', color: '#4caf50' },
  PARTIAL:         { label: `🛒 需补充食材`, color: '#ff9800' },
  NEED_SHOPPING:   { label: '🛒 需购买', color: '#f44336' },
}

export default function RecipeCard({ recipe, isLocked, onRefresh, onLock, onPress }: RecipeCardProps) {
  const pantryConfig = recipe.pantryStatus ? PANTRY_STATUS_CONFIG[recipe.pantryStatus] : null

  return (
    <View className={`recipe-card ${isLocked ? 'locked' : ''}`} onClick={onPress}>
      {/* 菜品图片 */}
      <View className='card-image-wrapper'>
        <Image
          className='card-image'
          src={recipe.imageUrl ?? '/assets/images/placeholder.png'}
          mode='aspectFill'
        />
        {/* 库存状态标签 */}
        {pantryConfig && (
          <View className='pantry-badge' style={{ backgroundColor: pantryConfig.color }}>
            <Text className='pantry-badge-text'>{pantryConfig.label}</Text>
            {recipe.missingIngredientCount ? (
              <Text className='pantry-badge-text'> ({recipe.missingIngredientCount}种)</Text>
            ) : null}
          </View>
        )}
        {/* 锁定图标 */}
        {isLocked && <View className='lock-overlay'>🔒</View>}
      </View>

      {/* 菜品信息 */}
      <View className='card-body'>
        <Text className='recipe-name'>{recipe.name}</Text>
        <View className='recipe-meta'>
          <Text className='meta-item'>⏱ {recipe.cookTime}分钟</Text>
          <Text className='meta-item'>👨‍🍳 {DIFFICULTY_LABELS[recipe.difficulty]}</Text>
          <Text className='meta-item'>🍽 {recipe.servings}人份</Text>
        </View>
        <View className='flavor-tags'>
          {recipe.flavorTags.slice(0, 3).map((tag) => (
            <Tag key={tag} type='default' className='flavor-tag'>{tag}</Tag>
          ))}
        </View>
      </View>

      {/* 操作按钮 */}
      <View className='card-actions' onClick={(e) => e.stopPropagation()}>
        <Button size='small' type='default' onClick={onLock}>
          {isLocked ? '🔓 解锁' : '🔒 锁定'}
        </Button>
        <Button size='small' type='default' onClick={onRefresh} disabled={isLocked}>
          🔄 换一道
        </Button>
      </View>
    </View>
  )
}
