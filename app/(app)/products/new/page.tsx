import { createProduct } from '@/app/actions/products';
import ProductForm from '../ProductForm';

export default function NewProductPage() {
  return <ProductForm action={createProduct} title="Add Product" />;
}
