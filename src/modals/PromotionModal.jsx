// components/PromotionModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Row,
  Col,
  Card,
  message,
  Radio,
} from 'antd';
import dayjs from 'dayjs';
import { fetchProducts, createPromotion, updatePromotion, fetchProductCosts, getBusinessStats } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const PromotionModal = ({ visible, promotion, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [promotionType, setPromotionType] = useState('discount');
  const [discountType, setDiscountType] = useState('percentage');
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedBuyProducts, setSelectedBuyProducts] = useState([]);
  const [selectedGetProducts, setSelectedGetProducts] = useState([]);
  const [applyType, setApplyType] = useState('all');
  const [productCosts, setProductCosts] = useState({});
  const [businessStats, setBusinessStats] = useState({});
  const [validationLoading, setValidationLoading] = useState(false);
  
  // 🔥 THÊM STATE MỚI cho real-time validation
  const [validationMessages, setValidationMessages] = useState({
    errors: [],
    warnings: []
  });
  // Fetch danh sách sản phẩm thực
  useEffect(() => {
    const loadProducts = async () => {
      if (visible) {
        setProductsLoading(true);
        try {
          const productsData = await fetchProducts();
          setProducts(productsData);
        } catch (error) {
          console.error('Lỗi khi tải danh sách sản phẩm:', error);
          message.error('Không thể tải danh sách sản phẩm');
        } finally {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();
  }, [visible]);
  // Thêm sau useEffect hiện tại
useEffect(() => {
  const loadCostData = async () => {
    if (visible) {
      try {
        const [costsData, statsData] = await Promise.all([
          fetchProductCosts(),
          getBusinessStats()
        ]);
        setProductCosts(costsData);
        setBusinessStats(statsData);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu chi phí:', error);
      }
    }
  };
  loadCostData();
}, [visible]);
  useEffect(() => {
    if (visible) {
      if (promotion) {
        const promotionTypeValue = promotion.buyX ? 'buy_x_get_y' : 'discount';
        
        form.setFieldsValue({
          ...promotion,
          startDate: promotion.startDate ? dayjs(promotion.startDate) : null,
          endDate: promotion.endDate ? dayjs(promotion.endDate) : null,
          promotionType: promotionTypeValue,
        });
        
        setPromotionType(promotionTypeValue);
        setDiscountType(promotion.discountType || 'percentage');
      } else {
        form.resetFields();
        setPromotionType('discount');
        setDiscountType('percentage');
      }
      // 🔥 RESET VALIDATION MESSAGES
    setValidationMessages({
      errors: [],
      warnings: []
    });
    }
  }, [visible, promotion, form]);

  const handleSubmit = async () => {
  try {
    console.log('Bắt đầu validate form...');
    const values = await form.validateFields();
    console.log('Form values:', values);
    
    // Kiểm tra tính khả thi
    const validation = await validatePromotionFeasibility(values);
    console.log('Validation result in handleSubmit:', validation);
    
    if (!validation.isValid) {
      // SỬA: Hiển thị message đúng cách
      Modal.error({
        title: 'Khuyến mãi không khả thi',
        content: (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#ff4d4f' }}>
              Khuyến mãi này sẽ gây lỗi:
            </div>
            {validation.errors.map((error, index) => (
              <div key={index} style={{ marginBottom: 4 }}>{error}</div>
            ))}
            <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
              💡 Đề xuất: Giảm số lượng tặng hoặc tăng số lượng mua
            </div>
          </div>
        ),
        okText: 'Hiểu rồi',
        width: 500,
      });
      return;
    }

    // Hiển thị cảnh báo nếu có
    if (validation.warnings.length > 0) {
      const confirmed = await new Promise((resolve) => {
        Modal.confirm({
          title: 'Cảnh báo khả thi',
          content: (
            <div>
              <div style={{ marginBottom: 8, color: '#faad14' }}>
                Khuyến mãi có thể ảnh hưởng lợi nhuận:
              </div>
              {validation.warnings.map((warning, index) => (
                <div key={index} style={{ marginBottom: 4 }}>{warning}</div>
              ))}
              <div style={{ marginTop: 8, fontWeight: 'bold', color: '#faad14' }}>
                Bạn có chắc muốn tiếp tục?
              </div>
            </div>
          ),
          okText: 'Vẫn tạo',
          cancelText: 'Kiểm tra lại',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });

      if (!confirmed) return;
    }

    setLoading(true);
    
    // 🔥 THÊM PHẦN XỬ LÝ TẠO/CẬP NHẬT KHUYẾN MÃI
    let result;
    if (promotion) {
      // Cập nhật khuyến mãi
      result = await updatePromotion(promotion._id, values);
      message.success('Cập nhật khuyến mãi thành công');
    } else {
      // Tạo khuyến mãi mới
      result = await createPromotion(values);
      message.success('Tạo khuyến mãi thành công');
    }
    
    // Gọi callback thành công
    onSuccess();
    // Đóng modal
    handleCancel();

  } catch (error) {
    console.error('Lỗi khi lưu khuyến mãi:', error);
    message.error('Lỗi khi lưu khuyến mãi');
  } finally {
    setLoading(false);
  }
};

  const handlePromotionTypeChange = (e) => {
    setPromotionType(e.target.value);
  };

  const handleDiscountTypeChange = (value) => {
    setDiscountType(value);
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };
  const handleProductSelect = (value, option) => {
  const selectedProduct = products.find(product => product._id === value);
  if (selectedProduct) {
    form.setFieldValue('getYProductName', selectedProduct.name);
  }
};

const handleBuyProductSelect = (value, option) => {
  const selectedProduct = products.find(product => product._id === value);
  if (selectedProduct) {
    form.setFieldValue('buyProductName', selectedProduct.name);
  }
};
const handleApplyTypeChange = (value) => {
  setApplyType(value);
  // Reset selected products khi thay đổi loại áp dụng
  setSelectedBuyProducts([]);
  setSelectedGetProducts([]);
  form.setFieldsValue({
    buyProducts: [],
    getProducts: []
  });
};

const handleBuyXChange = (value) => {
  // Giới hạn số lượng sản phẩm có thể chọn
  if (selectedBuyProducts.length > value) {
    const newSelected = selectedBuyProducts.slice(0, value);
    setSelectedBuyProducts(newSelected);
    form.setFieldValue('buyProducts', newSelected);
  }
};

const handleGetYChange = (value) => {
  // Giới hạn số lượng sản phẩm có thể chọn
  if (selectedGetProducts.length > value) {
    const newSelected = selectedGetProducts.slice(0, value);
    setSelectedGetProducts(newSelected);
    form.setFieldValue('getProducts', newSelected);
  }
};
const validatePromotionFeasibility = async (values) => {
  setValidationLoading(true);
  
  try {
    console.log('🔍 Validating promotion:', values);
    
    let isValid = true;
    const warnings = [];
    const errors = [];

    if (values.promotionType === 'discount') {
      const productInfo = getProductProfitInfo([]);
      console.log('📊 Product info for discount:', productInfo);
      
      if (values.discountType === 'percentage') {
        const discountRate = values.discountValue / 100;
        console.log('💯 Discount rate:', discountRate, 'Profit margin:', productInfo.avgProfitMargin);
        
        if (discountRate > productInfo.avgProfitMargin) {
          errors.push(`❌ Giảm giá ${values.discountValue}% vượt quá lợi nhuận (${(productInfo.avgProfitMargin * 100).toFixed(1)}%)`);
          isValid = false;
        } else if (discountRate > productInfo.avgProfitMargin * 0.7) {
          warnings.push(`⚠️ Giảm giá ${values.discountValue}% chiếm ${((discountRate / productInfo.avgProfitMargin) * 100).toFixed(1)}% lợi nhuận`);
        }
      }
      // ... phần còn lại của discount
    }

    else if (values.promotionType === 'buy_x_get_y') {
      console.log('🛍️ Validating buy_x_get_y:', values);
      
      const buyProductIds = values.buyProducts || [];
      const getProductIds = values.getProducts || [];
      
      const buyInfo = getProductProfitInfo(buyProductIds);
      const getInfo = getProductProfitInfo(getProductIds);
      
      console.log('📦 Buy info:', buyInfo, 'Get info:', getInfo);
      
      // Tính toán: Chi phí tặng so với lợi nhuận mua
      const totalBuyProfit = (buyInfo.avgPrice - buyInfo.avgCost) * values.buyX;
      const totalGetCost = getInfo.avgCost * values.getY;
      
      console.log('💰 Profit calculation:', {
        totalBuyProfit,
        totalGetCost,
        buyX: values.buyX,
        getY: values.getY
      });
      
      if (totalGetCost > totalBuyProfit) {
        // TÍNH đề xuất tự động
    const recommendedGetY = Math.floor(totalBuyProfit / getInfo.avgCost);
    const recommendedBuyX = Math.ceil(totalGetCost / (buyInfo.avgPrice - buyInfo.avgCost));
        errors.push(`❌ Chi phí tặng ${totalGetCost.toLocaleString()}đ > lợi nhuận mua ${totalBuyProfit.toLocaleString()}đ`);
    errors.push(`💡 Đề xuất: Mua ${values.buyX} tặng tối đa ${recommendedGetY} hoặc Mua ${recommendedBuyX} tặng ${values.getY}`);
    isValid = false;
      } else if (totalGetCost > totalBuyProfit * 0.7) {
        warnings.push(`📊 Chi phí khuyến mãi chiếm ${((totalGetCost / totalBuyProfit) * 100).toFixed(1)}% lợi nhuận`);
      }
    }

    console.log('✅ Validation result:', { isValid, warnings, errors });
    return { isValid, warnings, errors };
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    return { isValid: false, warnings: [], errors: ['Lỗi kiểm tra tính khả thi'] };
  } finally {
    setValidationLoading(false);
  }
};
// Hàm lấy thông tin cost/price từ product
const getProductProfitInfo = (productIds) => {
  try {
    console.log('🔄 Calculating profit info for productIds:', productIds);
    
    let productsToCalculate = products;
    
    // Lọc theo productIds nếu có
    if (productIds && productIds.length > 0) {
      productsToCalculate = products.filter(p => productIds.includes(p._id));
    }
    
    console.log('📋 Products to calculate:', productsToCalculate.length);
    
    // CHỈ lấy sản phẩm có cost > 0
    const validProducts = productsToCalculate.filter(p => 
      p.sizes && 
      p.sizes.length > 0 && 
      p.sizes[0].cost > 0 && 
      p.sizes[0].price > p.sizes[0].cost
    );
    
    console.log('✅ Valid products:', validProducts.length);
    
    if (validProducts.length === 0) {
      console.warn('⚠️ No valid products found, using fallback values');
      return { avgCost: 5000, avgPrice: 15000, avgProfitMargin: 0.67 };
    }
    
    const totalCost = validProducts.reduce((sum, p) => sum + (p.sizes[0].cost || 0), 0);
    const totalPrice = validProducts.reduce((sum, p) => sum + (p.sizes[0].price || 0), 0);
    
    const avgCost = totalCost / validProducts.length;
    const avgPrice = totalPrice / validProducts.length;
    const avgProfitMargin = (avgPrice - avgCost) / avgPrice;
    
    const result = { 
      avgCost: Math.round(avgCost), 
      avgPrice: Math.round(avgPrice), 
      avgProfitMargin 
    };
    
    console.log('📈 Profit result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error in getProductProfitInfo:', error);
    return { avgCost: 5000, avgPrice: 15000, avgProfitMargin: 0.67 };
  }
};
// Thêm hàm validation real-time
const validateRealTime = async (changedValues, allValues) => {
  try {
    // Chỉ validate khi có đủ dữ liệu
    if (!allValues.promotionType || !allValues.buyX || !allValues.getY) {
      return;
    }

    // Chỉ validate khi các trường quan trọng thay đổi
    const relevantFields = ['promotionType', 'buyX', 'getY', 'buyProducts', 'getProducts', 'discountType', 'discountValue'];
    const shouldValidate = Object.keys(changedValues).some(field => 
      relevantFields.includes(field)
    );

    if (shouldValidate) {
      setValidationLoading(true);
      const validation = await validatePromotionFeasibility(allValues);
      setValidationMessages({
        errors: validation.errors || [],
        warnings: validation.warnings || []
      });
    }
  } catch (error) {
    console.error('Real-time validation error:', error);
  } finally {
    setValidationLoading(false);
  }
};
    return (
    <Modal
      title={promotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading || validationLoading}
      width={700}
      okText={promotion ? 'Cập nhật' : 'Tạo'}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          promotionType: 'discount',
          discountType: 'percentage',
          isActive: true,
          minOrderValue: 0,
          discountValue: 0,
          buyX: 1,
          getY: 1,
          maxFreeItems: 1,
        }}
        onValuesChange={validateRealTime}
      >
        {/* THÔNG TIN CHI PHÍ */}
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📊 Thông tin chi phí thực tế:</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {(() => {
              const productInfo = getProductProfitInfo([]);
              return (
                <>
                  • Giá vốn trung bình: {Math.round(productInfo.avgCost).toLocaleString()}đ<br/>
                  • Giá bán trung bình: {Math.round(productInfo.avgPrice).toLocaleString()}đ<br/>
                  • Lợi nhuận: {Math.round(productInfo.avgPrice - productInfo.avgCost).toLocaleString()}đ<br/>
                  • Tỷ lệ lợi nhuận: {(productInfo.avgProfitMargin * 100).toFixed(1)}%
                </>
              );
            })()}
          </div>
        </div>

        {/* HIỂN THỊ LOADING KHI ĐANG VALIDATE */}
        {validationLoading && (
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#f0f5ff',
            border: '1px solid #d6e4ff',
            borderRadius: '6px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#1890ff', fontSize: '12px' }}>
              🔄 Đang kiểm tra tính khả thi...
            </div>
          </div>
        )}

        {/* HIỂN THỊ CẢNH BÁO REAL-TIME */}
        {(validationMessages.errors.length > 0 || validationMessages.warnings.length > 0) && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: validationMessages.errors.length > 0 ? '#fff2f0' : '#fffbe6',
            border: validationMessages.errors.length > 0 ? '1px solid #ffccc7' : '1px solid #ffe58f',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {/* HIỂN THỊ LỖI */}
            {validationMessages.errors.length > 0 && (
              <div style={{ marginBottom: validationMessages.warnings.length > 0 ? '8px' : '0' }}>
                <div style={{ fontWeight: 'bold', color: '#ff4d4f', marginBottom: '4px' }}>
                  ⚠️ Vấn đề nghiêm trọng:
                </div>
                {validationMessages.errors.map((error, index) => (
                  <div key={index} style={{ color: '#ff4d4f', fontSize: '12px', marginBottom: '2px' }}>
                    • {error}
                  </div>
                ))}
              </div>
            )}
            
            {/* HIỂN THỊ CẢNH BÁO */}
            {validationMessages.warnings.length > 0 && (
              <div>
                <div style={{ fontWeight: 'bold', color: '#faad14', marginBottom: '4px' }}>
                  💡 Lưu ý:
                </div>
                {validationMessages.warnings.map((warning, index) => (
                  <div key={index} style={{ color: '#faad14', fontSize: '12px', marginBottom: '2px' }}>
                    • {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HIỂN THỊ THÀNH CÔNG KHI KHÔNG CÓ CẢNH BÁO */}
        {validationMessages.errors.length === 0 && 
         validationMessages.warnings.length === 0 && 
         form.getFieldValue('promotionType') && (
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <div style={{ color: '#52c41a', fontSize: '12px', fontWeight: 'bold' }}>
              ✅ Khuyến mãi khả thi và an toàn
            </div>
          </div>
        )}

        <Form.Item
          name="name"
          label="Tên khuyến mãi"
          rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
        >
          <Input placeholder="VD: Mua 1 tặng 1, Giảm 20% cuối tuần..." />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
        >
          <TextArea 
            rows={2} 
            placeholder="Mô tả chi tiết về chương trình khuyến mãi" 
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="promotionType"
          label="Loại chương trình"
        >
          <Radio.Group onChange={handlePromotionTypeChange}>
            <Radio value="discount">Giảm giá / Quà tặng</Radio>
            <Radio value="buy_x_get_y">Mua X tặng Y</Radio>
          </Radio.Group>
        </Form.Item>

        {promotionType === 'discount' && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="discountType"
                  label="Hình thức khuyến mãi"
                  rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
                >
                  <Select onChange={handleDiscountTypeChange}>
                    <Option value="percentage">Giảm giá phần trăm</Option>
                    <Option value="fixed">Giảm giá cố định</Option>
                    <Option value="gift">Quà tặng</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="isActive"
                  label="Trạng thái"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                </Form.Item>
              </Col>
            </Row>

            {discountType !== 'gift' && (
              <Row gutter={16}>
                <Col span={discountType === 'percentage' ? 12 : 24}>
                  <Form.Item
                    name="discountValue"
                    label={discountType === 'percentage' ? 'Phần trăm giảm giá (%)' : 'Số tiền giảm (đ)'}
                    rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={discountType === 'percentage' ? 100 : undefined}
                      formatter={value => discountType === 'percentage' ? `${value}%` : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)|%/g, '')}
                      addonAfter={discountType === 'percentage' ? '%' : 'đ'}
                    />
                  </Form.Item>
                </Col>
                {discountType === 'percentage' && (
                  <Col span={12}>
                    <Form.Item
                      name="maxDiscount"
                      label="Giảm tối đa (đ)"
                      tooltip="Giới hạn số tiền giảm tối đa"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        placeholder="Không giới hạn"
                        addonAfter="đ"
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            )}

            {discountType === 'gift' && (
              <Card size="small" title="Thông tin quà tặng" style={{ marginTop: 16 }}>
                <Form.Item
                  name={['gift', 'name']}
                  label="Tên quà tặng"
                  rules={[{ required: true, message: 'Vui lòng nhập tên quà tặng' }]}
                >
                  <Input placeholder="VD: Ly sứ cao cấp, Sticker..." />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name={['gift', 'quantity']}
                      label="Số lượng"
                      initialValue={1}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        placeholder="1"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="maxGiftValue"
                      label="Giá trị tối đa (đ)"
                      tooltip="Giới hạn giá trị quà tặng (0 = không giới hạn)"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        placeholder="Không giới hạn"
                        addonAfter="đ"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name={['gift', 'productId']}
                  label="ID sản phẩm (tùy chọn)"
                  help="Nhập ID sản phẩm nếu quà tặng là sản phẩm trong menu"
                >
                  <Input placeholder="VD: 507f1f77bcf86cd799439011" />
                </Form.Item>
              </Card>
            )}
          </>
        )}

        {promotionType === 'buy_x_get_y' && (
          <>
            {/* Phần nhập số lượng - TỐI ƯU CHO MOBILE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12, fontWeight: 'bold' }}>Thiết lập số lượng</div>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="buyX"
                    label="Mua (X)"
                    rules={[{ required: true, message: 'Nhập số lượng mua' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      placeholder="2"
                      addonAfter="sản phẩm"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="getY"
                    label="Tặng (Y)"
                    rules={[{ required: true, message: 'Nhập số lượng tặng' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      placeholder="1"
                      addonAfter="sản phẩm"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="maxFreeItems"
                    label="Tặng tối đa"
                    tooltip="Số sản phẩm tặng tối đa mỗi đơn"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      placeholder="5"
                      addonAfter="sản phẩm"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Phần chọn loại áp dụng - ĐƠN GIẢN HÓA */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Áp dụng cho</div>
              <Form.Item name="applyType" initialValue="all">
                <Radio.Group 
                  onChange={(e) => handleApplyTypeChange(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Radio value="all" style={{ display: 'block', marginBottom: 8 }}>
                    Toàn bộ sản phẩm
                  </Radio>
                  <Radio value="category" style={{ display: 'block', marginBottom: 8 }}>
                    Theo danh mục
                  </Radio>
                  <Radio value="specific" style={{ display: 'block' }}>
                    Chọn món cụ thể
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            {/* Phần chọn sản phẩm - RESPONSIVE */}
            {applyType === 'specific' && (
              <div style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="buyProducts"
                      label={`Sản phẩm mua (chọn ${form.getFieldValue('buyX') || 'X'})`}
                      rules={[{ required: true, message: 'Chọn sản phẩm' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Chọn sản phẩm mua"
                        loading={productsLoading}
                        maxCount={form.getFieldValue('buyX') || 1}
                      >
                        {products.map(product => (
                          <Option key={product._id} value={product._id}>
                            {product.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="getProducts"
                      label={`Sản phẩm tặng (chọn ${form.getFieldValue('getY') || 'Y'})`}
                      rules={[{ required: true, message: 'Chọn sản phẩm tặng' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Chọn sản phẩm tặng"
                        loading={productsLoading}
                        maxCount={form.getFieldValue('getY') || 1}
                      >
                        {products.map(product => (
                          <Option key={product._id} value={product._id}>
                            {product.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}

            {applyType === 'category' && (
              <div style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="buyCategories"
                      label="Danh mục mua"
                      rules={[{ required: true, message: 'Chọn danh mục' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Chọn danh mục mua"
                      >
                        <Option value="drinks">Đồ uống</Option>
                        <Option value="food">Đồ ăn</Option>
                        <Option value="dessert">Tráng miệng</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="getCategories"
                      label="Danh mục tặng"
                      rules={[{ required: true, message: 'Chọn danh mục tặng' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Chọn danh mục tặng"
                      >
                        <Option value="drinks">Đồ uống</Option>
                        <Option value="food">Đồ ăn</Option>
                        <Option value="dessert">Tráng miệng</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}

            <Form.Item
              name="isActive"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label="Ngày bắt đầu"
              rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày bắt đầu"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endDate"
              label="Ngày kết thúc"
              rules={[
                { required: true, message: 'Vui lòng chọn ngày kết thúc' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || !getFieldValue('startDate')) {
                      return Promise.resolve();
                    }
                    if (value.isAfter(getFieldValue('startDate'))) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
                  },
                }),
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày kết thúc"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="minOrderValue"
          label="Áp dụng cho đơn từ (đ)"
          tooltip="0 đồng = áp dụng cho mọi đơn hàng"
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
            placeholder="0"
            addonAfter="đ"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PromotionModal;