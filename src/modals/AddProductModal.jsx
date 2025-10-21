import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Select,
  Button,
  Card,
  Space,
  InputNumber,
  message,
  AutoComplete
} from "antd";
import ImageUpload from "../components/ImageUpload";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;

const AddProductModal = ({
  open,
  onCancel,
  onOk,
  newProduct,
  setNewProduct,
  categories,
}) => {
  const [sizes, setSizes] = useState(newProduct.sizes || []);

  // 🔁 Đồng bộ khi mở modal hoặc newProduct thay đổi
// Chỉ đồng bộ khi mở modal (hoặc khi newProduct thay đổi lần đầu)
useEffect(() => {
  if (open) {
    setSizes(newProduct.sizes || []);
  }
}, [open, newProduct.sizes]);


  const handleAddSize = () => {
    setSizes((prev) => [...prev, { name: "", price: 0, recipe: [] }]);
  };

  const handleRemoveSize = (index) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSizeChange = (index, field, value) => {
    setSizes((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // ✅ Cho phép gõ tay hoặc chọn danh mục có sẵn
  const handleCategoryChange = (value) => {
    setNewProduct({ ...newProduct, category: value });
  };

const handleSave = () => {
  if (!newProduct.name) return message.warning("Nhập tên món");
  if (sizes.length === 0) return message.warning("Thêm ít nhất 1 size");
  if (sizes.some((s) => !s.name || s.price <= 0))
    return message.warning("Nhập đủ tên size và giá hợp lệ");

  const defaultPrice =
    sizes.length === 1 ? sizes[0].price : newProduct.price || 0;

  onOk({
    ...newProduct,
    price: defaultPrice,
    sizes, // thêm sizes ở đây
  });
};



  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      title="Thêm món mới"
      centered
      width={700}
    >
      {/* Tên sản phẩm */}
      <Input
        placeholder="Tên món"
        value={newProduct.name}
        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
        style={{ marginBottom: 8 }}
      />

      {/* Danh mục — cho phép gõ tay */}
      <AutoComplete
  style={{ width: "100%", marginBottom: 12 }}
  options={(categories || []).map((c) => ({ value: c }))}
  value={newProduct.category}
  onChange={(val) => setNewProduct({ ...newProduct, category: val })}
  onSelect={(val) => setNewProduct({ ...newProduct, category: val })}
  placeholder="Chọn hoặc nhập danh mục (gõ rồi nhấn Enter)"
  allowClear
  filterOption={(inputValue, option) =>
    option.value.toLowerCase().includes(inputValue.toLowerCase())
  }
/>


      {/* Danh sách size */}
      <Card
        size="small"
        title="Danh sách Size & Giá"
        extra={
          <Button icon={<PlusOutlined />} type="dashed" onClick={handleAddSize}>
            Thêm Size
          </Button>
        }
        style={{ marginBottom: 12 }}
      >
        {sizes.length === 0 ? (
          <p style={{ color: "#888" }}>
            Chưa có size nào. Nhấn “Thêm Size” để bắt đầu.
          </p>
        ) : (
          sizes.map((size, index) => (
            <Card
              key={index}
              size="small"
              type="inner"
              title={`Size ${index + 1}`}
              extra={
                <Button
                  icon={<DeleteOutlined />}
                  type="text"
                  danger
                  onClick={() => handleRemoveSize(index)}
                />
              }
              style={{ marginBottom: 8 }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Input
                  placeholder="Tên size (vd: M, L)"
                  value={size.name}
                  onChange={(e) =>
                    handleSizeChange(index, "name", e.target.value)
                  }
                />
                <InputNumber
                  placeholder="Giá bán"
                  min={0}
                  style={{ width: "100%" }}
                  value={size.price}
                  onChange={(value) => handleSizeChange(index, "price", value)}
                />
              </Space>
            </Card>
          ))
        )}
      </Card>

      {/* Upload hình ảnh */}
      <ImageUpload
        value={newProduct.image}
        onChange={(url) => setNewProduct({ ...newProduct, image: url })}
      />
    </Modal>
  );
};

export default AddProductModal;
