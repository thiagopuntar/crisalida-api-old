<template>
  <q-page padding>
    <div class="flex row q-col-gutter-md">
      <div v-for="item of stock" :key="item.id" class="col-12 col-md-6">
        <q-card>
          <q-card-section class="flex row justify-between">
            <div>
              <div>{{ item.name }}</div>
              <div>{{ item.stockQty }}</div>
            </div>
            <div>
              <q-btn color="primary" icon="edit" size="sm" round />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import StockService from "../services/StockService";

export default {
  name: "StockList",
  data() {
    return {
      stock: [],
      stockService: new StockService(),
    };
  },

  created() {
    this.stockService.listProductsStock().then((stock) => (this.stock = stock));
  },
};
</script>
