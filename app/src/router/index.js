import Vue from "vue";
import VueRouter from "vue-router";

import routes from "./routes";

Vue.use(VueRouter);

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation
 */

export default function({ store }) {
  const Router = new VueRouter({
    scrollBehavior: () => ({ x: 0, y: 0 }),
    routes,

    // Leave these as is and change from quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    mode: process.env.VUE_ROUTER_MODE,
    base: process.env.VUE_ROUTER_BASE
  });

  Router.beforeEach((to, from, next) => {
    const isPublic = to.matched.some(x => x.meta.public);
    const isLogged = store.getters["auth/isAuthenticated"];

    if (!isPublic && !isLogged) {
      next({ path: "/login" });
    } else {
      next();
    }
  });

  return Router;
}
