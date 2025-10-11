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

  const loadProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch {
      message.error("Lỗi khi tải sản phẩm");
    }
  };

  const loadInventory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/inventory");
      setInventory(res.data);
    } catch {
      message.error("Lỗi khi tải nguyên liệu");
    }
  };

const openEditModal = (product) => {
  setSelectedProduct(product);
  setSelectedSizeId(product.sizeId || null);
  

  // ✅ Lấy công thức đúng size
  const recipeData =
    product.sizeId && product.sizes
      ? product.sizes.find((s) => s._id === product.sizeId)?.recipe || []
      : product.recipe || [];

  setIngredients(
    recipeData.map((r) => ({
      ingredientId: r.ingredientId?._id || r.ingredientId,
      amount: r.qty,
      unit: r.unit || r.ingredientId?.unit || "",
      costPerUnit: r.ingredientId?.cost_per_unit || 0,
    }))
  );

  setModalOpen(true);
};


  const openViewModal = (product) => {
    setRecipeToView(product);
    setViewModalOpen(true);
  };

  return (
    <div style={{ padding: "1rem", marginBottom: "70px" }}>
      <Card title="Quản lý công thức món">
        <RecipeTable
  products={products}
  inventory={inventory} // 🟢 thêm dòng này
  onEdit={openEditModal}
  onView={openViewModal}
/>

      </Card>

    <EditRecipeModal
  visible={modalOpen}
  onClose={() => setModalOpen(false)}
  selectedProduct={selectedProduct}
  inventory={inventory}
  ingredients={ingredients}
  onChangeIngredient={(idx, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[idx][field] = value;
    setIngredients(newIngredients);
  }}
  onDeleteIngredient={(idx) => {
    const newIngredients = ingredients.filter((_, i) => i !== idx);
    setIngredients(newIngredients);
  }}
  onAddIngredient={() => {
    setIngredients([...ingredients, { ingredientId: null, amount: 0, unit: "" }]);
  }}
onSaveRecipe={async (updatedIngredients) => {
  if (!selectedProduct) return;

  try {
    const payload = {
      sizeId: selectedSizeId,
      recipe: updatedIngredients.map((ing) => ({
        ingredientId: ing.ingredientId,
        qty: ing.amount,
        unit: ing.unit,
      })),
    };

    // 🧩 Giữ lại dữ liệu size cũ
    const existingProduct = selectedProduct;
    if (selectedSizeId) {
      const updatedSizes = existingProduct.sizes.map((s) =>
        s._id === selectedSizeId
          ? { ...s, recipe: payload.recipe }
          : s
      );
      payload.sizes = updatedSizes;
    } else {
      payload.recipe = payload.recipe;
      payload.sizes = existingProduct.sizes;
    }

    await axios.put(
      `http://localhost:5000/api/products/${selectedProduct.productId}`,
      payload
    );

    message.success("Công thức đã được lưu");
    setModalOpen(false);
    loadProducts();
  } catch (error) {
    console.error(error);
    message.error(
      "Lưu công thức thất bại: " +
        (error.response?.data?.message || error.message)
    );
  }
}}
/>


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
