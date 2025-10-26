import React, { useState, useEffect } from "react";
import { Card, message } from "antd";
import axios from "axios";
import RecipeTable from "../components/RecipeTable";
import EditRecipeModal from "../modals/EditRecipeModal";
import ViewRecipeModal from "../modals/ViewRecipeModal";

const Recipes = () => {
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [recipeToView, setRecipeToView] = useState(null);

  useEffect(() => {
    loadProducts();
    loadInventory();
  }, []);

  // 🔹 Load sản phẩm
  const loadProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch {
      message.error("Lỗi khi tải danh sách sản phẩm!");
    }
  };

  // 🔹 Load nguyên vật liệu
  const loadInventory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/inventory");
      setInventory(res.data);
    } catch {
      message.error("Lỗi khi tải danh sách nguyên vật liệu!");
    }
  };

  // 🔹 Mở modal chỉnh sửa công thức
  const openEditModal = (product, sizeId = null) => {
    const productWithSize = { ...product, sizeId }; // ✅ Thêm dòng này
    setSelectedProduct(product);
    setSelectedSizeId(sizeId);

    const recipeData =
      sizeId && product.sizes
        ? product.sizes.find((s) => s._id === sizeId)?.recipe || []
        : product.recipe || [];

    // ✅ Mapping lại dữ liệu theo usageUnit trong kho
    const formattedIngredients = recipeData.map((r) => {
      const inventoryItem = inventory.find(
        (i) => i._id === (r.ingredientId?._id || r.ingredientId)
      );
      return {
        ingredientId: r.ingredientId?._id || r.ingredientId,
        amount: r.qty || r.amount || 0,
        unit: r.unit || inventoryItem?.usageUnit || "",
        costPerUnit: inventoryItem?.cost_per_unit || 0,
      };
    });

    setIngredients(formattedIngredients);
    setModalOpen(true);
  };

  // 🔹 Mở modal xem công thức
  const openViewModal = (product) => {
    setRecipeToView(product);
    setViewModalOpen(true);
  };

  // 🔹 Lưu công thức (PUT API)
  const handleSaveRecipe = async (updatedIngredients, sizeNote) => {
    try {
      const payload = {
        sizeId: selectedSizeId,
        recipe: updatedIngredients
          .filter((ing) => ing.ingredientId)
          .map((ing) => ({
            ingredientId: ing.ingredientId,
            qty: ing.amount, // ✅ lưu đúng trường backend đọc
            unit: ing.unit, // ✅ lưu lại usageUnit để dùng khi hiển thị
          })),
          sizeNote, // ✅ thêm dòng này để backend nhận note
      };
      await axios.put(
        `http://localhost:5000/api/products/${selectedProduct._id}`,
        payload
      );

      await loadProducts(); // reload lại sản phẩm
      message.success("✅ Cập nhật công thức thành công!");
      setModalOpen(false);
    } catch (err) {
      console.error("Lỗi khi lưu công thức:", err);
      message.error("❌ Lỗi khi cập nhật công thức!");
    }
  };

  return (
    <div style={{ padding: "1rem", marginBottom: "70px" }}>
      <Card title="📘 Quản lý công thức món">
        <RecipeTable
          products={products}
          inventory={inventory}
          onEdit={(product, sizeId) => openEditModal(product, sizeId)}
          onView={openViewModal}
        />
      </Card>

      {/* Modal chỉnh sửa công thức */}
      <EditRecipeModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedProduct={selectedProduct}
        inventory={inventory}
        onSaveRecipe={handleSaveRecipe}
      />

      {/* Modal xem công thức */}
      <ViewRecipeModal
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        recipe={recipeToView}
        inventory={inventory}
      />
    </div>
  );
};

export default Recipes;
