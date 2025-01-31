<script setup>
import { useTheme } from 'vuetify'
import { hexToRgb } from '@layouts/utils'



const { global } = useTheme()
</script>

<template>
  <VApp :style="`background:transparent; color:white`">
    <RouterView />
  </VApp>
</template>
