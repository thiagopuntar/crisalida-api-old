const routes = [
  {
    path: "/login",
    component: () => import("layouts/LoginLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/Login.vue"),
        meta: { public: true },
        name: "login"
      }
    ]
  },
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    // Rotas da aplicação logada!!!
    children: [
      {
        path: "/home",
        component: () => import("pages/Index.vue"),
        name: "home",
        title: "Início",
        icon: "home"
      },
      {
        path: "/orders",
        component: () => import("pages/OrderList.vue"),
        name: "orders",
        title: "Pedidos",
        icon: "list",
        children: [
          {
            path: "new",
            component: () => import("pages/OrderForm.vue"),
            name: "newOrder",
            children: [
              {
                path: "newCustomer/:customerName",
                component: () => import("pages/CustomerForm.vue"),
                name: "newOrderNewCustomer",
                props: true
              },
              {
                path: "customers/:id",
                component: () => import("pages/CustomerForm.vue"),
                name: "newOrderEditCustomer"
              },
              {
                path: "newProduct/:productName",
                component: () => import("pages/ProductForm.vue"),
                name: "newOrderNewProduct",
                props: true
              }
            ]
          },
          {
            path: ":orderId",
            component: () => import("pages/OrderForm.vue"),
            name: "editOrder",
            children: [
              {
                path: "newCustomer/:customerName",
                component: () => import("pages/CustomerForm.vue"),
                name: "orderNewCustomer",
                props: true
              },
              {
                path: "customers/:id",
                component: () => import("pages/CustomerForm.vue"),
                name: "orderEditCustomer"
              },
              {
                path: "newProduct/:productName",
                component: () => import("pages/ProductForm.vue"),
                name: "orderNewProduct",
                props: true
              }
            ]
          }
        ]
      },
      {
        path: "/customers",
        component: () => import("pages/CustomerList.vue"),
        name: "customers",
        title: "Clientes",
        icon: "contacts",
        children: [
          {
            path: "new",
            component: () => import("pages/CustomerForm.vue"),
            name: "newCustomer"
          },
          {
            path: ":id",
            component: () => import("pages/CustomerForm.vue"),
            name: "editCustomer"
          }
        ]
      },
      {
        path: "/products",
        component: () => import("pages/ProductList.vue"),
        name: "products",
        title: "Produtos",
        icon: "kitchen",
        children: [
          {
            path: "new",
            component: () => import("pages/ProductForm.vue"),
            name: "newProduct",
            props: true,
            children: [
              {
                path: "newProduct/:productName",
                component: () => import("pages/ProductForm.vue"),
                name: "newProductNewProduct",
                props: true
              },
              {
                path: "editProduct/:productName",
                component: () => import("pages/ProductForm.vue"),
                name: "newProductEditProduct",
                props: true
              }
            ]
          },
          {
            path: ":id",
            component: () => import("pages/ProductForm.vue"),
            name: "editProduct",
            children: [
              {
                path: "newProduct/:productName",
                component: () => import("pages/ProductForm.vue"),
                name: "editProductNewProduct",
                props: true
              },
              {
                path: "editProduct/:productName",
                component: () => import("pages/ProductForm.vue"),
                name: "editProductEditProduct",
                props: true
              }
            ]
          },
          {
            path: ":id/fichaTecnica",
            component: () => import("pages/ProductCompositionForm"),
            name: "compositionForm"
          }
        ]
      },
      {
        path: "/production",
        component: () => import("pages/ProductionForm.vue"),
        name: "production",
        title: "Azulejo Produção",
        icon: "business"
      },
      {
        path: "/ordersPick",
        component: () => import("pages/OrderPickForm.vue"),
        name: "orderPick",
        title: "Azulejo Pedidos",
        icon: "assignment"
      },
      {
        path: "/stock",
        component: () => import("pages/StockList.vue"),
        name: "stock",
        title: "Estoque",
        icon: "inventory"
      }
    ]
  }
];

// Always leave this as last one
if (process.env.MODE !== "ssr") {
  routes.push({
    path: "*",
    component: () => import("pages/Error404.vue")
  });
}

export default routes;
