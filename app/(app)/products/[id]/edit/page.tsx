import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProductById } from '@/lib/data';
import { updateProduct } from '@/app/actions/products';
import ProductForm from '../../ProductForm';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const product = getProductById(parseInt(id, 10), session.orgId);
  if (!product) notFound();

  return <ProductForm action={updateProduct} product={product} title="Edit Product" />;
}
