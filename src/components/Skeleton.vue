<script setup>
const props = defineProps(["count"])
</script>

<template>
  <tbody>
    <tr class="skeleton__list">
      <td
        v-for="n in props.count || 1"
        class="px-2"
      >
        <div class="skeleton__list__item" />
      </td>
    </tr>
  </tbody>
</template>

<style scoped lang="scss">
@mixin skeleton {
  border-radius: 5px;
  height: 40px;
  animation: Skeleton-loading 1s linear infinite alternate;

  @keyframes Skeleton-loading {
    0% {
      background-color: hsl(200, 20%, 70%);
    }

    100% {
      background-color: hsl(200, 20%, 95%);
    }
  }
}
.skeleton__list {
  &__item {
    @include skeleton;
  }
}
</style>
//done