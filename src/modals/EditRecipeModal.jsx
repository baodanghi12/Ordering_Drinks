import React, { useEffect, useState } from "react";
import { Modal, Select, InputNumber, Button, message } from "antd";

const { Option } = Select;

const EditRecipeModal = ({
  visible,
  onClose,
  selectedProduct,
  inventory,
  onSaveRecipe,
}) => {
  const [ingredients, setIngredients] = useState([]);
  const [errorIndex, setErrorIndex] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

useEffect(() => {
  if (!selectedProduct) return;

  setIngredients(
    (selectedProduct.recipe || []).map((r) => ({
      ingredientId: r.ingredientId?._id || r.ingredientId,
      amount: r.qty || 0,
      unit: r.unit || r.ingredientId?.unit || "",
    }))
  );
}, [selectedProduct, inventory]);

  const totalCost = ingredients.reduce((total, ing) => {
    const item = inventory.find((i) => i._id === ing.ingredientId);
    if (!item) return total;

    let amount = ing.amount || 0;
    let costPerUnit = item.cost_per_unit || 0;

    // Quy đổi theo unit và unitWeight
    switch (item.unit) {
      case "g":
        if (item.unitWeight && item.unitWeight !== 0) {
          costPerUnit = costPerUnit / item.unitWeight; // giá 1 g
        }
        if (ing.unit === "kg") amount = amount * 1000; // kg -> g
        break;

      case "kg":
        if (ing.unit === "gr") amount = amount / 1000; // gr -> kg
        break;

      case "ml":
        if (item.unitWeight && item.unitWeight !== 0) {
          costPerUnit = costPerUnit / item.unitWeight; // giá 1 ml nếu cost là cho chai/bịch
        }
        if (ing.unit === "l") amount = amount * 1000; // l -> ml
        break;

      case "l":
        if (ing.unit === "ml") amount = amount / 1000; // ml -> l
        break;

      case "pcs":
        if (item.unitWeight && ing.unit !== "pcs") {
          // Ví dụ 1 bịch 500gr, dùng 250gr -> 0.5pcs
          amount = amount / item.unitWeight;
        }
        break;

      default:
        break;
    }

    return total + amount * costPerUnit;
  }, 0);

  const handleChangeIngredient = (idx, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[idx][field] = value;
    setIngredients(newIngredients);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { ingredientId: null, amount: 0, unit: "" }]);
     setErrorIndex(null); // reset lỗi khi thêm dòng mới
  };

  const handleDeleteIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

const handleSave = () => {
  if (!selectedProduct) return;

  // Gọi props.onSaveRecipe và truyền ingredients hiện tại
  onSaveRecipe(ingredients);

  // Đóng modal
  onClose();
};


return (
  <Modal
    title={
      selectedProduct ? (
        <span>
          Công thức: <strong>{selectedProduct.name}</strong>
          {selectedProduct.size?.name && (
            <span style={{ marginLeft: 8, color: "#999" }}>
              ({selectedProduct.size.name})
            </span>
          )}
        </span>
      ) : (
        "Tạo món mới"
      )
    }
    open={visible}
    onCancel={onClose}
    width={700}
    footer={
      <div style={{ textAlign: "right" }}>
        <Button onClick={onClose} style={{ marginRight: 8 }}>
          Hủy
        </Button>
        <Button type="primary" onClick={handleSave}>
          Lưu
        </Button>
      </div>
    }
  >
    {ingredients.map((ing, idx) => {
      const ingredientObj = inventory.find((i) => i._id === ing.ingredientId);
      const displayUnit = ingredientObj?.unit || ing.unit || "";

      return (
        <React.Fragment key={idx}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Select
              style={{ flex: 2 }}
              showSearch
              placeholder="Chọn nguyên liệu hoặc nhập mới"
              value={ing.ingredientId}
              onChange={(val) => {
                const isDuplicate = ingredients.some(
                  (ing, i) => ing.ingredientId === val && i !== idx
                );

                if (isDuplicate) {
                  setErrorIndex(idx);
                  return; // không cập nhật nếu bị trùng
                }

                setErrorIndex(null);
                handleChangeIngredient(idx, "ingredientId", val);
                const unit =
                  inventory.find((i) => i._id === val)?.unit || "";
                handleChangeIngredient(idx, "unit", unit);
              }}
              filterOption={(input, option) =>
                option?.children
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
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
              onChange={(val) =>
                handleChangeIngredient(idx, "amount", val)
              }
            />
            <span style={{ flex: 1 }}>{displayUnit}</span>

            <Button danger onClick={() => handleDeleteIngredient(idx)}>
              Xóa
            </Button>
          </div>

          {errorIndex === idx && (
            <div
              style={{
                color: "red",
                marginTop: -8,
                marginBottom: 8,
                fontSize: 13,
              }}
            >
              Nguyên liệu này đã được chọn trước đó!
            </div>
          )}
        </React.Fragment>
      );
    })}

    <Button type="dashed" block onClick={handleAddIngredient}>
      + Thêm nguyên liệu
    </Button>

    <div style={{ marginTop: 12, fontWeight: "bold" }}>
      Tổng cost: {totalCost.toLocaleString()}₫
    </div>
  </Modal>
);

};

export default EditRecipeModal;
