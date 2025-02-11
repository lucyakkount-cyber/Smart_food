<script setup>
import axios from "@/axios"
import { requiredValidator } from "@/plugins/validators"
import { nextTick, onMounted } from "vue"

const props = defineProps({
  isDrawerVisible: {
    type: Boolean,
    required: true,
  },
})


const emit = defineEmits(["update:isDrawerVisible", "fetchData"])

const isValid = ref(false)
const formRef = ref()

const formData = ref({
  name: "",
  image: "",
  short_video: "",
  category: [],
  special_offer: 1,
  price: '',
})

const isLoading = ref(false)
const isUpdating = ref(false)
const selectedCategories = ref([]) // This should store selected category objects
const people = ref([]) // This stores category data

const formatData = () => {
  const rawValue = formData.value.price.toString().replace(/\s+/g, "")

  formData.value.price = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

const onSubmit = async () => {
  if (!isValid.value) return

  try {
    isLoading.value = true

    // Create a new FormData instance
    const form = new FormData()

    form.append('name', formData.value.name)
    form.append('image', formData.value.image[0])
    form.append('short_video', formData.value.short_video[0])
    form.append('description', formData.value.description)
    form.append('special_offer', formData.value.special_offer)
    form.append('price', formData.value.price.trim())

    if (Array.isArray(formData.value.category)) {
      formData.value.category.forEach(cat => {
        form.append('category[]', cat)
      })
    } else {
      form.append('category', formData.value.category)
    }

    const response = await axios.post("/api/products/", form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 5000,
    })

    if (response.status === 201) {
      emit("fetchData")
      handleModelUpdate(false)
    }
  } catch (error) {
    console.error("Error submitting form:", error)
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
      formData.value = { name: "", image: null, short_video: null, category: [] }
      selectedCategories.value = []
    })
  }
}

const handleFetch = async () => {
  try {
    isUpdating.value = true

    const response = await axios.get("api/categories/") // Adjust the endpoint as needed
    if (response?.data) {
      people.value = response.data.map(item => ({
        id: item.id,
        name: item.name,
        avatar: item.image,
        group: item.group || "General",
      }))
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
  } finally {
    isUpdating.value = false
  }
}

onMounted(() => {
  handleFetch()
})
</script>

<template>
  <VNavigationDrawer
    :model-value="props.isDrawerVisible"
    location="end"
    style="width: max-content"
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
            <VTextField
              v-model="formData.price"
              label="Price"
              :rules="[requiredValidator]"
              @input="formatData"
            />
          </VCol>

          <VCol cols="12">
            <VFileInput
              v-model="formData.image"
              label="Image"
              :rules="[requiredValidator]"
              accept="image/png"
            />
          </VCol>
          <VCol cols="12">
            <VFileInput
              v-model="formData.short_video"
              label="Short video"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="formData.description"
              label="Description"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol>
            <VRow>
              <VCol cols="12">
                <VAutocomplete
                  v-model="formData.category"
                  :items="people"
                  item-title="name"
                  item-value="id"
                  label="Select Category"
                />
              </VCol>
            </VRow>
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
