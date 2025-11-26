// modals/BuyXGetYPromotionForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Select, DatePicker, Switch, Input, Row, Col, Alert, Spin, Card, Tag, message } from 'antd';
import { InfoCircleOutlined, BulbOutlined, FireOutlined, StockOutlined } from '@ant-design/icons';
import { fetchProducts, getAverageProductCost } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const BuyXGetYPromotionForm = ({ form, onFormChange, initialData }) => {
  const [applicableScope, setApplicableScope] = useState('all');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [costStats, setCostStats] = useState(null);

  // Load dữ liệu THỰC TẾ từ database products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsData, costData] = await Promise.all([
          fetchProducts(),
          getAverageProductCost()
        ]);

        // Format products data với thông tin size
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

        // Tạo gợi ý ban đầu
        generateSuggestions('all', formattedProducts, costData);

      } catch (error) {
        console.error('❌ Lỗi khi tải dữ liệu từ database:', error);
        message.error('Không thể tải dữ liệu từ server');
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (form) {
      loadData();
    }
  }, [form]);
   // 🚨 THÊM useEffect ĐỂ XỬ LÝ INITIAL DATA KHI EDIT
  useEffect(() => {
    if (initialData && products.length > 0) {
      // Xử lý dữ liệu khi edit promotion
      const formValues = {
        buyX: initialData.buyX,
        getY: initialData.getY,
        applicableScope: initialData.applicableScope || 'all',
        minOrderValue: initialData.minOrderValue || 0
      };

      // 🚨 XỬ LÝ SẢN PHẨM KHI EDIT
      if (initialData.applicableScope === 'specific') {
        if (initialData.buyProducts && Array.isArray(initialData.buyProducts)) {
          formValues.buyProducts = initialData.buyProducts.map(item => {
            // Tạo ID duy nhất: "productId_size"
            return `${item.productId}_${item.size}`;
          });
        }
        
        if (initialData.getProducts && Array.isArray(initialData.getProducts)) {
          formValues.getProducts = initialData.getProducts.map(item => {
            // Tạo ID duy nhất: "productId_size"
            return `${item.productId}_${item.size}`;
          });
        }
      }

      form.setFieldsValue(formValues);
      setApplicableScope(initialData.applicableScope || 'all');
    }
  }, [initialData, products, form]);

  // Hàm xác định sản phẩm bán chạy
  const determinePopularity = (product) => {
    const profitMargin = product.price > 0 && product.sizes?.[0]?.cost > 0 
      ? (product.price - product.sizes[0].cost) / product.price 
      : 0;
    
    return profitMargin > 0.3;
  };

  // Tạo gợi ý thông minh DỰA TRÊN DỮ LIỆU THỰC
  const generateSuggestions = (scope, productsList, costData) => {
    const avgCost = costData?.averageCost || 25000;
    const avgPrice = costData?.averagePrice || 45000;
    const profitMargin = costData?.profitMargin || 0.3;

    let suggestion = {
      buyX: 2,
      getY: 1,
      maxDiscountPercent: Math.min(40, Math.floor(profitMargin * 100)),
      maxUsesPerCustomer: 3,
      minOrderValue: 0,
      message: '',
      type: 'default',
      basedOnRealData: true
    };

    const popularProducts = productsList.filter(p => p.isPopular);
    const slowMovingProducts = productsList.filter(p => !p.isPopular && p.cost > 0);

    switch (scope) {
      case 'all':
        suggestion.buyX = 2;
        suggestion.getY = 1;
        suggestion.minOrderValue = Math.round(avgPrice * 1.2);
        suggestion.message = `Dựa trên dữ liệu thực tế (${costData?.productCount || 0} sản phẩm), hệ thống gợi ý mua ${suggestion.buyX} tặng ${suggestion.getY}. Chi phí trung bình: ${avgCost.toLocaleString()}đ, Giá bán trung bình: ${avgPrice.toLocaleString()}đ.`;
        break;

      case 'category':
        if (popularProducts.length > 0) {
          suggestion.buyX = 2;
          suggestion.getY = 1;
          suggestion.message = `Gợi ý mua ${suggestion.buyX} tặng ${suggestion.getY} cho ${popularProducts.length} danh mục bán chạy. Lợi nhuận cho phép: ${suggestion.maxDiscountPercent}%.`;
          suggestion.type = 'popular';
        } else {
          suggestion.buyX = 3;
          suggestion.getY = 1;
          suggestion.message = `Gợi ý mua ${suggestion.buyX} tặng ${suggestion.getY} để kích cầu danh mục. Tận dụng chi phí thấp (${avgCost.toLocaleString()}đ).`;
          suggestion.type = 'promotional';
        }
        break;

      case 'specific':
        if (slowMovingProducts.length > 0) {
          suggestion.buyX = 3;
          suggestion.getY = 1;
          const slowProductNames = slowMovingProducts.slice(0, 3).map(p => p.name).join(', ');
          suggestion.message = `Gợi ý mua ${suggestion.buyX} tặng ${suggestion.getY} cho ${slowMovingProducts.length} sản phẩm tồn kho (${slowProductNames}${slowMovingProducts.length > 3 ? '...' : ''}).`;
          suggestion.type = 'clearance';
        } else {
          suggestion.buyX = 2;
          suggestion.getY = 1;
          suggestion.message = `Gợi ý mua ${suggestion.buyX} tặng ${suggestion.getY} cho sản phẩm phổ biến. Dựa trên ${productsList.length} sản phẩm có sẵn.`;
          suggestion.type = 'popular';
        }
        break;
    }

    // Tính toán giá trị tối thiểu đơn hàng dựa trên break-even THỰC TẾ
    const totalCost = (suggestion.buyX + suggestion.getY) * avgCost;
    const breakEvenPrice = totalCost / (1 - profitMargin);
    suggestion.minOrderValue = Math.max(suggestion.minOrderValue, Math.round(breakEvenPrice));
    
    // Thêm thông tin chi phí vào message
    suggestion.message += ` Đơn tối thiểu đề xuất: ${suggestion.minOrderValue.toLocaleString()}đ.`;

    setSuggestions(suggestion);
    
    // Tự động điền giá trị gợi ý vào form
    if (form) {
      form.setFieldsValue({
        buyX: suggestion.buyX,
        getY: suggestion.getY,
        minOrderValue: suggestion.minOrderValue
      });
    }
  };

  const handleScopeChange = (value) => {
    setApplicableScope(value);
    
    // 🚨 QUAN TRỌNG: Cập nhật applicableScope vào form
    form.setFieldsValue({
      applicableScope: value, // 🚨 THÊM DÒNG NÀY
      buyCategories: undefined,
      getCategories: undefined,
      buyProducts: undefined,
      getProducts: undefined
    });

    if (products.length > 0 && costStats) {
      generateSuggestions(value, products, costStats);
    }

    // Thông báo thay đổi form
    if (onFormChange) {
      onFormChange();
    }
  };

  // Xử lý thay đổi các trường quan trọng
  const handleFieldChange = () => {
    if (onFormChange) {
      onFormChange();
    }
  };

  // Hàm hiển thị tên sản phẩm với size - PHIÊN BẢN CẢI TIẾN
