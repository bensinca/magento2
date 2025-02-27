<template>
  <div id="category">
    <CmsContent
      v-if="isShowCms"
      :content="cmsContent"
    />
    <CategoryBreadcrumbs />
    <SkeletonLoader
      v-if="!activeCategoryName"
      height="57px"
      width="200px"
      margin="0"
    />
    <SfHeading
      v-else
      :level="2"
      :title="activeCategoryName"
      class="category-title"
    />
    <div class="category-layout">
      <div class="sidebar column">
        <CategoryFilters
          v-if="isShowProducts"
          class="mobile-only"
          :is-visible="isFilterSidebarOpen"
          :cat-uid="routeData.uid"
          @close="toggleFilterSidebar"
          @reloadProducts="onReloadProducts"
        />
      </div>
      <div
        ref="productContainerElement"
        class="main section column"
      >
        <CategoryNavbar
          v-if="isShowProducts"
          :sort-by="sortBy"
          :pagination="pagination"
          :is-loading="$fetchState.pending"
          @reloadProducts="onReloadProducts"
        />
        <div class="products">
          <CategoryEmptyResults v-if="products.length === 0 && !$fetchState.pending && isShowProducts" />

          <CategoryProductGrid
            v-if="isCategoryGridView"
            :products="products"
            :prices-loaded="isPriceLoaded"
            :loading="$fetchState.pending"
            @click:wishlist="addItemToWishlist"
            @click:add-to-cart="addItemToCart"
          />

          <CategoryProductList
            v-else
            :products="products"
            :prices-loaded="isPriceLoaded"
            :loading="$fetchState.pending"
            @click:wishlist="addItemToWishlist"
            @click:add-to-cart="addItemToCart"
          />
          <div
            v-if="!$fetchState.pending"
            class="products__display-opt"
          >
            <LazyHydrate on-interaction>
              <CategoryPagination
                v-show="pagination.totalPages > 1"
                :current="pagination.currentPage"
                :total="pagination.totalPages"
                :visible="5"
                class="products__pagination"
                @click="goToPage($event)"
              />
            </LazyHydrate>

            <div
              v-show="pagination.totalPages > 1"
              class="products__show-on-page"
            >
              <span class="products__show-on-page__label">{{
                $t('Show')
              }}</span>
              <LazyHydrate on-interaction>
                <SfSelect
                  :value="pagination.itemsPerPage.toString()"
                  class="products__items-per-page"
                  @input="doChangeItemsPerPage"
                >
                  <SfSelectOption
                    v-for="option in pagination.pageOptions"
                    :key="option"
                    :value="option"
                    class="products__items-per-page__option"
                  >
                    {{ option }}
                  </SfSelectOption>
                </SfSelect>
              </LazyHydrate>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import LazyHydrate from 'vue-lazy-hydration';
import {
  SfSelect,
  SfHeading,
} from '@storefront-ui/vue';
import {
  computed,
  defineComponent, onMounted, ref, ssrRef, useFetch,
} from '@nuxtjs/composition-api';
import { CacheTagPrefix, useCache } from '@vue-storefront/cache';
import SkeletonLoader from '~/components/SkeletonLoader/index.vue';
import CategoryPagination from '~/modules/catalog/category/components/pagination/CategoryPagination.vue';
import {
  useFacet,
  useUiHelpers,
  useUiState,
} from '~/composables';

import { useAddToCart } from '~/helpers/cart/addToCart';
import { useUrlResolver } from '~/composables/useUrlResolver';
import { useWishlist } from '~/modules/wishlist/composables/useWishlist';
import { usePrice } from '~/modules/catalog/pricing/usePrice';
import { useCategoryContent } from '~/modules/catalog/category/components/cms/useCategoryContent';
import { useTraverseCategory } from '~/modules/catalog/category/helpers/useTraverseCategory';
import facetGetters from '~/modules/catalog/category/getters/facetGetters';

import CategoryNavbar from '~/modules/catalog/category/components/navbar/CategoryNavbar.vue';
import CategoryBreadcrumbs from '~/modules/catalog/category/components/breadcrumbs/CategoryBreadcrumbs.vue';
import { isCategoryTreeRoute } from '~/modules/GraphQL/CategoryTreeRouteTypeguard';

import type { ProductInterface, CategoryTree } from '~/modules/GraphQL/types';
import type { SortingModel } from '~/modules/catalog/category/composables/useFacet/sortingOptions';
import type { Pagination } from '~/composables/types';
import type { Product } from '~/modules/catalog/product/types';

