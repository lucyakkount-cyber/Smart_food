<script setup>
import axios from "@/axios"
import { requiredValidator } from "@/plugins/validators"
import { watch, nextTick } from "vue"


const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(["update:id", "fetchDatas"])

const isValid = ref(false)
const formRef = ref()

const formData = ref({
  name: "",
  address: "",
  phone_number: "",
})

const isLoading = ref("fetchData")

const fetchDataById = async () => {
  try {
    isLoading.value = "fetchData"

    const response = await axios.get(`/api/products/${props.id}/`)

    const {
      data: { supplier },
    } = response

    formData.value.name = supplier.name
    formData.value.address = supplier.address
    formData.value.phone_number = supplier.phone_number
  } catch (error) {
    console.error(erro)
  } finally {
    isLoading.value = ""
  }
}

const onSubmit = async () => {
  if (!isValid.value) return
  try {
    isLoading.value = "submit"

    await axios.put(`/suppliers/${props.id}`, formData.value)

    emit("fetchDatas")
    handleModelUpdate(0)
  } catch (error) {
    console.error(erro)
  } finally {
    isLoading.value = ""
  }
}

const handleModelUpdate = val => {
  emit("update:id", val)

  if (val === false) {
    nextTick(() => {
      formRef.value?.reset()
      formRef.value?.resetValidation()
    })
  }
}

watch(
  () => props.id,
  newVal => {
    console.log(newVal)
    if (newVal) {
      fetchDataById()
    }
  },
)
</script>

<template>
  <VNavigationDrawer
    :model-value="!!props.id"
    location="end"
    style="width: 400px"
  >
    <VCard class="h-100">
      <VRow class="py-6 px-3 align-center">
        <VCardTitle> Edit </VCardTitle>
        <VSpacer />
        <VBtn
          variant="text"
          icon="bx-x"
          @click="handleModelUpdate(0)"
        />
        <VDivider />
      </VRow>
      <VForm
        v-if="isLoading !== 'fetchData'"
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
            <VTextField
              v-model="formData.address"
              label="Address"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="formData.phone_number"
              label="Phone Number"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol
            cols="12"
            class="d-flex gap-2"
          >
            <VBtn
              type="submit"
              :loading="isLoading === 'submit'"
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
      <VRow
        v-else
        class="justify-center align-center h-100"
      >
        <VProgressCircular
          indeterminate
          :size="44"
          :width="4"
        />
      </VRow>
    </VCard>
  </VNavigationDrawer>
</template>

<style lang="scss">
.custom-loader_color .v-btn__loader > div {
  color: white !important;
}
</style>
//done