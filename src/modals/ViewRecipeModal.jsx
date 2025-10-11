import React, { useEffect, useState } from "react";
import { Modal, Select, InputNumber, Button } from "antd";

const { Option } = Select;

const ViewRecipeModal = ({ open, onCancel, recipe, inventory }) => {
  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    if (!recipe) return;
    setIngredients(
      (recipe.recipe || []).map((r) => ({
        ingredientId: r.ingredientId?._id || r.ingredientId,
        amount: r.qty || 0,
        unit: r.unit || r.ingredientId?.unit || "",
      }))
    );
  }, [recipe, inventory]);

  const totalCost = ingredients.reduce((total, ing) => {
    const item = inventory.find((i) => i._id === ing.ingredientId);
    if (!item) return total;

    let amount = ing.amount || 0;
    let costPerUnit = item.cost_per_unit || 0;

    switch (item.unit) {
      case "g":
        if (item.unitWeight && item.unitWeight !== 0)
          costPerUnit = costPerUnit / item.unitWeight;
        if (ing.unit === "kg") amount = amount * 1000;
        break;
      case "kg":
        if (ing.unit === "gr") amount = amount / 1000;
        break;
      case "ml":
        if (item.unitWeight && item.unitWeight !== 0)
          costPerUnit = costPerUnit / item.unitWeight;
        if (ing.unit === "l") amount = amount * 1000;
        break;
      case "l":
        if (ing.unit === "ml") amount = amount / 1000;
        break;
      case "pcs":
        if (item.unitWeight && ing.unit !== "pcs")
          amount = amount / item.unitWeight;
        break;
      default:
        break;
    }

    return total + amount * costPerUnit;
  }, 0);

  return (
    <Modal
  title={recipe ? (
    <span>
      Công thức: <strong>{recipe.name}</strong>
      {recipe.size?.name && (
       <span style={{ marginLeft: 8, color: "#201f1fff", fontWeight: 500 }}>
  ({recipe.size.name})
</span>
      )}
    </span>
  ) : (
    "Xem công thức"
  )}
  open={open}              // ✅ đổi visible -> open
  onCancel={onCancel}      // ✅ đổi onClose -> onCancel
  width={700}
  footer={
    <div style={{ textAlign: "right" }}>
      <Button onClick={onCancel} type="primary">
        Đóng
      </Button>
    </div>
  }
>

      {ingredients.length > 0 ? (
        ingredients.map((ing, idx) => {
          const ingredientObj = inventory.find((i) => i._id === ing.ingredientId);
          const displayUnit = ingredientObj?.unit || ing.unit || "";

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Select
                style={{ flex: 2 }}
                value={ing.ingredientId}
                disabled
              >
                {inventory.map((item) => (
                  <Option key={item._id} value={item._id}>
                    {item.name}
                  </Option>
                ))}
              </Select>

              <InputNumber
                style={{ flex: 1 }}
                min={0}
                step={0.01}
                value={ing.amount}
                disabled
              />
              <span style={{ flex: 1 }}>{displayUnit}</span>
            </div>
          );
        })
      ) : (
        <div>Không có nguyên liệu trong công thức này.</div>
      )}

      <div style={{ marginTop: 12, fontWeight: "bold" }}>
        Tổng cost: {totalCost.toLocaleString()}₫
      </div>
    </Modal>
  );
};

export default ViewRecipeModal;
