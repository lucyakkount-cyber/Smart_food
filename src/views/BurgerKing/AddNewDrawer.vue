<script setup>
import axios from "@/axios"
import { requiredValidator } from "@/plugins/validators"
import { nextTick, onMounted } from "vue"
import Cafe from '/public/js/telegram'

const props = defineProps({
  isDrawerVisible: {
    type: Boolean,
    required: true,
  },
})


const emit = defineEmits(["update:isDrawerVisible", "fetchData"])

const isValid = ref(false)
const formRef = ref()
const categoryRef = ref()

const formData = ref({
  name: "",
  image: "",
  animation: "",
  category: [],
  special_offer: 1,
  price: '',
})

const categoryName = ref('')
const isCategoryModalOpen = ref(false)
const isLoading = ref(false)
const isLoaded = ref(false)
const isUpdating = ref(false)
const selectedCategories = ref([]) // This should store selected category objects
const people = ref([]) // This stores category data

const formatData = () => {
  const rawValue = formData.value.price.toString().replace(/[^0-9]/g, "")

  formData.value.price = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

const onSubmit = async () => {
  if (!isValid.value) return

  try {
    isLoading.value = true

    const form = new FormData()

    form.append('name', formData.value.name)
    form.append('image', formData.value.image[0] ?? '')
    form.append('animation', formData.value.animation[0] ?? '')
    form.append('description', formData.value.description)
    form.append('special_offer', formData.value.special_offer)
    form.append('price', formData.value.price.replace(/ /g, ''))

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
      Cafe.showStatus('Product created successfully', true)
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
      formData.value = { name: "", image: null, animation: null, category: [] }
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
      }))
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
  } finally {
    isUpdating.value = false
  }
}

const handelReset = () =>{
  categoryRef.value.resetValidation()
  categoryName.value = ''
  isCategoryModalOpen.value = false
}

const handleCategory = async () => {
  try {
    isLoaded.value = true

    const response = await axios.post('api/categories/', {
      name: categoryName.value,
      status: true,
    }, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.status === 201){
      Cafe.showStatus('Category created successfully', true)
      isCategoryModalOpen.value = false
      categoryName.value = ''
      handleFetch()
    }
  }
  catch (error){
    Cafe.showStatus('Muammo yuzaga keldi')
  }
  finally {
    isLoaded.value = false
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
    <VCard class="h-100 overflow-auto">
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
            />
          </VCol>
          <VCol cols="12">
            <VFileInput
              v-model="formData.animation"
              label="Animation"
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
                  :rules="[requiredValidator]"
                  append-icon="mdi-invoice-text-plus"
                  @click:append="isCategoryModalOpen = true"
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
              @click="handleModelUpdate"
            >
              Cancel
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCard>
    <VDialog v-model="isCategoryModalOpen">
      <VCard
        prepend-icon="mdi-invoice-text-plus"
        title="Create Category"
      >
        <VForm
          ref="categoryRef"
          @submit.prevent="handleCategory"
        >
          <VCardText>
            <VTextField
              v-model="categoryName"
              label="Category Name"
              placeholder="Enter category name"
              outlined
              dense
              :rules="[requiredValidator]"
            />
          </VCardText>

          <!-- Actions (buttons) -->
          <VCardActions>
            <VSpacer />
            <VBtn
              color="error"
              @click="handelReset"
            >
              Cancel
            </VBtn>
            <VBtn
              type="submit"
              :loading="isLoaded"
              class="custom-loader_color"
              color="primary"
            >
              Create
            </VBtn>
          </VCardActions>
        </VForm>
      </VCard>
    </VDialog>
  </VNavigationDrawer>
</template>

<style lang="scss">
.custom-loader_color .v-btn__loader > div {
  color: white !important;
}
</style>
