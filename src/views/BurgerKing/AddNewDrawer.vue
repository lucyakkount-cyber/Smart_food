<script setup>
import axios from "@/axios";
import { requiredValidator } from "@/plugins/validators";
import { nextTick, onMounted } from "vue";
import Cafe from '/public/js/telegram'

const props = defineProps({
  isDrawerVisible: {
    type: Boolean,
    required: true,
  },
});


const emit = defineEmits(["update:isDrawerVisible", "fetchData"]);

const isValid = ref(false);
const formRef = ref();
const formData = ref({
  name: "",
  image: "",
  animation: "",
  category: [],
  special_offer: 1,
  price: ''
});
const isLoading = ref(false);
const isUpdating = ref(false);
const selectedCategories = ref([]); // This should store selected category objects
const people = ref([]); // This stores category data
const formatData = () => {
  const rawValue = formData.value.price.toString().replace(/\s+/g, "");
  formData.value.price = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const onSubmit = async () => {
  if (!isValid.value) return;

  try {
    isLoading.value = true;

    const form = new FormData();
    form.append('name', formData.value.name);
    form.append('image', formData.value.image[0]);
    form.append('animation', formData.value.animation[0]);
    form.append('description', formData.value.description);
    form.append('special_offer', formData.value.special_offer)
    form.append('price', formData.value.price.replace(/ /g, ''))

    if (Array.isArray(formData.value.category)) {
      formData.value.category.forEach((cat) => {
        form.append('category[]', cat);
      });
    } else {
      form.append('category', formData.value.category);
    }

    const response = await axios.post("/api/products/", form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 5000,
    });

    if (response.status === 201) {
      Cafe.showStatus('Product created successfully',true)
      emit("fetchData");
      handleModelUpdate(false);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleModelUpdate = (val) => {
  emit("update:isDrawerVisible", val);

  if (val === false) {
    nextTick(() => {
      formRef.value?.reset();
      formRef.value?.resetValidation();
      formData.value = { name: "", image: null, animation: null, category: [] };
      selectedCategories.value = [];
    });
  }
};

const handleFetch = async () => {
  try {
    isUpdating.value = true;
    const response = await axios.get("api/categories/"); // Adjust the endpoint as needed
    if (response?.data) {
      people.value = response.data.map((item) => ({
        id: item.id,
        name: item.name,
        avatar: item.image,
        group: item.group || "General",
      }));
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  } finally {
    isUpdating.value = false;
  }
};

onMounted(() => {
  handleFetch();
});
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
        <VBtn variant="text" icon="bx-x" @click="handleModelUpdate(false)" />
        <VDivider />
      </VRow>
      <VForm @submit.prevent="onSubmit" v-model="isValid" ref="formRef">
        <VRow class="px-3">
          <VCol cols="12">
            <VTextField
              label="Name"
              v-model="formData.name"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              label="Price"
              v-model="formData.price"
              :rules="[requiredValidator]"
              @input="formatData"
            />
          </VCol>

          <VCol cols="12">
            <VFileInput
              label="Image"
              v-model="formData.image"
              :rules="[requiredValidator]"
              accept="image/png"
            />
          </VCol>
          <VCol cols="12">
            <VFileInput
              label="Short video"
              v-model="formData.animation"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              label="Description"
              v-model="formData.description"
              :rules="[requiredValidator]"
            />
          </VCol>
          <VCol>
            <VRow>
              <v-col cols="12">
                <v-autocomplete
                  v-model="formData.category"
                  :items="people"
                  item-title="name"
                  item-value="id"
                  label="Select Category"
                  :rules="[requiredValidator]"
                />
              </v-col>
            </VRow>
          </VCol>
          <VCol cols="12" class="d-flex gap-2">
            <VBtn type="submit" :loading="isLoading" class="custom-loader_color">
              Submit
            </VBtn>
            <VBtn color="secondary" @click="handleModelUpdate(false)">
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
