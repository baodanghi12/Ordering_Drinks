import React from "react";
import { Modal, Form, Input, InputNumber, Select, AutoComplete } from "antd";
const { Option } = Select;

const ImportModal = ({ open, onCancel, onOk, form, inventory, onValuesChange }) => {
  return (
    <Modal title="Nhập nguyên liệu mới / bổ sung" open={open} onCancel={onCancel} onOk={onOk}>
      <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
        <Form.Item
          label="Tên nguyên vật liệu"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên nguyên liệu" }]}
        >
          <AutoComplete
            placeholder="Nhập tên nguyên liệu"
            options={inventory.map((i) => ({ value: i.name }))}
          />
        </Form.Item>

        <Form.Item
          label="Số lượng tồn (đơn vị lớn)"
          name="stock"
          rules={[{ required: true, message: "Nhập số lượng tồn kho" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} placeholder="VD: 10 hộp / 20 bịch" />
        </Form.Item>

        <Form.Item
          label="Đơn vị tồn kho"
          name="unit"
          rules={[{ required: true, message: "Chọn đơn vị tồn kho" }]}
        >
          <Select placeholder="VD: hộp / lon / bịch / cái">
            <Option value="hộp">Hộp</Option>
            <Option value="lon">Lon</Option>
            <Option value="bịch">Bịch</Option>
            <Option value="chai">Chai</Option>
            <Option value="thùng">Thùng</Option>
            <Option value="cái">Cái</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Hàm lượng / 1 đơn vị"
          name="unitWeight"
          rules={[{ required: true, message: "Nhập hàm lượng trong 1 đơn vị" }]}
          extra="VD: 500 (gram), 380 (ml), 1 (cái)"
        >
          <InputNumber min={0} style={{ width: "100%" }} placeholder="VD: 500 / 380 / 1000" />
        </Form.Item>

        <Form.Item
          label="Đơn vị dùng trong công thức"
          name="usageUnit"
          rules={[{ required: true, message: "Chọn đơn vị sử dụng trong công thức" }]}
        >
          <Select placeholder="VD: ml / gram / cái">
            <Option value="ml">ml</Option>
            <Option value="gram">gram</Option>
            <Option value="cái">cái</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Giá vốn / đơn vị"
          name="cost_per_unit"
          rules={[{ required: true, message: "Nhập giá vốn/đơn vị" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} placeholder="VD: 40000" />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input placeholder="VD: 1 hộp = 1000ml, hoặc dùng hết 1 lon / ly" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ImportModal;
