<script setup>
import axios from "@/axios"
import { requiredValidator } from "@/plugins/validators"
import { nextTick } from "vue"

const props = defineProps({
  isDrawerVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(["update:isDrawerVisible", "fetchDatas"])

const isValid = ref(false)
const formRef = ref()

const formData = ref({
  name: "",
  description: "",
})

const isLoading = ref(false)

const onSubmit = async () => {
  if (!isValid.value) return
  try {
    isLoading.value = true

    const response = await axios.post("/categories", formData.value)
    if (response.status === 201) {
      emit("fetchDatas")
      handleModelUpdate(false)
    }
  } catch (error) {
    console.error(erro)
  } finally {
    isLoading.value = false
  }
}

const handleModelUpdate = val => {
  emit("update:isDrawerVisible", val)

  if (val === false) {
    nextTick(() => {
      formRef.value?.reset()
      formRef.value?.resetValidation()
    })
  }
}
</script>

<template>
  <VNavigationDrawer
    :model-value="props.isDrawerVisible"
    location="end"
    style="width: 400px"
  >
    <VCard class="h-100">
      <VRow class="py-6 px-3 align-center">
        <VCardTitle> Create </VCardTitle>
        <VSpacer />
        <VBtn
          variant="text"
          icon="bx-x"
          @click="handleModelUpdate(false)"
        />
        <VDivider />
      </VRow>
      <VForm
        ref="formRef"
        v-model="isValid"
        @submit.prevent="onSubmit"
      >
        <VRow class="px-3">
          <VCol cols="12">
            <VTextField
              v-model="formData.name"
              label="Name"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="formData.description"
              label="Description"
              :rules="[requiredValidator]"
              rows="3"
            />
          </VCol>
          
          <VCol
            cols="12"
            class="d-flex gap-2"
          >
            <VBtn
              type="submit"
              :loading="isLoading"
              class="custom-loader_color"
            >
              Submit
            </VBtn>
            <VBtn
              color="secondary"
              @click="handleModelUpdate(false)"
            >
              Cancel
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCard>
  </VNavigationDrawer>
</template>

<style lang="scss">
.custom-loader_color .v-btn__loader > div {
  color: white !important;
}
</style>
