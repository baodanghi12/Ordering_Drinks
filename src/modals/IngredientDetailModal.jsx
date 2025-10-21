// src/modals/IngredientDetailModal.jsx
import React from "react";
import { Modal, Descriptions } from "antd";

const IngredientDetailModal = ({ open, onClose, ingredient }) => {
  if (!ingredient) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={`Thông tin chi tiết: ${ingredient.name}`}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Tên">{ingredient.name}</Descriptions.Item>
        <Descriptions.Item label="Đơn vị">{ingredient.unit}</Descriptions.Item>
        <Descriptions.Item label="Số lượng tồn">{ingredient.stock}</Descriptions.Item>
        <Descriptions.Item label="Trọng lượng mỗi đơn vị">{ingredient.unitWeight} {ingredient.usageUnit}</Descriptions.Item>
        <Descriptions.Item label="Trọng lượng còn lại">{ingredient.remainingWeight} {ingredient.usageUnit}</Descriptions.Item>
        <Descriptions.Item label="Giá vốn trung bình">
          {(ingredient.cost_per_unit || 0).toLocaleString()} ₫
        </Descriptions.Item>
        <Descriptions.Item label="Tổng giá vốn ước tính">
          {(
            (ingredient.stock || 0) * (ingredient.cost_per_unit || 0)
          ).toLocaleString()} ₫
        </Descriptions.Item>
        {ingredient.note && (
          <Descriptions.Item label="Ghi chú">{ingredient.note}</Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};

export default IngredientDetailModal;
