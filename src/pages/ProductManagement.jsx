import React, { useState, useEffect } from "react";
import { Card, Button, message } from "antd";
import axios from "axios";
import ProductTable from "../components/ProductTable";
import AddProductModal from "../components/AddProductModal";
import EditProductModal from "../components/EditProductModal";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "", image: "", sizes: [] });
  const [editProduct, setEditProduct] = useState({ name: "", price: "", category: "", image: "", sizes: [] });

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const loadProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data || []);
    } catch (err) {
      message.error("Lỗi khi tải sản phẩm");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

const handleAddProduct = async (productData) => {
  try {
    await axios.post("http://localhost:5000/api/products", productData);
    message.success("Thêm món mới thành công");
    setAddModalOpen(false);
    setNewProduct({ name: "", price: "", category: "", image: "", sizes: [] });
    loadProducts();
  } catch (err) {
    console.error("❌ Lỗi khi thêm sản phẩm:", err);
    message.error("Lỗi khi thêm món mới");
  }
};

  const handleEditProduct = async () => {
  try {
    await axios.put(
      `http://localhost:5000/api/products/${editProduct._id}`,
      editProduct
    );
    message.success("Cập nhật món thành công");
    setEditModalOpen(false);
    loadProducts();
  } catch (err) {
    console.error(err);
    message.error("Lỗi khi cập nhật sản phẩm");
  }
};
  const handleDeleteProduct = async (id) => {
  try {
    // Hiển thị xác nhận trước khi xóa
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa món này không?");
    if (!confirmDelete) return;

    await axios.delete(`http://localhost:5000/api/products/${id}`);
    message.success("Xóa món thành công");

    // Cập nhật danh sách sản phẩm sau khi xóa
    setProducts((prev) => prev.filter((p) => p._id !== id));
  } catch (err) {
    console.error(err);
    message.error("Lỗi khi xóa sản phẩm");
  }
};


  return (
    <div style={{ padding: "1rem", maxWidth: 600, margin: "0 auto" }}>
      <Card
        title="Quản lý sản phẩm"
        extra={<Button onClick={() => setAddModalOpen(true)}>+ Thêm món</Button>}
      >
        <ProductTable
          products={products}
          onEdit={(record) => {
            setSelectedProduct(record);
            setEditProduct(record);
            setEditModalOpen(true);
          }}
          onDelete={handleDeleteProduct}
        />
      </Card>

      <AddProductModal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddProduct}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        categories={categories}
      />

     <EditProductModal
  open={editModalOpen}
  onCancel={() => setEditModalOpen(false)}
  onOk={handleEditProduct}
  editProduct={editProduct}
  setEditProduct={setEditProduct}
  categories={categories}   // 🟢 thêm dòng này
/>
    </div>
  );
};

export default ProductManagement;
