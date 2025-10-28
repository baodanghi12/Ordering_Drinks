import React from "react";
import { Modal, Descriptions } from "antd";

const IngredientDetailModal = ({ open, onClose, ingredient }) => {
  if (!ingredient) return null;

  // ✅ Kiểm tra xem có cần quy đổi không
  const isConvertible = ingredient.unit !== ingredient.usageUnit;

  // ✅ Tính tổng trọng lượng còn lại (nếu có quy đổi)
  const totalUsageWeight = isConvertible
    ? (ingredient.stock || 0) * (ingredient.unitWeight || 0) +
      (ingredient.remainingWeight || 0)
    : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={`Thông tin chi tiết: ${ingredient.name}`}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Tên">{ingredient.name}</Descriptions.Item>
        <Descriptions.Item label="Đơn vị chính">{ingredient.unit}</Descriptions.Item>
        <Descriptions.Item label="Đơn vị sử dụng">{ingredient.usageUnit}</Descriptions.Item>
        <Descriptions.Item label="Tồn kho hiện tại">
          {ingredient.stock} {ingredient.unit}
        </Descriptions.Item>

        <Descriptions.Item label="Trọng lượng mỗi đơn vị">
          {ingredient.unitWeight} {ingredient.usageUnit}
        </Descriptions.Item>

        {/* ✅ Chỉ hiển thị khi có quy đổi */}
        {isConvertible && (
          <>
            <Descriptions.Item label="Trọng lượng còn lại (đang dùng)">
              {ingredient.remainingWeight} {ingredient.usageUnit}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng trọng lượng còn lại">
              {totalUsageWeight} {ingredient.usageUnit}
            </Descriptions.Item>
          </>
        )}

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
