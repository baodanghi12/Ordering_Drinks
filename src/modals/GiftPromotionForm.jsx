// modals/GiftPromotionForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Select, DatePicker, Switch, Input, Row, Col, Alert, Spin, Button, Tooltip, message } from 'antd';
import { GiftOutlined, InfoCircleOutlined, CalculatorOutlined, WarningOutlined } from '@ant-design/icons';
import { fetchInventory, fetchOrders } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const GiftPromotionForm = ({ form }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [minOrderWarning, setMinOrderWarning] = useState('');
  const [recommendedValue, setRecommendedValue] = useState(null);

  // Load dữ liệu từ kho và thống kê đơn hàng
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load inventory
        const inventoryData = await fetchInventory();
        
        // Load orders để tính giá trị đơn hàng trung bình
        const orders = await fetchOrders();
        calculateOrderStats(orders);
        
        // Lọc các items có thể dùng làm quà tặng
        const giftItems = inventoryData.filter(item => {
          const quantity = item.stock || 0;
          return quantity > 0 && item.name && item.name.trim() !== '';
        });
        
        setInventoryItems(giftItems);
        console.log('📦 Inventory items loaded:', giftItems.length);
      } catch (error) {
        console.error('❌ Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Theo dõi các giá trị form
  const minOrderValue = Form.useWatch('minOrderValue', form);
  const giftValue = Form.useWatch('giftValue', form);
  const giftQuantity = Form.useWatch('giftQuantity', form);
  const giftItemId = Form.useWatch('giftItemId', form);

  useEffect(() => {
    if (giftItemId && orderStats) {
      calculateRecommendedValue();
    }
  }, [giftItemId, giftQuantity, orderStats]);

  useEffect(() => {
    if (minOrderValue && recommendedValue) {
      checkMinOrderCondition();
    }
  }, [minOrderValue, recommendedValue]);

  // Tính toán giá trị khuyến nghị - FIXED
  const calculateRecommendedValue = () => {
    if (!giftItemId || !orderStats) {
      console.log('❌ Missing data for calculation:', { giftItemId, orderStats });
      setRecommendedValue(null);
      return;
    }

    const selectedItem = inventoryItems.find(item => item._id === giftItemId);
    if (!selectedItem) {
      console.log('❌ Selected item not found:', giftItemId);
      setRecommendedValue(null);
      return;
    }

    const giftCost = getItemCost(selectedItem);
    const currentGiftQuantity = giftQuantity || 1;
    const totalGiftCost = giftCost * currentGiftQuantity;
    const avgOrderValue = orderStats.averageOrderValue;

    console.log('🧮 Calculation inputs:', {
      giftCost,
      currentGiftQuantity,
      totalGiftCost,
      avgOrderValue
    });

    // Tính hệ số an toàn
    const giftCostRatio = totalGiftCost / avgOrderValue;
    
    let safetyFactor = 1.5;
    if (giftCostRatio < 0.1) {
      safetyFactor = 1.3;
    } else if (giftCostRatio > 0.25) {
      safetyFactor = 1.8;
    }

    // Công thức tính toán
    const calculatedValue = Math.round(avgOrderValue + (totalGiftCost * safetyFactor));
    const finalRecommendedValue = Math.max(calculatedValue, Math.round(avgOrderValue * 1.1));

    console.log('✅ Recommended value calculated:', {
      giftCostRatio: Math.round(giftCostRatio * 100) + '%',
      safetyFactor,
      calculatedValue,
      finalRecommendedValue
    });

    setRecommendedValue(finalRecommendedValue);
  };

  // Kiểm tra điều kiện đơn hàng tối thiểu
  const checkMinOrderCondition = () => {
    if (!minOrderValue || !recommendedValue) {
      setMinOrderWarning('');
      return;
    }

    if (minOrderValue < recommendedValue) {
      setMinOrderWarning(`⚠️ Giá trị này THẤP HƠN đề xuất (${recommendedValue.toLocaleString()}đ). Có thể ảnh hưởng đến lợi nhuận.`);
    } else if (minOrderValue > recommendedValue * 1.5) {
      setMinOrderWarning(`⚠️ Giá trị này CAO HƠN nhiều so với đề xuất. Có thể ít khách hàng đạt được.`);
    } else if (minOrderValue >= recommendedValue && minOrderValue <= recommendedValue * 1.2) {
      setMinOrderWarning(`✅ Giá trị HỢP LÝ. Đảm bảo lợi nhuận và khuyến khích mua hàng.`);
    } else {
      setMinOrderWarning('');
    }
  };

  // Tính toán thống kê đơn hàng từ dữ liệu thực
  const calculateOrderStats = (orders) => {
    if (!orders || orders.length === 0) {
      setOrderStats({
        averageOrderValue: 45000,
        totalOrders: 0,
        completedOrders: 0
      });
      return;
    }

    const completedOrders = orders.filter(order => order.status === 'completed');
    
    let totalRevenue = 0;
    let validOrders = 0;

    completedOrders.forEach(order => {
      let orderValue = 0;
      
      if (order.total && order.total > 0) {
        orderValue = order.total;
      }
      else if (order.summary && order.summary.total_revenue > 0) {
        orderValue = order.summary.total_revenue;
      }

      if (orderValue > 0) {
        totalRevenue += orderValue;
        validOrders++;
      }
    });

    const averageOrderValue = validOrders > 0 ? totalRevenue / validOrders : 45000;

    console.log('📊 Thống kê đơn hàng thực tế:', {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      validOrders: validOrders,
      totalRevenue: Math.round(totalRevenue),
      averageOrderValue: Math.round(averageOrderValue)
    });

    setOrderStats({
      averageOrderValue: Math.round(averageOrderValue),
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      validOrders: validOrders
    });
  };

  // Xử lý khi chọn quà tặng
  const handleGiftChange = (value) => {
    const selectedItem = inventoryItems.find(item => item._id === value);
    setSelectedGift(selectedItem);
    
    if (selectedItem) {
      const quantity = getItemQuantity(selectedItem);
      const unitCost = getItemCost(selectedItem);
      
      form.setFieldsValue({
        giftQuantity: 1,
        giftValue: unitCost
      });
      
      form.setFieldsValue({
        giftName: selectedItem.name
      });

      console.log('🎁 Gift selected:', selectedItem.name, 'Cost:', unitCost);
    }
  };

  // Lấy số lượng thực tế từ item
  const getItemQuantity = (item) => {
    return item.stock || 0;
  };

  // Lấy giá trị từ item
  const getItemCost = (item) => {
    return item.cost_per_unit || item.averageCostPerUnit || 0;
  };

  return (
    <div>
      <Spin spinning={loading}>
        <Row gutter={[16, 0]}>
          <Col span={24}>
            <Form.Item
              name="giftItemId"
              label="Chọn quà tặng từ kho"
              rules={[{ required: true, message: 'Vui lòng chọn quà tặng từ kho' }]}
            >
              <Select
                size="large"
                placeholder={loading ? "Đang tải dữ liệu kho..." : "Chọn quà tặng từ kho..."}
                onChange={handleGiftChange}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                notFoundContent={
                  loading ? 
                    <Spin size="small" /> : 
                    inventoryItems.length === 0 ? 
                      "Không có quà tặng trong kho" : 
                      "Không tìm thấy quà tặng"
                }
                allowClear
              >
                {inventoryItems.map(item => (
                  <Option key={item._id} value={item._id}>
                    {item.name} - Tồn: {getItemQuantity(item)} - Giá: {getItemCost(item).toLocaleString()}đ
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24} style={{ display: 'none' }}>
            <Form.Item
              name="giftName"
              label="Tên quà tặng (tự động)"
            >
              <Input disabled />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="giftQuantity"
              label={`SL ${selectedGift ? `(tồn: ${getItemQuantity(selectedGift)})` : ''}`}
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng quà' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value < 1) {
                      return Promise.reject(new Error('Số lượng phải lớn hơn 0'));
                    }
                    
                    const giftItemId = getFieldValue('giftItemId');
                    const selectedItem = inventoryItems.find(item => item._id === giftItemId);
                    
                    if (!selectedItem) return Promise.resolve();
                    
                    const availableQuantity = getItemQuantity(selectedItem);
                    if (value > availableQuantity) {
                      return Promise.reject(new Error(`Số lượng vượt quá tồn kho (${availableQuantity})`));
                    }
                    
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="Số lượng quà"
                min={1}
                max={selectedGift ? getItemQuantity(selectedGift) : 1000}
                disabled={!selectedGift}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="giftValue"
              label="Giá trị (VND)"
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="Giá trị tự động"
                min={0}
                disabled
                formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ' : ''}
                parser={value => value ? value.replace(/\$\s?|(,*|đ)/g, '') : ''}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="minOrderValue"
              label={
                <span>
                  Giá tối thiểu (đ) - khuyến khích: {
                    recommendedValue ? 
                      `${recommendedValue.toLocaleString()}đ` : 
                      'đang tính...'
                  }
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập giá trị đơn hàng tối thiểu' }]}
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder={
                  recommendedValue ? 
                    `Nhập giá trị (khuyến nghị: ${recommendedValue.toLocaleString()}đ)` : 
                    'Chọn quà tặng để tính toán giá trị khuyến nghị'
                }
                min={0}
                formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ' : ''}
                parser={value => value ? value.replace(/\$\s?|(,*|đ)/g, '') : ''}
              />
            </Form.Item>
            
            {minOrderWarning && (
              <div style={{ marginTop: '8px' }}>
                <Alert
                  message={
                    <span style={{ 
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {minOrderWarning.includes('✅') ? (
                        <InfoCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <WarningOutlined style={{ color: '#faad14' }} />
                      )}
                      {minOrderWarning.replace('✅', '').replace('⚠️', '')}
                    </span>
                  }
                  type={minOrderWarning.includes('✅') ? 'success' : 'warning'}
                  showIcon={false}
                  style={{ 
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px'
                  }}
                />
              </div>
            )}

            {recommendedValue && selectedGift && orderStats && (
              <div style={{ marginTop: '8px' }}>
                <Alert
                  message={
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      💡 Công thức: {orderStats.averageOrderValue.toLocaleString()}đ (đơn trung bình) + 
                      ({getItemCost(selectedGift).toLocaleString()}đ × {form.getFieldValue('giftQuantity') || 1}) × 
                      {(() => {
                        const giftCost = getItemCost(selectedGift);
                        const giftQuantity = form.getFieldValue('giftQuantity') || 1;
                        const totalGiftCost = giftCost * giftQuantity;
                        const giftCostRatio = totalGiftCost / orderStats.averageOrderValue;
                        
                        let safetyFactor = 1.5;
                        if (giftCostRatio < 0.1) safetyFactor = 1.3;
                        else if (giftCostRatio > 0.25) safetyFactor = 1.8;
                        
                        return safetyFactor;
                      })()}
                    </span>
                  }
                  type="info"
                  showIcon={false}
                  style={{ 
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    backgroundColor: '#f0f8ff'
                  }}
                />
              </div>
            )}
          </Col>

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
      </Spin>
    </div>
  );
};

export default GiftPromotionForm;