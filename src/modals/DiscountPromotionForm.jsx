// modals/DiscountPromotionForm.jsx
import React from 'react';
import { Form, InputNumber, Select, DatePicker, Switch, Input, Row, Col } from 'antd';
import { DollarOutlined, CalendarOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const DiscountPromotionForm = ({ form }) => {
  const discountType = Form.useWatch('discountType', form);

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Form.Item
            name="discountType"
            label="Hình thức giảm giá"
            rules={[{ required: true, message: 'Vui lòng chọn hình thức giảm giá' }]}
          >
            <Select size="large" placeholder="Chọn hình thức giảm giá">
              <Option value="percentage">Giảm theo phần trăm (%)</Option>
              <Option value="fixed">Giảm giá cố định (đ)</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="discountValue"
            label={
              discountType === 'percentage' ? 'Phần trăm giảm giá' : 'Số tiền giảm'
            }
            rules={[{ 
              required: true, 
              message: 'Vui lòng nhập giá trị giảm' 
            }]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder={
                discountType === 'percentage' ? 'Nhập phần trăm giảm (0-100)' : 'Nhập số tiền giảm'
              }
              min={0}
              max={discountType === 'percentage' ? 100 : undefined}
              addonAfter={discountType === 'percentage' ? '%' : 'đ'}
            />
          </Form.Item>
        </Col>

        {discountType === 'percentage' && (
          <Col span={24}>
            <Form.Item
              name="maxDiscount"
              label="Giảm tối đa"
              tooltip="Giới hạn số tiền giảm tối đa cho đơn hàng (tùy chọn)"
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="Nhập số tiền giảm tối đa"
                min={0}
                addonAfter="đ"
              />
            </Form.Item>
          </Col>
        )}

        <Col span={24}>
          <Form.Item
            name="minOrderValue"
            label="Đơn hàng tối thiểu"
            tooltip="Áp dụng cho đơn hàng từ mức này trở lên (tùy chọn)"
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="Nhập giá trị đơn hàng tối thiểu"
              min={0}
              addonAfter="đ"
            />
          </Form.Item>
        </Col>

        {/* Ngày bắt đầu và kết thúc riêng biệt - gọn gàng hơn */}
        <Col span={12}>
          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Bắt đầu"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="endDate"
            label="Ngày kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
          >
            <DatePicker
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Kết thúc"
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
              placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
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

export default DiscountPromotionForm;