<script setup>
import { ref, onMounted } from 'vue'
import axios from "@/axios" // Axios for API requests
import AddNewDrawer from "@/views/BurgerKing/AddNewDrawer.vue"
import Loading from "@/pages/loading.vue"
import Cafe from "/public/js/telegram"
import Telegram from "/public/js/telegram"

// Component state
const categories = ref([])
const input = ref('')
const isAddNewDrawerVisible = ref(false)
const orders = ref([])
const items = ref([])
const isLoading = ref(true)
const activeCategory = ref(null)
const userId = window.Telegram?.WebApp?.initDataUnsafe.user?.id
const token = new URL(window.location.href).searchParams.get("token")
const role = ref('admin')



const formatData = () => {
  const rawValue = input.value.toString().replace(/[^0-9]/g, "")

  input.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

// const loadUserInfo = async ()=>{
//   try {
//     const response = await axios.post(`/user/get_token/`, {
//       token: token,
//     }, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     })
//
//     loadCafeItems()
//     role.value = response.data.role
//   }catch (error){
//     Telegram?.WebApp?.showConfirm('Muamo yuzaga keldi iltimos qaytatdan urinib ko`ring', (ok=>{
//       if (ok) Telegram?.WebApp?.close()
//     }))
//
//     console.error(error)
//   }
// }

const loadCafeItems = async () => {
  if (role.value) {
    isLoading.value = true
    try {
      const response = await axios.get("/api/products/")

      orders.value = response.data

      const groupedItems = response.data.reduce((acc, item) => {
        const categoryId = item.categories.id
        if (!acc[categoryId]) {
          acc[categoryId] = { name: item.categories.name, items: [] }
        }
        acc[categoryId].items.push(item)

        return acc
      }, {})

      items.value = groupedItems
      isLoading.value = false

      setTimeout(() => {
        Cafe.init({
          apiUrl: import.meta.env.VITE_BASE_URL,
          mode: "menu",
          role: "user" ||role.value,
          userId: userId || Telegram?.WebApp?.initDataUnsafe?.user?.id,
          token: token,
        })
      }, 500)
    } catch (error) {
      console.error("Error loading cafe items:", error)
      isLoading.value = false
      Telegram.WebApp?.showConfirm("Muamo yuzaga keldi iltimos keyinroq urinib ko'ring.", conformed => {
        if (conformed) Telegram.WebApp.close()
        loadCafeItems()
      })
    }
  }else {
    loadUserInfo()
  }
}

const handleAddNewDrawer = () => {
  isAddNewDrawerVisible.value = true
  $("#myModal").hide()
}


const scrollToCategory = category => {
  const categoryElement = document.getElementById(category)
  if (categoryElement) {
    const navbarHeight = document.querySelector('.category-navbar').offsetHeight
    const offset = categoryElement.offsetTop - navbarHeight

    window.scrollTo({ top: offset, behavior: 'smooth' })
    activeCategory.value = category
  }
}


const updateActiveCategory = () => {
  const categoryElements = document.querySelectorAll(".category-header")
  const navbarHeight = document.querySelector('.category-navbar').offsetHeight
  let closestCategory = null
  let minDistance = Infinity

  categoryElements.forEach(category => {
    const rect = category.getBoundingClientRect()
    const distance = Math.abs(rect.top - navbarHeight)
    if (distance < minDistance) {
      minDistance = distance
      closestCategory = category.id
    }
  })

  if (closestCategory) {
    activeCategory.value = closestCategory
    scrollNavbarToActive()
  }
}

const scrollNavbarToActive = () => {
  const navbar = document.querySelector(".category-navbar")
  const activeButton = document.querySelector(".active-category")

  if (navbar && activeButton) {
    navbar.scrollTo({
      left: activeButton.offsetLeft - navbar.offsetWidth / 2 + activeButton.offsetWidth / 2,
      behavior: "smooth",
    })
  }
}



onMounted(() => {
  loadCafeItems()
  // loadUserInfo()
  window.addEventListener("scroll", updateActiveCategory)
})
</script>

<template>
  <section
    class="cafe-page cafe-items"
    style="margin-top: 60px;"
  >
    <!--   Navbar  -->


    <!--    Loader -->
    <div
      v-if="isLoading"
      class="load"
    >
      <Loading />
    </div>

    <VRow
      v-else-if="!isLoading && items"
      ref="categoryNavbar"
      class="d-flex flex-nowrap justify-start align-center category-navbar"
      no-gutters
    >
      <VBtn
        v-for="(category, categoryId) in items"
        :key="categoryId"
        class="ma-2"
        :class="{ 'active-category': activeCategory === categoryId }"
        :color="activeCategory === categoryId ? 'secondary' : 'primary'"
        size="small"
        @click="scrollToCategory(categoryId)"
      >
        {{ category.name }}
      </VBtn>
    </VRow>

    <VRow
      v-if="!Object.values(items).some(category => category.items.length) && !isLoading"
      class="d-flex justify-center align-center py-10"
    >
      <VCol
        cols="12"
        class="d-flex flex-column align-center text-center"
      >
        <VIcon
          color="grey lighten-2"
          size="48"
        >
          mdi-emoticon-sad-outline
        </VIcon> <!-- Icon for no data -->
        <span class="mt-4 text-h5 font-weight-bold text-grey darken-2">No Data Found</span>
        <span class="mt-2 text-body-2 text-grey darken-1">It seems we couldn't find anything that you requested.</span>

        <VBtn
          v-if="role !== 'admin'"
          class="mt-6"
          color="primary"
          style="height: 40px; border-radius: 20px"
          @click="handleAddNewDrawer"
        >
          <VIcon left>
            mdi-plus
          </VIcon> Add New Item
        </VBtn>
      </VCol>
    </VRow>

    <!--    Cafe items -->
    <div
      v-for="(category, categoryId) in items"
      :key="categoryId"
      class="cafe-items"
    >
      <div style="width: 100%">
        <h1
          :id="categoryId"
          class="category-header"
          style="margin: 0 10px 20px 0; width: 130px; color: #807f7f; line-height: 1.7"
        >
          {{ category.name }}
        </h1>
      </div>
      <div class="cafe-items">
        <div
          v-for="item in category.items"
          :key="item.id"
          class="cafe-item js-item"
          :data-item-id="item.id"
          :data-item-category="item.categories.id"
          :data-item-price="item.price"
          :data-item-description="item.description"
        >
          <div class="cafe-item-counter js-item-counter" />
          <div class="cafe-item-photo">
            <picture class="cafe-item-lottie js-item-lottie">
              <img
                :data-item-short="item.animation"
                :src="item.image || '/path/to/placeholder.jpg'"
                loading="lazy"
                :alt="item.name"
                @error="(event) => {event.target.src = '/img/imageNotFound.png'; }"
              >
            </picture>
          </div>
          <div class="cafe-item-label">
            <span class="cafe-item-title">{{ item.name }}</span>
            <span class="cafe-item-price">
              {{ parseFloat(item.price).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,') }} SUM
            </span>
          </div>
          <div class="cafe-item-buttons">
            <button class="cafe-item-decr-button js-item-decr-btn button-item ripple-handler">
              <span class="ripple-mask"><span class="ripple" /></span>
            </button>
            <button
              class="cafe-item-incr-button js-item-incr-btn button-item ripple-handler"
              style="background: #f8a917"
            >
              <span class="button-item-label">Qo'shish</span>
              <span class="ripple-mask"><span class="ripple" /></span>
            </button>
          </div>
        </div>


        <!--        for style idea of OTABEK 😁 -->
        <div
          class="cafe-item"
          style="width: 300px;height: 0"
        />
      </div>
    </div>


    <div
      id="myModal"
      class="modal"
    >
      <div class="modal-content">
        <span class="edit-btn">Edit</span>
        <span
          data-item-btn="delete"
          class="action"
        >Delete</span>
        <VBtn
          style="height: 30px"
          @click="handleAddNewDrawer"
        >
          Add
        </VBtn>
      </div>
    </div>

    <div
      id="editDeleteModal"
      class="modal-window"
    >
      <div
        id="modalOverlay"
        class="modal-overlay"
      />
      <div class="modal-content">
        <span
          class="close-btn"
          style="position: absolute; right: 10px; text-align: center; display: flex;"
        >&times;</span>
        <div id="editDeleteForm">
          <div style="display: flex">
            <label for="item_img">
              <img
                id="itemImage"
                src=""
                alt="Item Image"
                style="max-width: 132px; height: auto;"
              >
            </label>
            <input
              id="item_img"
              type="file"
              style="display: none;"
              accept="image/png"
            >
            <label for="item_video">
              <img
                id="itemVideo"
                src=""
                alt="Video"
                style="max-width: 132px; height: auto;"
              >
            </label>
            <input
              id="item_video"
              type="file"
              style="display: none;"
              accept="image/"
            >
          </div>
          <div class="input-container">
            <div class="input-item">
              <label
                for="itemName"
                class="input-label"
              >Item Name:</label>
              <input
                id="itemName"
                type="text"
                name="itemName"
                autocomplete="off"
                class="input-field"
              >
            </div>
            <div class="input-item">
              <label
                for="itemPrice"
                class="input-label"
              >Item Price:</label>
              <input
                id="itemPrice"
                v-model="input"
                type="text"
                name="itemPrice"
                required="required"
                autocomplete="off"
                class="input-field"
                @input="formatData"
              >
            </div>
            <div class="input-item">
              <label class="input-label">Item description</label>
              <textarea
                class="cafe-text-field js-order-description-field cafe-block"
                rows="1"
                placeholder="Hech qandaqa ma'lumot yoq"
                style="overflow: hidden; overflow-wrap: break-word; height: 70px; border-radius: 6px; background: white; color: black"
              />
            </div>
          </div>

          <div class="modal-buttons">
            <button
              class="action action-edit"
              data-item-btn="edit"
            >
              <span
                class="spinner"
                style="display: none;"
              />
              Update
            </button>
          </div>
        </div>
      </div>
    </div>

    <!--    Create modal -->
    <AddNewDrawer
      v-model:isDrawerVisible="isAddNewDrawerVisible"
      @fetchData="loadCafeItems"
    />
  </section>


  <!--  Select menu for finish order -->
  <section class="cafe-page cafe-order-overview">
    <div class="cafe-block">
      <div class="cafe-order-header-wrap">
        <h2
          class="cafe-order-header"
          style="color: var(--tg-theme-text-color)"
        >
          Sizning buyurtmangiz
        </h2>
        <span
          class="cafe-order-edit js-order-edit"
          style="cursor: pointer"
        >Tahrirlash</span>
      </div>
      <div class="cafe-order-items">
        <div
          v-for="order in orders"
          :key="order.id"
          class="cafe-order-item js-order-item"
          :data-item-id="order.id"
        >
          <div class="cafe-order-item-photo">
            <picture class="cafe-item-lottie js-item-lottie">
              <img
                :src="order.image || '/path/to/placeholder.jpg'"
                loading="lazy"
                :alt="order.name"
                @error="(event) => { event.target.src = '/img/imageNotFound.png'; }"
              >
            </picture>
          </div>
          <div class="cafe-order-item-label">
            <div class="cafe-order-item-title">
              {{ order.name }} <span class="cafe-order-item-counter">
                <span class="js-order-item-counter">1</span>x</span>
            </div>
            <div class="cafe-order-item-description">
              {{ order.description }}
            </div>
          </div>
          <div>
              <div class="cafe-order-item-price js-order-item-price">
                {{ parseFloat(order.price).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,') }} <span> SUM</span>
            </div>
            <div
              class="cafe-item-buttons"
              data-v-98d31c1b=""
            >
              <button class="cafe-item-decr-button js-selected-item-decr  button-item ripple-handler">
                <span class="ripple-mask">
                  <span class="ripple" />
                </span>
              </button>
              <button
                class="cafe-item-incr-button js-selected-item-incr  button-item ripple-handler"
                style="background:#f8a917;"
              >
                <span class="button-item-label" />
                <span class="ripple-mask">
                  <span class="ripple" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="cafe-text-field-wrap">
      <label>
        <textarea
          class="cafe-text-field js-order-comment-field cafe-block"
          rows="1"
          placeholder="Izoh qo'shish..."
          style="overflow: hidden; overflow-wrap: break-word; height: 46px;"
        />
      </label>
      <div class="cafe-text-field-hint">
        Har qanday maxsus so'rovlar, tafsilotlar, oxirgi istaklar va boshqalar.
      </div>
    </div>
  </section>

  <!--  Alert -->
  <div class="cafe-status-wrap">
    <div class="cafe-status js-status" />
  </div>
</template>

<style scoped>
</style>
