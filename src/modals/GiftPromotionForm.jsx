// modals/GiftPromotionForm.jsx
import React from 'react';
import { Form, InputNumber, Select, DatePicker, Switch, Input, Row, Col, Alert } from 'antd';
import { GiftOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const GiftPromotionForm = ({ form }) => {
  return (
    <div>
      <Alert
        message="Khuyến mãi Quà tặng"
        description="Khách hàng sẽ nhận được quà tặng khi đạt điều kiện"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Form.Item
            name="giftName"
            label="Tên quà tặng"
            rules={[{ required: true, message: 'Vui lòng nhập tên quà tặng' }]}
          >
            <Input 
              size="large" 
              placeholder="Ví dụ: Ly sứ cao cấp, Voucher 50k..."
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="giftQuantity"
            label="Số lượng quà"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng quà' }]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="Số lượng"
              min={1}
              max={1000}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="giftValue"
            label="Giá trị quà (đ)"
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="Giá trị ước tính"
              min={0}
              formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ' : ''}
              parser={value => value ? value.replace(/\$\s?|(,*|đ)/g, '') : ''}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="minOrderValue"
            label="Đơn hàng tối thiểu để nhận quà (đ)"
            rules={[{ required: true, message: 'Vui lòng nhập giá trị đơn hàng tối thiểu' }]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="Nhập giá trị đơn hàng tối thiểu"
              min={0}
              formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ' : ''}
              parser={value => value ? value.replace(/\$\s?|(,*|đ)/g, '') : ''}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="dateRange"
            label="Thời gian áp dụng"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian áp dụng' }]}
          >
            <RangePicker
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="description"
            label="Mô tả khuyến mãi"
          >
            <TextArea
              rows={3}
              placeholder="Mô tả chi tiết về chương trình khuyến mãi và quà tặng..."
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Đang hoạt động" 
              unCheckedChildren="Đã tắt" 
              defaultChecked 
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default GiftPromotionForm;