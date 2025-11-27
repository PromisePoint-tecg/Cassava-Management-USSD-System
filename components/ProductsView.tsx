import React, { useEffect, useState } from 'react';
import { productsApi, Product, ProductFilters, PaginatedProductsResponse } from '../api/products';
import { Search, Edit, Plus, ChevronLeft, ChevronRight, Loader2, CheckCircle, X } from 'lucide-react';

const ProductsView: React.FC = () => {
  const [data, setData] = useState<PaginatedProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20,
    search: '',
    isActive: '',
  });
  const [createForm, setCreateForm] = useState({ 
    productName: '', 
    priceForFarmers: '', 
    priceForMarket: '', 
    size: '' 
  });

  const load = async (newFilters: ProductFilters = filters) => {
    setLoading(true);
    try {
      const res = await productsApi.getAll(newFilters);
      setData(res);
    } catch (err) {
      console.error('Error loading products', err);
      setData({ products: [], total: 0, page: 1, limit: 20, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (searchTerm: string) => {
    const newFilters = { ...filters, search: searchTerm, page: 1 };
    setFilters(newFilters);
    load(newFilters);
  };

  const handleFilterChange = (key: keyof ProductFilters, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    load(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    load(newFilters);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productsApi.create({
        productName: createForm.productName,
        priceForFarmers: parseFloat(createForm.priceForFarmers) || 0,
        priceForMarket: parseFloat(createForm.priceForMarket) || 0,
        size: createForm.size
      });
      setShowCreate(false);
      setCreateForm({ productName: '', priceForFarmers: '', priceForMarket: '', size: '' });
      setSuccessMessage('Product created successfully!');
      setShowSuccess(true);
      load(); // Reload list
    } catch (err) {
      console.error(err);
      alert('Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmitting(true);
    try {
      await productsApi.update(editingProduct.id, {
        productName: editingProduct.productName,
        priceForFarmers: editingProduct.priceForFarmers,
        priceForMarket: editingProduct.priceForMarket,
        size: editingProduct.size,
        isActive: editingProduct.isActive,
      });
      setEditingProduct(null);
      setSuccessMessage('Product updated successfully!');
      setShowSuccess(true);
      load(); // Reload list
    } catch (err) {
      console.error(err);
      alert('Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (p: Product) => {
    try {
      await productsApi.update(p.id, { isActive: !p.isActive });
      load(); // Reload list
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return <div className="p-6 bg-white rounded-xl shadow-sm">Loading products...</div>;
  }

  const products = data?.products || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.page || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Market Products</h2>
        <button 
          onClick={() => setShowCreate(true)} 
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <select
            value={filters.isActive || ''}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-600">
            {filters.search ? 'No products found matching your search.' : 'No products configured yet.'}
          </p>
          <div className="mt-4">
            <button 
              onClick={() => setShowCreate(true)} 
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg"
            >
              Create your first product
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Price (Farmer)</th>
                  <th className="px-4 py-3 font-semibold">Price (Market)</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.productName}</td>
                    <td className="px-4 py-3">{p.size}</td>
                    <td className="px-4 py-3">₦{p.priceForFarmers.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">₦{p.priceForMarket.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingProduct(p)} 
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleStatus(p)} 
                          className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * (data?.limit || 20)) + 1} to {Math.min(currentPage * (data?.limit || 20), data?.total || 0)} of {data?.total || 0} products
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Product Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create Product</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  required 
                  value={createForm.productName} 
                  onChange={(e) => setCreateForm({ ...createForm, productName: e.target.value })} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price for Farmers (₦)</label>
                  <p className="text-xs text-blue-600 mb-1">💡 Enter price in naira (e.g., enter 200 for ₦200.00)</p>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="Enter price in naira (e.g., 200)"
                    value={createForm.priceForFarmers} 
                    onChange={(e) => setCreateForm({ ...createForm, priceForFarmers: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price for Market (₦)</label>
                  <p className="text-xs text-blue-600 mb-1">💡 Enter price in naira (e.g., enter 300 for ₦300.00)</p>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="Enter price in naira (e.g., 300)"
                    value={createForm.priceForMarket} 
                    onChange={(e) => setCreateForm({ ...createForm, priceForMarket: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size/Unit</label>
                <input 
                  required 
                  value={createForm.size} 
                  onChange={(e) => setCreateForm({ ...createForm, size: e.target.value })} 
                  placeholder="e.g., per 10kg, per bag, per piece"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)} 
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  required 
                  value={editingProduct.productName} 
                  onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price for Farmers (₦)</label>
                  <p className="text-xs text-blue-600 mb-1">💡 Enter price in naira (e.g., enter 200 for ₦200.00)</p>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={editingProduct.priceForFarmers} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceForFarmers: Number(e.target.value) })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price for Market (₦)</label>
                  <p className="text-xs text-blue-600 mb-1">💡 Enter price in naira (e.g., enter 300 for ₦300.00)</p>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={editingProduct.priceForMarket} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceForMarket: Number(e.target.value) })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size/Unit</label>
                <input 
                  required 
                  value={editingProduct.size} 
                  onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingProduct.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.value === 'true' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button 
              onClick={() => setShowSuccess(false)} 
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;
