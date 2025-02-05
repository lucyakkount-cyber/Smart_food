import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: { name: "BurgerKing" } },
    {
      path: "/",
      component: () => import("../layouts/default.vue"),
      children: [
        {
          path: "public",
          name: "BurgerKing",
          component: () => import("../pages/BurgerKing.vue"),
        },
      ],
    },
    {
      path: "/",
      component: () => import("../layouts/blank.vue"),
      children: [
        {
          path: "/:pathMatch(.*)*",
          component: () => import("../pages/[...all].vue"),
        },
      ],
    },
  ],
});


export default router;


