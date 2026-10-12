import React, { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { Button } from '@nutui/nutui-taro'
import Taro from '@tarojs/taro'
import { useMenuStore } from '../../store/menuStore'
import * as api from '../../services/api'
import './index.scss'

interface AiResultItem {
  name: string
  quantity: number
  unit: string
  confidence: number
  selected: boolean
}

export default function PantryPage() {
  const { pantryItems, fetchPantry, updatePantryItem } = useMenuStore()
  const [scanning, setScanning] = useState(false)
  const [aiResults, setAiResults] = useState<AiResultItem[]>([])
  const [scanLogId, setScanLogId] = useState<string>('')
  const [showAiResult, setShowAiResult] = useState(false)

  useEffect(() => {
    fetchPantry()
  }, [])

  /** 拍照 → AI 识别 */
  const handleScanPhoto = async () => {
    try {
      const { tempFilePaths } = await Taro.chooseImage({
        count: 1,
        sourceType: ['camera', 'album'],
      })
      setScanning(true)
      Taro.showLoading({ title: 'AI识别中...' })
      const { items, scanLogId } = await api.analyzePantryPhoto(tempFilePaths[0])
      setAiResults(items.map((i) => ({ ...i, selected: i.confidence > 0.7 })))
      setScanLogId(scanLogId)
      setShowAiResult(true)
    } catch (err) {
      Taro.showToast({ title: '识别失败，请重试', icon: 'error' })
    } finally {
      setScanning(false)
      Taro.hideLoading()
    }
  }

  /** 确认AI识别结果，批量入库 */
  const handleConfirmScan = async () => {
    const selected = aiResults.filter((i) => i.selected)
    await api.confirmPantryItems({
      scanLogId,
      confirmedItems: selected.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
    })
    setShowAiResult(false)
    fetchPantry()
    Taro.showToast({ title: `已添加${selected.length}种食材`, icon: 'success' })
  }

  const staples = pantryItems.filter((i) => i.isStaple)
  const nonStaples = pantryItems.filter((i) => !i.isStaple)

  return (
    <View className='pantry-page'>
      {/* 扫描按钮区 */}
      <View className='scan-section'>
        <Button type='primary' loading={scanning} onClick={handleScanPhoto}>
          📸 拍照识别食材
        </Button>
        <Text className='scan-hint'>拍摄冰箱或橱柜，AI自动识别食材</Text>
      </View>

      {/* AI识别结果 */}
      {showAiResult && (
        <View className='ai-result'>
          <Text className='ai-result-title'>识别结果（请确认）</Text>
          {aiResults.map((item, idx) => (
            <View
              key={item.name}
              className={`ai-item ${item.selected ? 'selected' : ''}`}
              onClick={() => {
                const next = [...aiResults]
                next[idx].selected = !next[idx].selected
                setAiResults(next)
              }}
            >
              <Text>{item.selected ? '✅' : '⬜'} {item.name}</Text>
              <Text className='ai-qty'>{item.quantity}{item.unit}</Text>
              <Text className='confidence'>置信度 {Math.round(item.confidence * 100)}%</Text>
            </View>
          ))}
          <Button type='primary' block onClick={handleConfirmScan}>
            确认入库 ({aiResults.filter((i) => i.selected).length}种)
          </Button>
        </View>
      )}

      {/* 常备品 */}
      <View className='section'>
        <Text className='section-title'>🧂 常备调味料</Text>
        {staples.map((item) => (
          <View key={item.ingredientName} className='pantry-item'>
            <Text className='item-name'>{item.ingredientName}</Text>
            <Text
              className={`item-status ${item.isDepleted ? 'depleted' : 'ok'}`}
              onClick={() => updatePantryItem({ ingredientName: item.ingredientName, isDepleted: !item.isDepleted })}
            >
              {item.isDepleted ? '已用完 (点击恢复)' : '有库存'}
            </Text>
          </View>
        ))}
      </View>

      {/* 普通食材 */}
      <View className='section'>
        <Text className='section-title'>🥬 冰箱食材</Text>
        {nonStaples.length === 0 ? (
          <Text className='empty-hint'>还没有录入食材，去拍张冰箱照片吧</Text>
        ) : (
          nonStaples.map((item) => (
            <View key={item.ingredientName} className='pantry-item'>
              <Text className='item-name'>{item.ingredientName}</Text>
              <Text className='item-qty'>{item.quantity}{item.unit}</Text>
              {item.expiryDate && (
                <Text className='item-expiry'>到期: {item.expiryDate}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  )
}
