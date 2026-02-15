<script setup>
import axios from '@/axios'


const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: false,
  },
  endpoint: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(["update:id", "fetchDatas"])

const onCancel = () => {
  emit("update:id", 0)
}

const onSubmit = async () => {
  try {
    const response = await axios.delete(`/${props.endpoint}/${props.id}`)
    if (response.status === 204) {
      emit("fetchDatas")
      onCancel()
    }
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <VDialog
    :model-value="!!props.id"
    width="400px"
    @update:model-value="onCancel"
  >
    <VCard class="py-6 px-4">
      <VRow class="justify-center">
        <VCol cols="auto">
          <h2>
            Do you want to delete
            <span class="text-error">{{ props.title ?? "" }}</span>?
          </h2>
        </VCol>
        <VCol cols="auto">
          <VBtn
            class="me-3"
            color="error"
            @click="onSubmit"
          >
            Delete
          </VBtn>
          <VBtn>Cancel</VBtn>
        </VCol>
      </VRow>
    </VCard>
  </VDialog>
</template>

<style lang="scss"></style>
//done