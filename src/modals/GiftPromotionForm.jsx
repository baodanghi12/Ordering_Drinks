// modals/GiftPromotionForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Select, DatePicker, Switch, Input, Row, Col, Alert, Spin, Button, Tooltip, message, Card, Tag } from 'antd';
import { GiftOutlined, InfoCircleOutlined, CalculatorOutlined, WarningOutlined, FireOutlined, BulbOutlined, StockOutlined } from '@ant-design/icons';
import { fetchInventory, fetchOrders, fetchProducts, getAverageProductCost } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const GiftPromotionForm = ({ form }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [minOrderWarning, setMinOrderWarning] = useState('');
  const [recommendedValue, setRecommendedValue] = useState(null);
  const [applicableScope, setApplicableScope] = useState('all');
  const [suggestions, setSuggestions] = useState(null);
  const [costStats, setCostStats] = useState(null);

  // Load dữ liệu từ kho và thống kê đơn hàng
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load dữ liệu song song
        const [inventoryData, ordersData, productsData, costData] = await Promise.all([
          fetchInventory(),
          fetchOrders(),
          fetchProducts(),
          getAverageProductCost()
        ]);
        
        // Load inventory
        calculateOrderStats(ordersData);
        
        // Lọc các items có thể dùng làm quà tặng
        const giftItems = inventoryData.filter(item => {
          const quantity = item.stock || 0;
          return quantity > 0 && item.name && item.name.trim() !== '';
        });
        
        setInventoryItems(giftItems);

        // Format products data
        const formattedProducts = productsData.map(product => ({
          id: product._id,
          name: product.name,
          code: product.code || `SP${product._id?.slice(-4)}`,
          category: product.category,
          sizes: product.sizes || [],
          price: product.price || 0,
          cost: product.sizes?.[0]?.cost || 0,
          isPopular: determinePopularity(product)
        }));
        
        setProducts(formattedProducts);
        setCostStats(costData);

        // Extract categories từ products
        const uniqueCategories = [...new Set(productsData
          .filter(p => p.category && p.category.trim() !== '')
          .map(p => p.category)
        )].sort();
        
        const formattedCategories = uniqueCategories.map((category, index) => ({
          id: `cat_${index + 1}`,
          name: category,
        }));
        
        setCategories(formattedCategories);

        

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
      generateSuggestions();
    }
  }, [giftItemId, giftQuantity, orderStats, applicableScope]);

  useEffect(() => {
    if (minOrderValue && recommendedValue) {
      checkMinOrderCondition();
    }
  }, [minOrderValue, recommendedValue]);

  // Hàm xác định sản phẩm bán chạy
  const determinePopularity = (product) => {
    const profitMargin = product.price > 0 && product.sizes?.[0]?.cost > 0 
      ? (product.price - product.sizes[0].cost) / product.price 
      : 0;
    
    return profitMargin > 0.3;
  };

  // Tạo gợi ý thông minh
  const generateSuggestions = () => {
    if (!selectedGift || !orderStats) return;

    const giftCost = getItemCost(selectedGift);
    const currentGiftQuantity = giftQuantity || 1;
    const totalGiftCost = giftCost * currentGiftQuantity;

    let suggestion = {
      minOrderValue: recommendedValue,
      message: '',
      type: 'default',
      basedOnRealData: true
    };

    const popularProducts = products.filter(p => p.isPopular);
    const slowMovingProducts = products.filter(p => !p.isPopular && p.cost > 0);

    switch (applicableScope) {
      case 'all':
        suggestion.message = `Áp dụng cho tất cả ${products.length} sản phẩm. Phù hợp cho chương trình khuyến mãi toàn cửa hàng.`;
        suggestion.type = 'popular';
        break;

      case 'category':
        if (popularProducts.length > 0) {
          suggestion.message = `Áp dụng cho ${categories.length} danh mục bán chạy. Tập trung vào nhóm sản phẩm có lợi nhuận cao.`;
          suggestion.type = 'popular';
        } else {
          suggestion.message = `Áp dụng cho ${categories.length} danh mục. Kích cầu toàn bộ danh mục sản phẩm.`;
          suggestion.type = 'promotional';
        }
        break;

      case 'specific':
        if (slowMovingProducts.length > 0) {
          const slowProductNames = slowMovingProducts.slice(0, 3).map(p => p.name).join(', ');
          suggestion.message = `Áp dụng cho ${slowMovingProducts.length} sản phẩm tồn kho (${slowProductNames}${slowMovingProducts.length > 3 ? '...' : ''}). Giúp giải phóng tồn kho.`;
          suggestion.type = 'clearance';
        } else {
          suggestion.message = `Áp dụng cho sản phẩm cụ thể. Lựa chọn linh hoạt theo chiến dịch marketing.`;
          suggestion.type = 'targeted';
        }
        break;
    }

    suggestion.message += ` Chi phí quà: ${totalGiftCost.toLocaleString()}đ.`;

    setSuggestions(suggestion);
  };

  const handleScopeChange = (value) => {
    setApplicableScope(value);
    form.setFieldsValue({
      applicableCategories: undefined,
      applicableProducts: undefined
    });

    generateSuggestions();
  };

  // SỬA LẠI hàm calculateRecommendedValue
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
  const avgOrderValue = orderStats.averageOrderValue;

  console.log('🧮 Calculation inputs:', {
    giftCost,
    avgOrderValue
  });

  // Tính hệ số an toàn - LUÔN tính cho 1 cái quà
  const giftCostRatio = giftCost / avgOrderValue; // CHỈ tính 1 cái
  
  let safetyFactor = 1.5;
  if (giftCostRatio < 0.1) {
    safetyFactor = 1.3;
  } else if (giftCostRatio > 0.25) {
    safetyFactor = 1.8;
  }

  // Công thức tính toán - LUÔN tính cho 1 cái quà
  const calculatedValue = Math.round(avgOrderValue + (giftCost * safetyFactor)); // CHỈ × giftCost
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

  const getProductDisplayName = (product, size = null) => {
  if (size) {
    // 🚨 HIỂN THỊ CHO TỪNG SIZE CỤ THỂ
    return `${product.name} - Size ${size.name}`;
  }
  
  // 🚨 HIỂN THỊ CHUNG CHO PRODUCT (CHO CÁC TRƯỜNG HỢP KHÁC)
  let displayName = product.name;
  if (product.sizes && product.sizes.length > 0) {
    const sizeNames = product.sizes.map(size => size.name).join(', ');
    displayName += ` (${sizeNames})`;
  }
  if (product.category) {
    displayName += ` - ${product.category}`;
  }
  return displayName;
};
// Hàm tạo options cho Select - PHIÊN BẢN MỚI CHO SIZE
const renderProductOptions = (products, showSizes = true) => {
  if (!showSizes) {
    return products.map(product => (
      <Option key={product.id} value={product.id}>
        {getProductDisplayName(product)}
        {product.isPopular && <Tag color="red" style={{ marginLeft: 8, fontSize: '10px' }}>Bán chạy</Tag>}
      </Option>
    ));
  }

  // 🚨 TẠO OPTIONS THEO TỪNG SIZE RIÊNG BIỆT
  const options = [];
  products.forEach(product => {
    if (product.sizes && product.sizes.length > 0) {
      product.sizes.forEach(size => {
        const sizeId = `${product.id}_${size.name}`; // Tạo ID duy nhất cho mỗi size
        options.push(
          <Option key={sizeId} value={sizeId}>
            {getProductDisplayName(product, size)} {/* 🚨 TRUYỀN SIZE VÀO ĐÂY */}
            {product.isPopular && <Tag color="red" style={{ marginLeft: 8, fontSize: '10px' }}>Bán chạy</Tag>}
            {!product.isPopular && <Tag color="orange" style={{ marginLeft: 8, fontSize: '10px' }}>Tồn kho</Tag>}
          </Option>
        );
      });
    } else {
      // Fallback cho sản phẩm không có size
      options.push(
        <Option key={product.id} value={product.id}>
          {getProductDisplayName(product)}
          {product.isPopular && <Tag color="red" style={{ marginLeft: 8, fontSize: '10px' }}>Bán chạy</Tag>}
        </Option>
      );
    }
  });
  return options;
};

