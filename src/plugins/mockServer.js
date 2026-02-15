import MockAdapter from 'axios-mock-adapter';
import axios from '@/axios';
import { menuItems } from '@/mockData';

// Helper to check for existing mock instance to avoid double-wrapping
if (!axios.defaults.adapter || axios.defaults.adapter.name !== 'mockAdapter') {
  const mock = new MockAdapter(axios, { delayResponse: 500 });
  
  // Initialize in-memory database
  let dbProducts = [...menuItems];

  // Extract unique categories for lookup
  const categoriesMap = new Map();
  menuItems.forEach(item => {
    if (item.categories && !categoriesMap.has(item.categories.id)) {
      categoriesMap.set(item.categories.id, item.categories);
    }
  });
  const categories = Array.from(categoriesMap.values());

  // --- CRUD Handlers ---

  // GET /api/products/
  mock.onGet(/^\/api\/products\/?$/).reply(200, dbProducts);

  // POST /api/products/
  mock.onPost(/^\/api\/products\/?$/).reply(config => {
    // handling FormData content mostly requires manual parsing in mock adapter if not using a browser environment that automatically handles it,
    // but axios-mock-adapter passes the data as is.
    // Since we are in a browser environment (Vue app), config.data will be the FormData object.

    // We need to parse FormData. Since we can't easily "read" FormData in a pure JS mock entry without some helpers,
    // and `axios-mock-adapter` might pass it differently depending on environment, we'll assume basic object usage or standard FormData methods.

    const data = {};
    if (config.data instanceof FormData) {
      config.data.forEach((value, key) => {
        // Handle array fields like category[]
        if (key.endsWith('[]')) {
          const cleanKey = key.slice(0, -2);
          if (!data[cleanKey]) data[cleanKey] = [];
          data[cleanKey].push(value);
        } else {
          data[key] = value;
        }
      });
    } else {
      // Fallback for JSON
      Object.assign(data, JSON.parse(config.data));
    }

    const newId = dbProducts.length > 0 ? Math.max(...dbProducts.map(p => p.id)) + 1 : 1;

    // Resolve category
    let categoryObj = { id: 0, name: 'Uncategorized' };
    let catId = data.category;
    if (Array.isArray(catId)) catId = catId[0]; // take first if array
    if (catId && categoriesMap.has(Number(catId))) {
      categoryObj = categoriesMap.get(Number(catId));
    }

    const newProduct = {
      id: newId,
      name: data.name || 'New Product',
      image: data.image instanceof File ? URL.createObjectURL(data.image) : (data.image || "/menu/img/Burger_148.png"), // Mock upload
      animation: data.animation instanceof File ? [URL.createObjectURL(data.animation)] : [],
      price: Number(data.price) || 0,
      description: data.description || '',
      categories: categoryObj,
      quantity: 1
    };

    dbProducts.push(newProduct);
    return [201, newProduct];
  });

  // DELETE /api/products/:id
  mock.onDelete(/\/api\/products\/\d+/).reply(config => {
    const id = Number(config.url.split('/').pop());
    dbProducts = dbProducts.filter(p => p.id !== id);
    return [200, { success: true }];
  });

  // PUT /api/products/:id
  mock.onPut(/\/api\/products\/\d+/).reply(() => {
    // similar parsing logic to POST
    // Implementation omitted for brevity as UI doesn't seem to use Edit yet,
    // but structure is here for future.
    return [200, { success: true }];
  });


  // Mock GET /api/categories/
  mock.onGet('/api/categories/').reply(200, categories);
  
  // Pass through other requests (optional, remove if you want ONLY mocks)
  mock.onAny().passThrough();
  
  console.log('Mock server initialized for /api/products/');
}
