// components/ExpenseDetailModal.jsx
import React from "react";
import { Modal, Descriptions } from "antd";
import dayjs from "dayjs";

const ExpenseDetailModal = ({ visible, expense, onClose }) => {
  if (!expense) return null;

  const categoryMap = {
    salary: "Lương nhân viên",
    electricity: "Tiền điện",
    water: "Tiền nước",
    rent: "Tiền thuê mặt bằng",
    internet: "Internet",
    other: "Chi phí khác"
  };

  return (
    <Modal
      title="Chi tiết phiếu chi phí"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Mã phiếu">
          {expense.invoiceId || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Danh mục">
          {categoryMap[expense.category] || expense.category}
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          {expense.description || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Số tiền">
          {expense.amount?.toLocaleString("vi-VN")}₫
        </Descriptions.Item>
        <Descriptions.Item label="Kỳ tính">
          {expense.period ? dayjs(expense.period).format("MM/YYYY") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {expense.createdAt ? dayjs(expense.createdAt).format("DD/MM/YYYY HH:mm") : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default ExpenseDetailModal;