// Thêm hàm xử lý khi field thay đổi
const handleFieldChange = () => {
  console.log('Form values changed:', form.getFieldsValue());
};
  // Hiển thị thẻ gợi ý thông minh
  const renderSmartSuggestions = () => {
    if (!suggestions || loading || !selectedGift) return null;

    const getIcon = () => {
      switch (suggestions.type) {
        case 'popular': return <FireOutlined />;
        case 'promotional': return <BulbOutlined />;
        case 'clearance': return <StockOutlined />;
        default: return <BulbOutlined />;
      }
    };

    const getColor = () => {
      switch (suggestions.type) {
        case 'popular': return 'success';
        case 'promotional': return 'warning';
        case 'clearance': return 'processing';
        default: return 'info';
      }
    };

    return (
      <Card 
        size="small" 
        style={{ marginBottom: 16, borderLeft: `4px solid ${getColor() === 'success' ? '#52c41a' : getColor() === 'warning' ? '#faad14' : '#1890ff'}` }}
        title={
          <span>
            {getIcon()} Gợi ý chiến lược
            <Tag color={getColor()} style={{ marginLeft: 8 }}>
              {suggestions.type === 'popular' ? 'Bán chạy' : 
               suggestions.type === 'promotional' ? 'Khuyến mãi' : 
               suggestions.type === 'clearance' ? 'Tồn kho' : 'Mục tiêu'}
            </Tag>
            {suggestions.basedOnRealData && (
              <Tag color="green" style={{ marginLeft: 8 }}>Dữ liệu thực tế</Tag>
            )}
          </span>
        }
      >
        <div style={{ lineHeight: 1.6 }}>
          <p style={{ margin: 0, fontSize: '13px' }}>{suggestions.message}</p>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag icon={<GiftOutlined />} color="blue">
              Quà: {selectedGift?.name}
            </Tag>
            <Tag icon={<InfoCircleOutlined />} color="green">
              Giá trị: {getItemCost(selectedGift).toLocaleString()}đ × {giftQuantity || 1}
            </Tag>
            {recommendedValue && (
              <Tag icon={<BulbOutlined />} color="orange">
                Đơn tối thiểu: {recommendedValue.toLocaleString()}đ
              </Tag>
            )}
          </div>
        </div>
      </Card>
    );
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
        {renderSmartSuggestions()}

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
                    {item.name}
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

          {/* Phần Áp dụng cho - MỚI THÊM */}
          <Col span={24}>
            <Form.Item
              name="applicableScope"
              label="Áp dụng cho"
              initialValue="all"
              rules={[{ required: true, message: 'Vui lòng chọn phạm vi áp dụng' }]}
            >
              <Select
                size="large"
                placeholder="Chọn phạm vi áp dụng"
                onChange={handleScopeChange}
              >
                <Option value="all">Toàn bộ sản phẩm</Option>
                <Option value="category">Danh mục sản phẩm</Option>
                <Option value="specific">Sản phẩm cụ thể</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Khi chọn Danh mục */}
          {applicableScope === 'category' && (
            <Col span={24}>
              <Form.Item
                name="applicableCategories"
                label="Danh mục áp dụng"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục áp dụng' }]}
              >
                <Select
                  mode="multiple"
                  size="large"
                  placeholder={categories.length === 0 ? "Không có danh mục nào" : "Chọn danh mục áp dụng"}
                  allowClear
                >
                  {categories.map(category => (
                    <Option key={category.id} value={category.name}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}

          {/* Khi chọn Sản phẩm cụ thể */}
          {applicableScope === 'specific' && (
  <Col span={24}>
    <Form.Item
      name="applicableProducts"
      label="Sản phẩm áp dụng (theo size)"
      rules={[{ required: true, message: 'Vui lòng chọn sản phẩm áp dụng' }]}
      tooltip="Chọn sản phẩm cụ thể theo size để áp dụng khuyến mãi"
    >
      <Select
        mode="multiple"
        size="large"
        placeholder="Chọn sản phẩm và size áp dụng"
        allowClear
        filterOption={(input, option) =>
          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
        onChange={handleFieldChange} // 🚨 THÊM ONCHANGE
      >
        {renderProductOptions(products, true)} {/* 🚨 SỬA THÀNH true ĐỂ HIỂN THỊ SIZE */}
      </Select>
    </Form.Item>
  </Col>
)}

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