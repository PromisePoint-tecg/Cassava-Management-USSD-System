import React, { useEffect, useState } from 'react';
import { productsApi, Product, ProductFilters, PaginatedProductsResponse } from '../services/products';
import { Search, Edit, Plus, ChevronLeft, ChevronRight, Loader2, CheckCircle, X, Trash2, Package } from 'lucide-react';
import LeafButtonLoader from './Loader';

const ProductsView: React.FC = () => {
  const [data, setData] = useState<PaginatedProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
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
    
    const farmerPrice = parseFloat(createForm.priceForFarmers);
    const marketPrice = parseFloat(createForm.priceForMarket);
    
    if (isNaN(farmerPrice) || farmerPrice < 0) {
      alert('Please enter a valid price for farmers');
      return;
    }
    
    if (isNaN(marketPrice) || marketPrice < 0) {
      alert('Please enter a valid price for market');
      return;
    }
    
    setSubmitting(true);
    try {
      await productsApi.create({
        productName: createForm.productName.trim(),
        priceForFarmers: farmerPrice,
        priceForMarket: marketPrice,
        size: createForm.size.trim()
      });
      setShowCreate(false);
      setCreateForm({ productName: '', priceForFarmers: '', priceForMarket: '', size: '' });
      setSuccessMessage('Product created successfully!');
      setShowSuccess(true);
      load();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create product';
      alert(errorMessage);
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
      load();
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
      load();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    setSubmitting(true);
    try {
      await productsApi.delete(productToDelete.id);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setSuccessMessage('Product deleted successfully!');
      setShowSuccess(true);
      load();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || 'Failed to delete product';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LeafButtonLoader />
      </div>
    );
  }

  const products = data?.products || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.page || 1;

  return (
    <div className="space-y-5">
      {/* Header - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#066f48]/10 to-transparent blur-2xl rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#066f48] shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Market Products</h2>
              <p className="text-sm text-gray-600">{data?.total || 0} total products</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreate(true)} 
            className="px-4 py-2 bg-[#066f48] text-white rounded-xl hover:bg-[#055539] flex items-center gap-2 shadow-lg transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <Plus className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Add Product</span>
          </button>
        </div>
      </div>

      {/* Search and Filters - Liquid Glass */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800 placeholder-gray-500"
            />
          </div>
          <select
            value={filters.isActive || ''}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="px-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-xl focus:ring-2 focus:ring-[#066f48]/30 focus:outline-none focus:bg-white/50 transition-all text-gray-800"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 relative z-10" />
          <p className="text-gray-600 relative z-10">
            {filters.search ? 'No products found matching your search.' : 'No products configured yet.'}
          </p>
          <div className="mt-4 relative z-10">
            <button 
              onClick={() => setShowCreate(true)} 
              className="bg-[#066f48] text-white px-4 py-2 rounded-xl hover:bg-[#055539] transition-all shadow-lg"
            >
              Create your first product
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View - Liquid Glass */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/5 to-transparent rounded-b-[2rem] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#066f48]/5 via-transparent to-cyan-400/5 rounded-[2rem] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent blur-3xl rounded-full pointer-events-none" />
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white/20 backdrop-blur-md text-gray-700 font-medium uppercase text-xs border-b border-white/30">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Price (Farmer)</th>
                    <th className="px-6 py-3">Price (Market)</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/15">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{p.productName}</td>
                      <td className="px-6 py-4 text-gray-700">{p.size}</td>
                      <td className="px-6 py-4 text-gray-700">₦{p.priceForFarmers.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-gray-700">₦{p.priceForMarket.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${
                          p.isActive 
                            ? 'bg-green-100/90 text-green-700 border border-green-200/50' 
                            : 'bg-red-100/90 text-red-700 border border-red-200/50'
                        }`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingProduct(p)} 
                            className="p-2 text-blue-600 hover:bg-blue-50/80 rounded-lg backdrop-blur-sm transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => confirmDelete(p)} 
                            className="p-2 text-red-600 hover:bg-red-50/80 rounded-lg backdrop-blur-sm transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleStatus(p)} 
                            className="text-sm px-2 py-1 rounded-lg bg-white/25 backdrop-blur-md border border-white/50 hover:bg-white/35 transition-all text-gray-700"
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
          </div>

          {/* Pagination - Liquid Glass */}
          {totalPages > 1 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1),0_1px_2px_0_rgba(255,255,255,0.5)_inset] p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[2rem] pointer-events-none" />
              <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/30 to-transparent blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-white/25 backdrop-blur-md border border-white/50 rounded-xl hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-gray-700"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Product Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden my-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#066f48]">Create Product</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
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
                    <p className="text-xs text-blue-600 mb-1">💡 Enter price in naira</p>
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      pattern="[0-9]+(\.[0-9]+)?"
                      placeholder="e.g., 200"
                      value={createForm.priceForFarmers} 
                      onChange={(e) => setCreateForm({ ...createForm, priceForFarmers: e.target.value })} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price for Market (₦)</label>
                    <p className="text-xs text-blue-600 mb-1">💡 Enter price in naira</p>
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      pattern="[0-9]+(\.[0-9]+)?"
                      placeholder="e.g., 300"
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
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-4 py-2 bg-[#066f48] text-white rounded-xl hover:bg-[#055539] disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal - Enhanced Glass */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden my-auto border border-white/60 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-[2rem]" />
            <div className="px-6 py-4 border-b border-white/40 bg-gradient-to-r from-[#066f48]/15 to-cyan-400/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-white/20 blur-xl rounded-full pointer-events-none" />
              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-lg font-bold text-[#066f48]">Edit Product</h3>
                <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 relative z-10">
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
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      pattern="[0-9]+(\.[0-9]+)?"
                      value={editingProduct.priceForFarmers} 
                      onChange={(e) => setEditingProduct({ ...editingProduct, priceForFarmers: Number(e.target.value) || 0 })} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price for Market (₦)</label>
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      pattern="[0-9]+(\.[0-9]+)?"
                      value={editingProduct.priceForMarket} 
                      onChange={(e) => setEditingProduct({ ...editingProduct, priceForMarket: Number(e.target.value) || 0 })} 
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
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all text-gray-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-4 py-2 bg-[#066f48] text-white rounded-xl hover:bg-[#055539] disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-700">Delete Product</h3>
                  <p className="text-sm text-red-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>"{productToDelete.productName}"</strong>? 
                This will permanently remove the product from the system.
              </p>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProductToDelete(null);
                  }} 
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Success!</h3>
              <p className="text-gray-600">{successMessage}</p>
              <button 
                onClick={() => setShowSuccess(false)} 
                className="px-6 py-2 bg-[#066f48] text-white rounded-lg hover:bg-[#055539] transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;