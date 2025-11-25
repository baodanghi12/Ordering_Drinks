// modals/DiscountPromotionForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Select, DatePicker, Switch, Input, Row, Col, Alert, Spin, Button, Tooltip, message, Card, Tag } from 'antd';
import { DollarOutlined, CalendarOutlined, FireOutlined, BulbOutlined, StockOutlined } from '@ant-design/icons';
import { fetchProducts } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const DiscountPromotionForm = ({ form }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const applicableScope = Form.useWatch('applicableScope', form) || 'all';
  const [suggestions, setSuggestions] = useState(null);

  const discountType = Form.useWatch('discountType', form);
  
 // Load dữ liệu sản phẩm và danh mục
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try { 
        const productsData = await fetchProducts();
        
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

        console.log('📊 Products loaded:', formattedProducts.length);
        console.log('🏷️ Categories loaded:', formattedCategories.length);

      } catch (error) {
        console.error('❌ Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 🚨 THÊM: Tự động generate suggestions khi applicableScope thay đổi
  useEffect(() => {
    generateSuggestions();
  }, [applicableScope, products, categories]);

  // Hàm xác định sản phẩm bán chạy
  const determinePopularity = (product) => {
    const profitMargin = product.price > 0 && product.sizes?.[0]?.cost > 0 
      ? (product.price - product.sizes[0].cost) / product.price 
      : 0;
    
    return profitMargin > 0.3;
  };

  // Tạo gợi ý thông minh
  const generateSuggestions = () => {
    const popularProducts = products.filter(p => p.isPopular);
    const slowMovingProducts = products.filter(p => !p.isPopular && p.cost > 0);

    let suggestion = {
      message: '',
      type: 'default',
    };

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

    setSuggestions(suggestion);
  };

  // 🚨 SỬA: Cập nhật form thay vì state local
  const handleScopeChange = (value) => {
    form.setFieldsValue({
      applicableScope: value,
      applicableCategories: undefined,
      applicableProducts: undefined
    });
    
  };

  // Hiển thị thẻ gợi ý thông minh
  const renderSmartSuggestions = () => {
    if (!suggestions || loading) return null;

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
          </span>
        }
      >
        <div style={{ lineHeight: 1.6 }}>
          <p style={{ margin: 0, fontSize: '13px' }}>{suggestions.message}</p>
        </div>
      </Card>
    );
  };

  // Hiển thị tên sản phẩm với size
  const getProductDisplayName = (product) => {
    let displayName = product.name;
    
    if (product.sizes && product.sizes.length > 0) {
      const sizeNames = product.sizes.map(size => size.name).join(', ');
      displayName += ` (${sizeNames})`;
    } else if (product.price && product.price > 0) {
      displayName += ` (${product.price.toLocaleString()}đ)`;
    }
    
    if (product.category) {
      displayName += ` - ${product.category}`;
    }
    
    return displayName;
  };

  return (
    <div>
      <Spin spinning={loading}>
        {renderSmartSuggestions()}

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

          {/* 🚨 THÊM PHẦN ÁP DỤNG CHO */}
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
                label="Sản phẩm áp dụng"
                rules={[{ required: true, message: 'Vui lòng chọn sản phẩm áp dụng' }]}
              >
                <Select
                  mode="multiple"
                  size="large"
                  placeholder="Chọn sản phẩm áp dụng"
                  allowClear
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {products.map(product => (
                    <Option key={product.id} value={product.id}>
                      {getProductDisplayName(product)}
                      {product.isPopular && <Tag color="red" style={{ marginLeft: 8, fontSize: '10px' }}>Bán chạy</Tag>}
                    </Option>
                  ))}
                </Select>
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
      </Spin>
    </div>
  );
};

export default DiscountPromotionForm;