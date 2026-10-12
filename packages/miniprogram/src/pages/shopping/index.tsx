import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Button, Popup, Empty } from '@nutui/nutui-taro'
import Taro from '@tarojs/taro'
import { useMenuStore } from '../../store/menuStore'
import { PLATFORM_SCHEMES } from '../../utils/platforms'
import './index.scss'

export default function ShoppingPage() {
  const { shoppingList, toggleShoppingItem } = useMenuStore()
  const [showPlatforms, setShowPlatforms] = useState(false)

  const uncheckedItems = shoppingList.filter((i) => !i.isFromPantry && !i.checked)
  const pantryItems = shoppingList.filter((i) => i.isFromPantry)
  const checkedItems = shoppingList.filter((i) => !i.isFromPantry && i.checked)

  const handleCopy = () => {
    const text = uncheckedItems
      .map((i) => `${i.name} ${i.quantity ?? ''}${i.unit ?? ''}`)
      .join('\n')
    Taro.setClipboardData({ data: text })
    Taro.showToast({ title: '已复制购物清单', icon: 'success' })
  }

  const handleJump = (platform: string) => {
    const scheme = PLATFORM_SCHEMES[platform]
    Taro.showToast({ title: `正在跳转${scheme.name}`, icon: 'none' })
    // TODO: 逐个食材跳转搜索
    setShowPlatforms(false)
  }

  if (shoppingList.length === 0) {
    return (
      <View className='shopping-page'>
        <Empty description='还没有购物清单，先去首页选菜吧 🍳' />
        <Button type='primary' onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
          去选菜
        </Button>
      </View>
    )
  }

  return (
    <View className='shopping-page'>
      <ScrollView scrollY className='list-scroll'>
        {/* 需要购买 */}
        <View className='section'>
          <Text className='section-title'>🛒 需要购买 ({uncheckedItems.length}种)</Text>
          {uncheckedItems.map((item) => (
            <View key={item.name} className='item' onClick={() => toggleShoppingItem(item.name)}>
              <View className='item-check'></View>
              <View className='item-info'>
                <Text className='item-name'>{item.name}</Text>
                {item.quantity && (
                  <Text className='item-qty'>{item.quantity}{item.unit}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* 家中已有 */}
        {pantryItems.length > 0 && (
          <View className='section section-pantry'>
            <Text className='section-title'>✅ 家中已有 ({pantryItems.length}种)</Text>
            {pantryItems.map((item) => (
              <View key={item.name} className='item item-pantry'>
                <Text className='check-icon'>✅</Text>
                <View className='item-info'>
                  <Text className='item-name pantry-name'>{item.name}</Text>
                  {item.isStaple && <Text className='item-tag'>常备品</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='bottom-bar'>
        <Button type='default' className='copy-btn' onClick={handleCopy}>
          📋 复制清单
        </Button>
        <Button
          type='primary'
          className='jump-btn'
          onClick={() => setShowPlatforms(true)}
        >
          🛒 去买菜
        </Button>
      </View>

      {/* 平台选择弹窗 */}
      <Popup visible={showPlatforms} position='bottom' onClose={() => setShowPlatforms(false)}>
        <View className='platform-popup'>
          <Text className='popup-title'>选择买菜平台</Text>
          {Object.keys(PLATFORM_SCHEMES).map((key) => (
            <Button key={key} block className='platform-btn' onClick={() => handleJump(key)}>
              {PLATFORM_SCHEMES[key].name}
            </Button>
          ))}
        </View>
      </Popup>
    </View>
  )
}
