// modals/BuyXGetYPromotionForm.jsx
import React from 'react';
import { Form, InputNumber, Select, DatePicker, Switch, Input, Row, Col, Alert } from 'antd';
import { ShoppingOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const BuyXGetYPromotionForm = ({ form }) => {
  return (
    <div>
      <Alert
        message="Khuyến mãi Mua X Tặng Y"
        description="Khách hàng mua X sản phẩm sẽ được tặng Y sản phẩm miễn phí"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 0]}>
        <Col span={12}>
          <Form.Item
            name="buyX"
            label="Mua (X)"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng mua' }]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="Số lượng mua"
              min={1}
              max={100}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="getY"
            label="Tặng (Y)"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng tặng' }]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="Số lượng tặng"
              min={1}
              max={100}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="applicableProducts"
            label="Sản phẩm áp dụng"
            tooltip="Chọn sản phẩm được áp dụng khuyến mãi"
          >
            <Select
              mode="multiple"
              size="large"
              placeholder="Chọn sản phẩm áp dụng"
              // options sẽ được lấy từ API sản phẩm
              options={[
                { label: 'Cà phê đen', value: 'cf_den' },
                { label: 'Cà phê sữa', value: 'cf_sua' },
                { label: 'Bạc xỉu', value: 'bac_xiu' },
                { label: 'Trà sữa', value: 'tra_sua' },
              ]}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="minOrderValue"
            label="Đơn hàng tối thiểu (đ)"
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

export default BuyXGetYPromotionForm;