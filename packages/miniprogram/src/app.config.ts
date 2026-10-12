export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/weekly/index',
    'pages/recipes/index',
    'pages/recipes/detail',
    'pages/shopping/index',
    'pages/pantry/index',
    'pages/profile/index',
    'pages/onboarding/index',
  ],
  tabBar: {
    color: '#999999',
    selectedColor: '#2F8F5B',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
      },
      {
        pagePath: 'pages/weekly/index',
        text: '周计划',
      },
      {
        pagePath: 'pages/recipes/index',
        text: '菜谱',
      },
      {
        pagePath: 'pages/shopping/index',
        text: '清单',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '今晚吃什么',
    navigationBarTextStyle: 'black',
  },
})
