import type { TutorialStep } from '../types';

export const productSteps: TutorialStep[] = [
  {
    element: '[data-tutorial="nav-products"]',
    popover: {
      title: 'Products',
      description: "Manage the products your Principals offer.",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="products-list"]',
    popover: {
      title: 'Product Catalog',
      description: 'View all products here, organized by Principal.',
      side: 'left',
    },
    navigateTo: '/products',
  },
  {
    element: '[data-tutorial="create-product-btn"]',
    popover: {
      title: 'Add New Product',
      description: "Let's add a product to the catalog.",
      side: 'bottom',
    },
  },
  {
    element: '[data-tutorial="product-name"]',
    popover: {
      title: 'Product Name',
      description: 'Enter the product name.',
      side: 'right',
    },
    navigateTo: '/products/create',
  },
  {
    popover: {
      title: '✅ Products Complete!',
      description: "Products are set up! Now let's cover Notes.",
    },
  },
];
