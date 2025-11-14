// components/ExpenseManagement.jsx
import React, { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchExpenses, createExpense } from "../services/api";
import ExpenseDetailModal from "../modals/ExpenseDetailModal";

const { Option } = Select;

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [form] = Form.useForm();

  const categories = [
    { value: "salary", label: "Lương nhân viên" },
    { value: "electricity", label: "Tiền điện" },
    { value: "water", label: "Tiền nước" },
    { value: "rent", label: "Tiền thuê mặt bằng" },
    { value: "internet", label: "Internet" },
    { value: "other", label: "Chi phí khác" }
  ];

  // Danh sách các danh mục cần tự động chọn tháng trước
  const autoPreviousMonthCategories = ["salary", "electricity", "water", "rent", "internet"];

  const fetchExpensesData = async () => {
    setLoading(true);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (error) {
      message.error("Lỗi khi tải danh sách chi phí");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (values) => {
    try {
      await createExpense(values);
      message.success("Thêm chi phí thành công");
      setModalVisible(false);
      form.resetFields();
      fetchExpensesData();
    } catch (error) {
      message.error("Lỗi khi thêm chi phí: " + error.message);
    }
  };

  const handleCategoryChange = (category) => {
    const currentDate = form.getFieldValue('date') || dayjs();
    
    // Nếu là danh mục cần tự động chọn tháng trước
    if (autoPreviousMonthCategories.includes(category)) {
      const previousMonth = currentDate.subtract(1, 'month');
      form.setFieldsValue({
        period: previousMonth
      });
    } else {
      // Reset về tháng hiện tại cho các danh mục khác
      form.setFieldsValue({
        period: currentDate
      });
    }
  };

  const handleDateChange = (date) => {
    if (date) {
      const currentCategory = form.getFieldValue('category');
      
      // Nếu là danh mục cần tự động chọn tháng trước
      if (autoPreviousMonthCategories.includes(currentCategory)) {
        // Kỳ tính = ngày chi phí - 1 tháng
        const previousMonth = date.subtract(1, 'month');
        form.setFieldsValue({
          period: previousMonth
        });
      } else {
        // Với danh mục khác, kỳ tính = tháng của ngày chi phí
        form.setFieldsValue({
          period: date
        });
      }
    }
  };

  const handleRowClick = (record) => {
    setSelectedExpense(record);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedExpense(null);
  };

  useEffect(() => {
    fetchExpensesData();
  }, []);

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "invoiceId",
      key: "invoiceId",
      render: (invoiceId) => {
        if (!invoiceId) return "-";
        const lastFourChars = invoiceId.slice(-4);
        return `EXP - ${lastFourChars}`;
      },
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      responsive: ["md"],
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (category) => {
        const categoryMap = {
          salary: "Lương nhân viên",
          electricity: "Tiền điện",
          water: "Tiền nước",
          rent: "Tiền thuê",
          internet: "Internet",
          other: "Khác"
        };
        return categoryMap[category] || category;
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      responsive: ["md"],
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `${amount?.toLocaleString("vi-VN")}₫`,
      align: "right",
    },
  ];

  return (
    <div style={{ padding: "1rem" }}>
      <Card
        title="Quản lý Chi phí"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Thêm chi phí
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={expenses}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>

      {/* Modal thêm chi phí */}
      <Modal
        title="Thêm chi phí mới"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateExpense}
          initialValues={{ 
            date: dayjs(),
            period: dayjs().subtract(1, 'month') // 🆕 Mặc định là tháng trước
          }}
        >
          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select 
              placeholder="Chọn danh mục chi phí"
              onChange={handleCategoryChange}
            >
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input placeholder="VD: Tiền điện tháng 11, Lương nhân viên..." />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Số tiền"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập số tiền"
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="Ngày chi phí"
          >
            <DatePicker 
              style={{ width: "100%" }} 
              format="DD/MM/YYYY" 
              onChange={handleDateChange}
            />
          </Form.Item>
          
          <Form.Item
            name="period"
            label="Kỳ tính"
            rules={[{ required: true, message: "Vui lòng chọn kỳ tính" }]}
          >
            <DatePicker 
              picker="month" 
              format="MM/YYYY" 
              style={{ width: "100%" }} 
              placeholder="Chọn kỳ tính"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
              Lưu
            </Button>
            <Button onClick={() => setModalVisible(false)}>
              Hủy
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <ExpenseDetailModal
        visible={detailModalVisible}
        expense={selectedExpense}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
};

export default ExpenseManagement;