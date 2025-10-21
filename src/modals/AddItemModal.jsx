import React, { useEffect, useMemo, useState } from "react";
import { Modal, Select, Input, InputNumber, Empty, Checkbox  } from "antd";
import { fetchProducts } from "../services/api"; // ✅ để lấy danh sách extra từ DB
const { Option } = Select;

const AddItemModal = ({
  visible,
  product,
  size,
  setSize,
  note,
  setNote,
  qty,
  setQty,
  onOk,
  onCancel,
}) => {
  const sizeOptions = product?.sizes || [];
  const [extras, setExtras] = useState([]); // danh sách extra lấy từ DB
  const [selectedExtras, setSelectedExtras] = useState([]); // các extra được chọn
  // ✅ Tự động load extra khi mở modal
// ✅ Khi mở modal hoặc đổi sản phẩm → reset topping và load danh sách extra
useEffect(() => {
  if (!visible) return; // chỉ chạy khi modal mở
  setSelectedExtras([]); // reset topping mỗi lần mở

  const loadExtras = async () => {
    const data = await fetchProducts();
    const extrasOnly = data.filter((p) => p.isExtra);
    setExtras(extrasOnly);
  };
  loadExtras();
}, [visible, product]);

  // ✅ Nếu chỉ có 1 size → tự chọn và khóa Select
  useEffect(() => {
    if (sizeOptions.length === 1) {
      setSize(sizeOptions[0].name);
    }
  }, [product]);

  // ✅ Lấy thông tin size hiện tại
  const selectedSizeData = useMemo(
    () => sizeOptions.find((s) => s.name === size),
    [size, sizeOptions]
  );

  const price = selectedSizeData?.price || 0;
  const extraTotal = selectedExtras.reduce((sum, e) => sum + e.price * (e.qty || 1), 0);
const total = (price + extraTotal) * qty;



  return (
    <Modal
      open={visible}
      onCancel={onCancel}
onOk={() => {
  const selectedSizeData = product?.sizes?.find((s) => s.name === size);
  const baseCost = selectedSizeData?.cost || 0;

  const itemData = {
    ...product,
    productId: product._id,
    size,
    qty,
    note,
    price: selectedSizeData?.price || product?.price || 0,
    cost: baseCost, // ✅ cost theo size

    extras: selectedExtras.map((e) => ({
      productId: e._id,
      name: e.name,
      price: e.price,
      qty: e.qty,
      cost: e.sizes?.[0]?.cost || e.cost || 0, // ✅ nếu extra cũng có cost
      isSeparate: false,
    })),

    containerCost: product.containerCost || 0,
  };

  onOk(itemData);
}}


      title={`Thêm ${product?.name || ""}`}
      centered
      bodyStyle={{
        padding: "1rem",
        maxHeight: "70vh",
        overflowY: "auto",
        touchAction: "pan-y",
      }}
    >
      {/* Chọn size */}
      <div style={{ marginBottom: 16 }}>
        <b>Chọn size</b>
        {sizeOptions.length > 0 ? (
          <Select
            value={size}
            onChange={setSize}
            style={{
              width: "100%",
              marginTop: 8,
              fontSize: "1rem",
              borderRadius: "8px",
            }}
            placeholder="Chọn size..."
            dropdownStyle={{ fontSize: "1rem" }}
            size="large"
            disabled={sizeOptions.length === 1} // 🔒 Khóa khi chỉ có 1 size
          >
            {sizeOptions.map((opt) => (
              <Option key={opt.name} value={opt.name}>
                {opt.name}
              </Option>
            ))}
          </Select>
        ) : (
          <Empty description="Không có size" />
        )}
      </div>

      {/* Ghi chú */}
      <div style={{ marginBottom: 16 }}>
        <b>Ghi chú</b>
        <Input.TextArea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: ít đá, thêm ngọt..."
          style={{
            marginTop: 8,
            fontSize: "1rem",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* Số lượng */}
<div style={{ marginBottom: 12 }}>
  <b>Số lượng</b>
  <InputNumber
    min={1}
    value={qty}
    onChange={setQty}
    style={{
      width: "100%",
      marginTop: 8,
      fontSize: "1rem",
      borderRadius: "8px",
    }}
    size="large"
    inputMode="numeric"     // ✅ bật bàn phím số trên mobile
    pattern="[0-9]*"        // ✅ giúp iOS hiểu là chỉ số
  />
</div>

      {/* Extra (topping) */}
{extras.length > 0 && (
  <div style={{ marginBottom: 16 }}>
    <b>Extra (Topping)</b>
    <div
      style={{
        marginTop: 8,
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
{extras.map((ex) => {
  const existing = selectedExtras.find((e) => e._id === ex._id);
  return (
    <div
      key={ex._id}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "320px",
      }}
    >
      <Checkbox
        checked={!!existing}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedExtras([...selectedExtras, { ...ex, qty: 1 }]); // mặc định 1 phần
          } else {
            setSelectedExtras(selectedExtras.filter((item) => item._id !== ex._id));
          }
        }}
      >
        {ex.name} ({ex.price.toLocaleString()}đ)
      </Checkbox>

      {existing && (
        <InputNumber
          min={1}
          max={10}
          value={existing.qty}
          onChange={(val) => {
            setSelectedExtras(
              selectedExtras.map((item) =>
                item._id === ex._id ? { ...item, qty: val } : item
              )
            );
          }}
          size="small"
          style={{ width: "60px" }}
        />
      )}
    </div>
  );
})}

    </div>
  </div>
)}

      {/* Hiển thị giá (tự động tính) */}
      <div
        style={{
          textAlign: "right",
          marginTop: 8,
          fontWeight: "600",
          color: "#1677ff",
          fontSize: "1.1rem",
        }}
      >
        {price > 0 ? (
          <>
            Giá: {total.toLocaleString()}đ
            <br />
          </>
        ) : (
          <span style={{ color: "#888", fontSize: "0.9rem" }}>
            Hãy chọn size để hiển thị giá
          </span>
        )}
      </div>
    </Modal>
  );
};

export default AddItemModal;
