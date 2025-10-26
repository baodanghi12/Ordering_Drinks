import React, { useEffect, useState } from "react";
import { Modal, Select, InputNumber, Button, message, Input } from "antd";

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
  const [sizeNote, setSizeNote] = useState("");
  useEffect(() => {
    if (!visible || !selectedProduct) return;

    let recipeData = [];
    if (selectedProduct.sizeId && selectedProduct.sizes?.length) {
      const size = selectedProduct.sizes.find((s) => s._id === selectedProduct.sizeId);
      recipeData = size?.recipe || [];
      setSizeNote(size?.note || ""); // ✅ load note của size
    } else {
      recipeData = selectedProduct.recipe || [];
       setSizeNote("");
    }

    const newIngredients = recipeData.map((r) => ({
      ingredientId: r.ingredientId?._id || r.ingredientId,
      amount: r.qty || 0,
      unit: r.unit || r.ingredientId?.usageUnit || "",
    }));

    setIngredients(newIngredients);
  }, [visible, selectedProduct]);

  // ✅ Tính tổng cost theo usageUnit và unitWeight
  const totalCost = ingredients.reduce((total, ing) => {
    const item = inventory.find((i) => i._id === ing.ingredientId);
    if (!item) return total;

    const usageUnit = item.usageUnit || "unit";
    const costPerStockUnit = item.cost_per_unit || 0;
    const weightPerStockUnit = item.unitWeight || 1; // ví dụ: 1 bịch = 500g
    const amountUsed = Number(ing.amount) || 0;

    // Quy đổi hàm lượng công thức sang "đơn vị tồn kho"
    let portionUsed = amountUsed;
    if (["ml", "gram"].includes(usageUnit)) {
      portionUsed = amountUsed / weightPerStockUnit; // ví dụ: dùng 100ml trong 1 chai 1000ml = 0.1 chai
    }

    const cost = portionUsed * costPerStockUnit;
    return total + cost;
  }, 0);

  const handleChangeIngredient = (idx, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[idx][field] = value;
    setIngredients(newIngredients);
  };

  const handleAddIngredient = () => {
    const newIng = { ingredientId: null, amount: 0, unit: "" };
    setIngredients([...ingredients, newIng]);
    setErrorIndex(null);
  };

  const handleDeleteIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const hasEmpty = ingredients.some((ing) => !ing.ingredientId);
    if (hasEmpty) {
      message.error("Vui lòng chọn nguyên liệu cho tất cả dòng!");
      return;
    }

    // ✅ Gửi kèm note của size
   onSaveRecipe(ingredients, sizeNote);
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
        const displayUnit = ingredientObj?.usageUnit || ing.unit || "";

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
              {/* Chọn nguyên liệu */}
              <Select
                style={{ flex: 2 }}
                showSearch
                placeholder="Chọn nguyên liệu"
                value={ing.ingredientId}
                onChange={(val) => {
                  const item = inventory.find((i) => i._id === val);
                  setIngredients((prev) => {
                    const newIngredients = [...prev];
                    newIngredients[idx] = {
                      ...newIngredients[idx],
                      ingredientId: val,
                      unit: item?.usageUnit || "",
                    };
                    return newIngredients;
                  });
                }}
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {inventory.map((item) => (
                  <Option key={item._id} value={item._id}>
                    {item.name}
                  </Option>
                ))}
              </Select>

              {/* Số lượng dùng */}
              <InputNumber
                style={{ flex: 1 }}
                min={0}
                step={0.01}
                value={ing.amount}
                onChange={(val) => handleChangeIngredient(idx, "amount", val)}
              />

              {/* Đơn vị đúng (usageUnit) */}
              <span style={{ flex: 0.7, textAlign: "center" }}>
                {displayUnit}
              </span>

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
      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
  <label style={{ fontWeight: 500 }}>Ghi chú cho size này:</label>
  <Input.TextArea
    rows={3}
    placeholder="Nhập ghi chú hướng dẫn pha chế cho size này..."
    value={sizeNote}
    onChange={(e) => setSizeNote(e.target.value)}
  />
</div>
      <div style={{ marginTop: 12, fontWeight: "bold" }}>
        Tổng cost: {totalCost.toLocaleString()}₫
      </div>
    </Modal>
  );
};

export default EditRecipeModal;