const getProductDisplayName = (product, size = null) => {
  if (size) {
    // Hiển thị cho từng size cụ thể
    return `${product.name} - Size ${size.name} (${size.price.toLocaleString()}đ)`;
  }
  
  // Hiển thị chung cho product (giữ nguyên cho các trường hợp khác)
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

// Hàm tạo options cho Select - PHIÊN BẢN MỚI
const renderProductOptions = (products, showSizes = true) => {
  if (!showSizes) {
    return products.map(product => (
      <Option key={product.id} value={product.id}>
        {getProductDisplayName(product)}
        {product.isPopular && <Tag color="red" style={{ marginLeft: 8, fontSize: '10px' }}>Bán chạy</Tag>}
      </Option>
    ));
  }

  // Tạo options theo từng size
  const options = [];
  products.forEach(product => {
    if (product.sizes && product.sizes.length > 0) {
      product.sizes.forEach(size => {
        const sizeId = `${product.id}_${size.name}`; // Tạo ID duy nhất cho mỗi size
        options.push(
          <Option key={sizeId} value={sizeId}>
            {getProductDisplayName(product, size)}
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
            {getIcon()} Gợi ý thông minh
            <Tag color={getColor()} style={{ marginLeft: 8 }}>
              {suggestions.type === 'popular' ? 'Bán chạy' : 
               suggestions.type === 'promotional' ? 'Khuyến mãi' : 'Tồn kho'}
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
            <Tag icon={<FireOutlined />} color="blue">
              Mua {suggestions.buyX} tặng {suggestions.getY}
            </Tag>
            <Tag icon={<InfoCircleOutlined />} color="green">
              Giá trị quà ≤ {suggestions.maxDiscountPercent}% giá mua
            </Tag>
            <Tag icon={<BulbOutlined />} color="orange">
              Tối đa {suggestions.maxUsesPerCustomer} lần/khách
            </Tag>
            {suggestions.minOrderValue > 0 && (
              <Tag icon={<StockOutlined />} color="purple">
                Đơn tối thiểu: {suggestions.minOrderValue.toLocaleString()}đ
              </Tag>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Đang tải dữ liệu thực tế từ database..." />
      </div>
    );
  }

  return (
    <div>
      {renderSmartSuggestions()}

      {products.length > 0 ? (
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <Form.Item
              name="buyX"
              label="Mua (X)"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng mua' }]}
              tooltip="Số lượng sản phẩm cần mua để được tặng"
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="Số lượng mua"
                min={1}
                max={100}
                onChange={handleFieldChange}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="getY"
              label="Tặng (Y)"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng tặng' }]}
              tooltip="Số lượng sản phẩm được tặng"
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="Số lượng tặng"
                min={1}
                max={100}
                onChange={handleFieldChange}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="applicableScope"
              label="Áp dụng cho"
              rules={[{ required: true, message: 'Vui lòng chọn phạm vi áp dụng' }]}
              initialValue="all"
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
            <>
              <Col span={24}>
                <Form.Item
                  name="buyCategories"
                  label="Danh mục mua"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục mua' }]}
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder={categories.length === 0 ? "Không có danh mục nào" : "Chọn danh mục mua"}
                    allowClear
                    onChange={handleFieldChange}
                  >
                    {categories.map(category => (
                      <Option key={category.id} value={category.name}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="getCategories"
                  label="Danh mục tặng"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục tặng' }]}
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder={categories.length === 0 ? "Không có danh mục nào" : "Chọn danh mục tặng"}
                    allowClear
                    onChange={handleFieldChange}
                  >
                    {categories.map(category => (
                      <Option key={category.id} value={category.name}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </>
          )}

          {/* Khi chọn Sản phẩm cụ thể */}
          {applicableScope === 'specific' && (
  <>
    <Col span={24}>
      <Form.Item
        name="buyProducts"
        label="Sản phẩm mua (theo size)"
        rules={[{ required: true, message: 'Vui lòng chọn sản phẩm mua' }]}
        tooltip="Chọn sản phẩm cụ thể theo size để áp dụng khuyến mãi"
      >
        <Select
          mode="multiple"
          size="large"
          placeholder="Chọn sản phẩm và size mua"
          allowClear
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          onChange={handleFieldChange}
        >
          {renderProductOptions(products, true)}
        </Select>
      </Form.Item>
    </Col>
    <Col span={24}>
      <Form.Item
        name="getProducts"
        label="Sản phẩm tặng (theo size)"
        rules={[{ required: true, message: 'Vui lòng chọn sản phẩm tặng' }]}
        tooltip="Chọn sản phẩm cụ thể theo size để làm quà tặng"
      >
        <Select
          mode="multiple"
          size="large"
          placeholder="Chọn sản phẩm và size tặng"
          allowClear
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          onChange={handleFieldChange}
        >
          {renderProductOptions(products, true)}
        </Select>
      </Form.Item>
    </Col>
  </>
)}

          <Col span={24}>
            <Form.Item
              name="minOrderValue"
              label="Đơn hàng tối thiểu (đ)"
              tooltip="Giá trị đơn hàng tối thiểu để được áp dụng khuyến mãi"
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder="Nhập giá trị đơn hàng tối thiểu"
                min={0}
                formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ' : ''}
                parser={value => value ? value.replace(/\$\s?|(,*|đ)/g, '') : ''}
                onChange={handleFieldChange}
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
                onChange={handleFieldChange}
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
                onChange={handleFieldChange}
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
                onChange={handleFieldChange}
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
                checkedChildren="Bật" 
                unCheckedChildren="Tắt" 
                defaultChecked 
                onChange={handleFieldChange}
              />
            </Form.Item>
          </Col>
        </Row>
      ) : (
        <Alert
          message="Không có dữ liệu sản phẩm"
          description="Vui lòng thêm sản phẩm trước khi tạo khuyến mãi Mua X Tặng Y."
          type="warning"
          showIcon
        />
      )}
    </div>
  );
};

export default BuyXGetYPromotionForm;