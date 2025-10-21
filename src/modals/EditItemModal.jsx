import React, { useEffect, useMemo, useState } from "react";
import { Modal, Select, Input, InputNumber, Empty, Checkbox } from "antd";
import { fetchProducts } from "../services/api";
const { Option } = Select;

const EditItemModal = ({
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
  const [extras, setExtras] = useState([]);
  const [selectedExtras, setSelectedExtras] = useState([]);

  // ✅ Khi mở modal → load dữ liệu từ product (gồm topping)
  useEffect(() => {
    if (visible && product) {
      setSize(product.size || sizeOptions[0]?.name || "");
      setNote(product.note || "");
      setQty(product.qty || 1);
      // ✅ đảm bảo extras có mảng trống nếu chưa có
    setSelectedExtras(Array.isArray(product.extras) ? product.extras : []);
    }
  }, [visible, product]);

  // ✅ Load danh sách extra từ DB
  useEffect(() => {
    const loadExtras = async () => {
      const data = await fetchProducts();
      setExtras(data.filter((p) => p.isExtra));
    };
    loadExtras();
  }, []);

  // ✅ Nếu chỉ có 1 size → auto chọn
  useEffect(() => {
    if (sizeOptions.length === 1) {
      setSize(sizeOptions[0].name);
    }
  }, [product]);

  const selectedSizeData = useMemo(
    () => sizeOptions.find((s) => s.name === size),
    [size, sizeOptions]
  );

  const basePrice = selectedSizeData?.price || product?.price || 0;
  const extraTotal = selectedExtras.reduce(
    (sum, e) => sum + e.price * (e.qty || 1),
    0
  );
  const total = (basePrice + extraTotal) * qty;

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      onOk={() => {
        const updatedData = {
          ...product,
          size,
          qty,
          note,
          price: basePrice,
          extras: selectedExtras.map((e) => ({
            productId: e._id || e.productId,
            name: e.name,
            price: e.price,
            qty: e.qty || 1,
            isSeparate: false,
          })),
        };
        onOk(updatedData);
      }}
      title={`Sửa ${product?.name || "món"}`}
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
            size="large"
            disabled={sizeOptions.length === 1}
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
          inputMode="numeric"
          pattern="[0-9]*"
        />
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

      {/* Extra (Topping) */}
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
              // ✅ xác định extra đang được chọn
              const existing =
                selectedExtras.find(
                  (e) => e.productId === ex._id || e._id === ex._id
                ) || null;

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
                        setSelectedExtras((prev) => [
                          ...prev,
                          { ...ex, qty: 1 },
                        ]);
                      } else {
                        setSelectedExtras((prev) =>
                          prev.filter(
                            (item) =>
                              item.productId !== ex._id && item._id !== ex._id
                          )
                        );
                      }
                    }}
                  >
                    {ex.name} ({ex.price.toLocaleString()}đ)
                  </Checkbox>

                  {existing && (
                    <InputNumber
                      min={1}
                      max={10}
                      value={existing.qty || 1}
                      onChange={(val) => {
                        setSelectedExtras((prev) =>
                          prev.map((item) =>
                            item.productId === ex._id || item._id === ex._id
                              ? { ...item, qty: val }
                              : item
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

      {/* Hiển thị giá */}
      <div
        style={{
          textAlign: "right",
          marginTop: 8,
          fontWeight: "600",
          color: "#1677ff",
          fontSize: "1.1rem",
        }}
      >
        Giá: {total.toLocaleString()}đ
      </div>
    </Modal>
  );
};

export default EditItemModal;
