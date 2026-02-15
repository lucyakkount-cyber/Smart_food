import MockAdapter from 'axios-mock-adapter';
import axios from '@/axios';
import { menuItems } from '@/mockData';


if (!axios.defaults.adapter || axios.defaults.adapter.name !== 'mockAdapter') {
  const mock = new MockAdapter(axios, { delayResponse: 500 });
  
  
  let dbProducts = [...menuItems];

  
  const categoriesMap = new Map();
  menuItems.forEach(item => {
    if (item.categories && !categoriesMap.has(item.categories.id)) {
      categoriesMap.set(item.categories.id, item.categories);
    }
  });
  const categories = Array.from(categoriesMap.values());

  

  
  mock.onGet(/^\/api\/products\/?$/).reply(200, dbProducts);

  
  mock.onPost(/^\/api\/products\/?$/).reply(config => {
    
    
    

    
    

    const data = {};
    if (config.data instanceof FormData) {
      config.data.forEach((value, key) => {
        
        if (key.endsWith('[]')) {
          const cleanKey = key.slice(0, -2);
          if (!data[cleanKey]) data[cleanKey] = [];
          data[cleanKey].push(value);
        } else {
          data[key] = value;
        }
      });
    } else {
      
      Object.assign(data, JSON.parse(config.data));
    }

    const newId = dbProducts.length > 0 ? Math.max(...dbProducts.map(p => p.id)) + 1 : 1;

    
    let categoryObj = { id: 0, name: 'Uncategorized' };
    let catId = data.category;
    if (Array.isArray(catId)) catId = catId[0]; 
    if (catId && categoriesMap.has(Number(catId))) {
      categoryObj = categoriesMap.get(Number(catId));
    }

    const newProduct = {
      id: newId,
      name: data.name || 'New Product',
      image: data.image instanceof File ? URL.createObjectURL(data.image) : (data.image || "/menu/img/Burger_148.png"), 
      animation: data.animation instanceof File ? [URL.createObjectURL(data.animation)] : [],
      price: Number(data.price) || 0,
      description: data.description || '',
      categories: categoryObj,
      quantity: 1
    };

    dbProducts.push(newProduct);
    return [201, newProduct];
  });

  
  mock.onDelete(/\/api\/products\/\d+/).reply(config => {
    const id = Number(config.url.split('/').pop());
    dbProducts = dbProducts.filter(p => p.id !== id);
    return [200, { success: true }];
  });

  
  mock.onPut(/\/api\/products\/\d+/).reply(() => {
    
    
    
    return [200, { success: true }];
  });


  
  mock.onGet('/api/categories/').reply(200, categories);
  
  
  mock.onAny().passThrough();
  
  console.log('Mock server initialized for /api/products/');
}
//done