<script setup>
import { useTheme } from 'vuetify'
import { onMounted } from 'vue'
import { menuItems } from '@/mockData'

const { global } = useTheme()

onMounted(() => {
  const preloadStickers = () => {
    const loadImages = () => {
      menuItems.forEach(item => {
        if (item.animation && item.animation.length > 0) {
          const img = new Image()
          img.src = item.animation[0]
        }
      })
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadImages)
    } else {
      setTimeout(loadImages, 3000)
    }
  }

  preloadStickers()
})
</script>

<template>
  <VApp style="background:transparent; color:white">
    <RouterView />
  </VApp>
</template>
//done
