<script setup>
import { useTheme } from 'vuetify'



const { global } = useTheme()
</script>

<template>
  <VApp style="background:transparent; color:white">
    <RouterView />
  </VApp>
</template>
//done