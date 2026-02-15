




import '@vue/runtime-core'

export {}

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    CardStatisticsHorizontal: typeof import('./src/@core/components/cards/CardStatisticsHorizontal.vue')['default']
    CardStatisticsVertical: typeof import('./src/@core/components/cards/CardStatisticsVertical.vue')['default']
    CardStatisticsWithImages: typeof import('./src/@core/components/cards/CardStatisticsWithImages.vue')['default']
    MoreBtn: typeof import('./src/@core/components/MoreBtn.vue')['default']
    RouterLink: typeof import('vue-router')['RouterLink']
    RouterView: typeof import('vue-router')['RouterView']
    ThemeSwitcher: typeof import('./src/@core/components/ThemeSwitcher.vue')['default']
  }
}
//done