export default defineComponent({
  name: 'CategoryPage',
  components: {
    CategoryPagination,
    CategoryEmptyResults: () => import('~/modules/catalog/category/components/CategoryEmptyResults.vue'),
    CategoryFilters: () => import('~/modules/catalog/category/components/filters/CategoryFilters.vue'),
    CmsContent: () => import('~/modules/catalog/category/components/cms/CmsContent.vue'),
    CategoryProductGrid: () => import('~/modules/catalog/category/components/views/CategoryProductGrid.vue'),
    CategoryProductList: () => import('~/modules/catalog/category/components/views/CategoryProductList.vue'),
    CategoryNavbar,
    CategoryBreadcrumbs,
    SfSelect,
    LazyHydrate,
    SfHeading,
    SkeletonLoader,
  },
  transition: 'fade',
  setup() {
    const { getContentData } = useCategoryContent();
    const { addTags } = useCache();
    const uiHelpers = useUiHelpers();
    const cmsContent = ref('');
    const isShowCms = ref(false);
    const isShowProducts = ref(false);
    const products = ssrRef<ProductInterface[]>([]);
    const sortBy = ref<SortingModel>({ selected: '', options: [] });
    const pagination = ref<Pagination>({});

    const productContainerElement = ref<HTMLElement | null>(null);

    const { search: resolveUrl } = useUrlResolver();
    const {
      toggleFilterSidebar,
      changeToCategoryListView,
      changeToCategoryGridView,
      isCategoryGridView,
      isFilterSidebarOpen,
    } = useUiState();
    const {
      addItem: addItemToWishlistBase,
      isInWishlist,
      removeItem: removeItemFromWishlist,
    } = useWishlist();
    const { result, search } = useFacet();
    const { addItemToCart } = useAddToCart();

    const addItemToWishlist = async (product: Product) => {
      await (isInWishlist({ product })
        ? removeItemFromWishlist({ product })
        : addItemToWishlistBase({ product }));
    };

    const { activeCategory, loadCategoryTree } = useTraverseCategory();
    const activeCategoryName = computed(() => activeCategory.value?.name ?? '');
    const routeData = ref<CategoryTree | null>(null);

    const { fetch } = useFetch(async () => {
      if (!activeCategory.value) {
        loadCategoryTree();
      }
      const resolvedUrl = await resolveUrl();
      if (isCategoryTreeRoute(resolvedUrl)) routeData.value = resolvedUrl;

      const categoryUid = routeData.value?.uid;

      const [content] = await Promise.all([
        getContentData(routeData.value?.uid),
        search({ ...uiHelpers.getFacetsFromURL(), category_uid: categoryUid }),
      ]);

      cmsContent.value = content?.cmsBlock?.content ?? '';
      isShowCms.value = content.isShowCms;
      isShowProducts.value = content.isShowProducts;

      products.value = facetGetters.getProducts(result.value) ?? [];
      sortBy.value = facetGetters.getSortOptions(result.value);
      pagination.value = facetGetters.getPagination(result.value);

      const tags = [{ prefix: CacheTagPrefix.View, value: 'category' }];
      const productTags = products.value.map((product) => ({
        prefix: CacheTagPrefix.Product,
        value: product.uid,
      }));

      addTags([...tags, ...productTags]);
    });

    const isPriceLoaded = ref(false);
    onMounted(async () => {
      const { getPricesBySku } = usePrice();
      if (products.value.length > 0) {
        const skus = products.value.map((item) => item.sku);
        const priceData = await getPricesBySku(skus, pagination.value.itemsPerPage);
        products.value = products.value.map((product) => ({
          ...product,
          price_range: priceData.items.find((item) => item.sku === product.sku)?.price_range,
        }));
      }
      isPriceLoaded.value = true;
    });

    const goToPage = (page: number) => {
      uiHelpers.changePage(page, false);
      fetch();
    };

    const doChangeItemsPerPage = (itemsPerPage: number) => {
      uiHelpers.changeItemsPerPage(itemsPerPage, false);
      goToPage(0);
    };

    const onReloadProducts = () => {
      goToPage(0);
      productContainerElement.value.scrollIntoView();
    };

    return {
      isPriceLoaded,
      ...uiHelpers,
      toggleFilterSidebar,
      isCategoryGridView,
      changeToCategoryListView,
      changeToCategoryGridView,
      isFilterSidebarOpen,
      addItemToCart,
      addItemToWishlist,
      pagination,
      products,
      sortBy,
      isShowCms,
      isShowProducts,
      cmsContent,
      activeCategoryName,
      routeData,
      doChangeItemsPerPage,
      productContainerElement,
      onReloadProducts,
      goToPage,
    };
  },
});
</script>

<style lang="scss" scoped>
#category {
  box-sizing: border-box;

  @include for-desktop {
    max-width: 1240px;
    margin: 0 auto;
  }
}
.category-layout {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  @include for-mobile {
    flex-direction: column;
  }

  .column {
    display: flex;
    flex-direction: column;
    flex: 1;

    @include for-mobile {
      flex: auto;
    }

    &.sidebar {
      max-width: 20%;
    }
  }
}

.main {
  &.section {
    padding: 0;

    @include for-mobile {
      $padding: var(--spacer-xs);
      padding: $padding;
      width: calc(100% - 2 * $padding);
    }
  }
}

.main {
  display: flex;
}

.category-title  {
  margin-left: var(--spacer-sm);
  text-align: left;
}

.sidebar {
  flex: 0 0 15%;
  padding: 0 0 0 var(--spacer-sm);
  border: 1px solid var(--c-light);
  border-width: 0 1px 0 0;
}

.sidebar-filters {
  --overlay-z-index: 3;
  --sidebar-title-display: none;
  --sidebar-top-padding: 0;

  @include for-desktop {
    --sidebar-content-padding: 0 var(--spacer-xl);
    --sidebar-bottom-padding: 0 var(--spacer-xl);
  }
}

.products {
  box-sizing: border-box;
  flex: 1;
  margin: 0;

  @include for-desktop {
    &__pagination {
      display: flex;
      justify-content: flex-start;
      margin: var(--spacer-xl) 0 0 0;
    }
  }

  @include for-mobile {
    &__display-opt {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }

    &__show-on-page {
      margin-top: 12px;
    }
  }

  &__show-on-page {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;

    &__label {
      font-family: var(--font-family--secondary);
      font-size: var(--font-size--sm);
    }
  }
}

::v-deep .sf-sidebar__aside {
  --sidebar-z-index: 3;
}
</style>
