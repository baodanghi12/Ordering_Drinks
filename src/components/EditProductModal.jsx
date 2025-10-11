import React from "react";
import {
  Modal,
  Input,
  Select,
  Button,
  InputNumber,
  Space,
  Divider,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import ImageUpload from "./ImageUpload";

const { Option } = Select;
const { Text } = Typography;

const EditProductModal = ({
  open,
  onCancel,
  onOk,
  editProduct,
  setEditProduct,
  categories = [],
}) => {
  // ✅ Thêm size mới
  const handleAddSize = () => {
    const newSize = { name: "", price: 0, cost: 0, recipe: [] };
    setEditProduct({
      ...editProduct,
      sizes: [...(editProduct.sizes || []), newSize],
    });
  };

  // ✅ Cập nhật thông tin size
  const handleSizeChange = (index, field, value) => {
    const updatedSizes = [...(editProduct.sizes || [])];
    updatedSizes[index][field] = value;
    setEditProduct({ ...editProduct, sizes: updatedSizes });
  };

  // ✅ Xóa size
  const handleRemoveSize = (index) => {
    const updatedSizes = [...(editProduct.sizes || [])];
    updatedSizes.splice(index, 1);
    setEditProduct({ ...editProduct, sizes: updatedSizes });
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      title="Chỉnh sửa sản phẩm"
      centered
      width={400}
    >
      {/* 🧋 Tên món */}
      <Input
        placeholder="Tên món"
        value={editProduct?.name}
        onChange={(e) =>
          setEditProduct({ ...editProduct, name: e.target.value })
        }
        style={{ marginBottom: 10 }}
      />

      {/* 📂 Danh mục */}
      <Select
        showSearch
        placeholder="Chọn danh mục"
        value={
          typeof editProduct?.category === "object"
            ? editProduct.category._id
            : editProduct?.category
        }
        onChange={(value) => setEditProduct({ ...editProduct, category: value })}
        style={{ width: "100%", marginBottom: 10 }}
        allowClear
      >
        {(categories || []).map((cat) => (
          <Option key={cat._id || cat} value={cat._id || cat}>
            {cat.name || cat}
          </Option>
        ))}
      </Select>

      {/* 💰 Giá mặc định */}
      {/* <InputNumber
        placeholder="Giá mặc định"
        value={editProduct?.price}
        onChange={(value) => setEditProduct({ ...editProduct, price: value })}
        style={{ width: "100%", marginBottom: 10 }}
      /> */}

      {/* 🖼️ Ảnh */}
      <ImageUpload
        value={editProduct?.image}
        onChange={(url) => setEditProduct({ ...editProduct, image: url })}
      />

      <Divider style={{ margin: "12px 0" }} />

      {/* 📏 Size & Giá */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text strong>Size & Giá</Text>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddSize}
            size="small"
          >
            Thêm
          </Button>
        </div>

        {(editProduct?.sizes || []).map((size, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Input
              placeholder="Size (VD: M, L)"
              value={size.name}
              onChange={(e) =>
                handleSizeChange(index, "name", e.target.value)
              }
              style={{ flex: 1 }}
            />
            <InputNumber
              placeholder="Giá"
              value={size.price}
              onChange={(value) =>
                handleSizeChange(index, "price", value)
              }
              style={{ width: 100 }}
            />
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleRemoveSize(index)}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default EditProductModal;
