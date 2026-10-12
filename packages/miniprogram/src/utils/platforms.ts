/** Deep Link schemes for popular grocery apps in China */
export const PLATFORM_SCHEMES: Record<string, { name: string; webFallback: string }> = {
  dingdong: {
    name: '叮咚买菜',
    webFallback: 'https://m.ddxq.mobi/search?keyword=',
  },
  meituan: {
    name: '美团买菜',
    webFallback: 'https://maimai.meituan.com/search?q=',
  },
  hema: {
    name: '盒马',
    webFallback: 'https://h5.hema.com/search?q=',
  },
}
