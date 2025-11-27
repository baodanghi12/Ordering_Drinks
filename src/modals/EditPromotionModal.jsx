// modals/EditPromotionModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, Select, Button, Steps, 
  Space, message, Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined, ArrowRightOutlined,
  GiftOutlined, ShoppingOutlined, PercentageOutlined,
  CopyOutlined
} from '@ant-design/icons';
import DiscountPromotionForm from './DiscountPromotionForm';
import BuyXGetYPromotionForm from './BuyXGetYPromotionForm';
import GiftPromotionForm from './GiftPromotionForm';
import { updatePromotion } from '../services/api';
import moment from 'moment';

const { Option } = Select;
const { Step } = Steps;

// ✅ Hàm tìm product thực tế từ products data
const findActualProduct = (products, productId, size) => {
  console.log('🔍 Finding actual product:', { productId, size });
  
  if (!products || !Array.isArray(products)) {
    console.log('❌ Products data not available');
    return { price: 0, cost: 0 };
  }

  // Tìm product trong danh sách
  const product = products.find(p => {
    const normalizedPId = p._id?.toString().trim();
    const normalizedInputId = productId.toString().trim();
    return normalizedPId === normalizedInputId;
  });

  if (!product) {
    console.log(`❌ Product not found: ${productId}`);
    return { price: 0, cost: 0 };
  }

  console.log('✅ Found product:', {
    name: product.name,
    rootPrice: product.price,
    sizes: product.sizes
  });

  // Tìm size cụ thể
  const sizeInfo = product.sizes?.find(s => s.name === size);
  
  if (sizeInfo) {
    // Lấy price từ root level, cost từ size level
    const finalPrice = product.price > 0 ? product.price : (sizeInfo.price || 0);
    const finalCost = sizeInfo.cost > 0 ? sizeInfo.cost : 0;
    
    console.log(`✅ Found size "${size}":`, {
      price: finalPrice,
      cost: finalCost
    });
    
    return { price: finalPrice, cost: finalCost };
  } else {
    console.log(`❌ Size "${size}" not found, using first size`);
    // Fallback: dùng size đầu tiên
    const firstSize = product.sizes?.[0];
    if (firstSize) {
      const result = {
        price: Math.max(0, product.price || firstSize.price || 0),
        cost: Math.max(0, firstSize.cost || 0)
      };
      console.log('🔄 Using first size as fallback:', result);
      return result;
    }
  }

  console.log('❌ No valid product data found');
  return { price: 0, cost: 0 };
};

// ✅ Hàm chuyển đổi string array sang object array - LẤY price/cost THỰC TẾ từ products
const convertProductArray = (products, productArray) => {
  if (!productArray || !Array.isArray(productArray)) return undefined;
  
  const result = productArray.map(item => {
    const [productId, size] = item.split('_');
    
    // Tìm product thực tế từ products data
    const actualProduct = findActualProduct(products, productId, size);
    
    return {
      productId: productId,
      size: size,
      price: actualProduct.price,
      cost: actualProduct.cost
    };
  });
  
  console.log('📦 Converted products array with actual prices:', result);
  return result;
};

const EditPromotionModal = ({ 
  visible, 
  onCancel, 
  onSuccess,
  editingPromotion,
  products,
  productsLoading 
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [promotionType, setPromotionType] = useState('discount');
  const [loading, setLoading] = useState(false);

  // Sửa lại useEffect để load data đúng cách
  useEffect(() => {
    if (visible && editingPromotion) {
      console.log('🔄 Loading editing promotion data:', editingPromotion);
      console.log('📦 Available products data:', products);
      
      const editingData = {
        ...editingPromotion,
        promotionType: editingPromotion.promotionType || 'discount',
        applicableScope: editingPromotion.applicableScope || 'all',
        applicableCategories: editingPromotion.applicableCategories || undefined,
      };

      // ✅ Xử lý date
      if (editingPromotion.startDate) {
        editingData.startDate = moment(editingPromotion.startDate);
      }
      if (editingPromotion.endDate) {
        editingData.endDate = moment(editingPromotion.endDate);
      }

      // ✅ Xử lý applicableProducts - GIỮ NGUYÊN DỮ LIỆU TỪ DATABASE
      if ((editingPromotion.promotionType === 'discount' || editingPromotion.promotionType === 'gift') && 
          editingPromotion.applicableScope === 'specific' && 
          editingPromotion.applicableProducts && 
          Array.isArray(editingPromotion.applicableProducts)) {
        
        // Sử dụng format giống như trong database: productId_size
        editingData.applicableProducts = editingPromotion.applicableProducts.map(item => {
          return `${item.productId}_${item.size}`;
        });
      }

      // ✅ Xử lý buyProducts và getProducts cho buy_x_get_y
      if (editingPromotion.promotionType === 'buy_x_get_y') {
        if (editingPromotion.buyProducts && Array.isArray(editingPromotion.buyProducts)) {
          editingData.buyProducts = editingPromotion.buyProducts.map(item => {
            return `${item.productId}_${item.size}`;
          });
        }
        if (editingPromotion.getProducts && Array.isArray(editingPromotion.getProducts)) {
          editingData.getProducts = editingPromotion.getProducts.map(item => {
            return `${item.productId}_${item.size}`;
          });
        }
      }

      // ✅ Xử lý dữ liệu cho gift promotion
      if (editingPromotion.promotionType === 'gift') {
        editingData.giftName = editingPromotion.giftName;
        editingData.giftQuantity = editingPromotion.giftQuantity;
        editingData.giftValue = editingPromotion.giftValue;
      }
      
      console.log('📝 Final editing data:', editingData);
      
      setTimeout(() => {
        form.setFieldsValue(editingData);
        setPromotionType(editingPromotion.promotionType || 'discount');
        setCurrentStep(0);
      }, 100);
    }
  }, [visible, editingPromotion, form, products]); // Thêm products vào dependency

  // ✅ SỬA LẠI: Đơn giản hóa hàm handleBeforeSubmit, LẤY price/cost THỰC TẾ
  const handleBeforeSubmit = (values) => {
    let payload = {
      name: values.name,
      code: values.code,
      description: values.description || '',
      promotionType: values.promotionType || 'discount',
      applicableScope: values.applicableScope || 'all',
      minOrderValue: values.minOrderValue || 0,
      startDate: values.startDate ? values.startDate.toISOString() : new Date().toISOString(),
      endDate: values.endDate ? values.endDate.toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: values.isActive !== undefined ? values.isActive : true
    };

    switch (values.promotionType) {
      case 'discount':
        payload = {
          ...payload,
          discountType: values.discountType,
          discountValue: values.discountValue,
          maxDiscount: values.maxDiscount,
          applicableCategories: values.applicableCategories || undefined,
          applicableProducts: convertProductArray(products, values.applicableProducts)
        };
        break;
        
      case 'buy_x_get_y':
        payload = {
          ...payload,
          buyX: values.buyX,
          getY: values.getY,
          buyCategories: values.buyCategories || undefined,
          getCategories: values.getCategories || undefined,
          buyProducts: convertProductArray(products, values.buyProducts),
          getProducts: convertProductArray(products, values.getProducts),
        };
        break;
        
      case 'gift':
        payload = {
          ...payload,
          giftName: values.giftName,
          giftQuantity: values.giftQuantity,
          giftValue: values.giftValue,
          applicableCategories: values.applicableCategories || undefined,
          applicableProducts: convertProductArray(products, values.applicableProducts)
        };
        break;
    }

    // Xóa các field undefined, null, empty
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
        delete payload[key];
      }
      if (Array.isArray(payload[key]) && payload[key].length === 0) {
        delete payload[key];
      }
    });

    console.log('🚀 Final payload with ACTUAL prices:', payload);
    return payload;
  };

  const handleCancel = () => {
    form.resetFields();
    setCurrentStep(0);
    setPromotionType('discount');
    onCancel();
  };

  const handleCopyCode = async () => {
    try {
      const currentCode = form.getFieldValue('code');
      if (currentCode) {
        await navigator.clipboard.writeText(currentCode);
        message.success('Đã sao chép mã khuyến mãi');
      }
    } catch (err) {
      message.error('Không thể sao chép mã');
    }
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields(['name', 'code', 'promotionType']);
      setPromotionType(values.promotionType);
      setCurrentStep(1);
    } catch (error) {
      message.error('Vui lòng điền đầy đủ thông tin cơ bản');
    }
  };

  const handleBack = () => {
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = handleBeforeSubmit(values);
      
      console.log('📤 Submitting payload:', payload);
      
      setLoading(true);
      await updatePromotion(editingPromotion._id, payload);
      message.success("Cập nhật khuyến mãi thành công");
      
      handleCancel();
      onSuccess();
    } catch (error) {
      console.error("❌ Lỗi:", error);
      if (error.errorFields) {
        message.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      } else {
        message.error(error.response?.data?.message || "Cập nhật thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  // ... phần renderStepContent và return giữ nguyên
  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div>
          <Form.Item name="giftItemId" hidden noStyle><Input /></Form.Item>
          <Form.Item name="giftProductId" hidden noStyle><Input /></Form.Item>  
          <Form.Item
            name="name"
            label="Tên khuyến mãi"
            rules={[
              { required: true, message: 'Vui lòng nhập tên khuyến mãi' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự' },
              { max: 100, message: 'Tên không được quá 100 ký tự' }
            ]}
          >
            <Input 
              size="large" 
              placeholder="Ví dụ: Giảm giá cuối tuần"
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Mã khuyến mãi"
            preserve={true}
          >
            <Input 
              size="large" 
              placeholder="Mã khuyến mãi"
              style={{ 
                textTransform: 'uppercase',
                backgroundColor: '#fafafa',
                borderColor: '#d9d9d9',
                cursor: 'default'
              }}
              readOnly={true}
              suffix={
                <Tooltip title="Sao chép mã">
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />} 
                    size="small"
                    onClick={handleCopyCode}
                    style={{ color: '#1890ff' }}
                  />
                </Tooltip>
              }
            />
          </Form.Item>

          <Form.Item
            name="promotionType"
            label="Loại khuyến mãi"
            rules={[{ required: true, message: 'Vui lòng chọn loại khuyến mãi' }]}
          >
            <Select
              size="large"
              placeholder="Chọn loại khuyến mãi"
              disabled={true}
            >
              <Option value="discount">
                <Space>
                  <PercentageOutlined />
                  Giảm giá
                </Space>
              </Option>
              <Option value="buy_x_get_y">
                <Space>
                  <ShoppingOutlined />
                  Mua X tặng Y
                </Space>
              </Option>
              <Option value="gift">
                <Space>
                  <GiftOutlined />
                  Quà tặng
                </Space>
              </Option>
            </Select>
          </Form.Item>
        </div>
      );
    }

    return (
      <div>
        <Form.Item name="name" hidden noStyle><Input /></Form.Item>
        <Form.Item name="code" hidden noStyle><Input /></Form.Item>
        <Form.Item name="promotionType" hidden noStyle><Input /></Form.Item>
        <Form.Item name="applicableScope" hidden noStyle><Input /></Form.Item>
        <Form.Item name="applicableCategories" hidden noStyle><Input /></Form.Item>
        <Form.Item name="applicableProducts" hidden noStyle><Input /></Form.Item>
        <Form.Item name="discountType" hidden noStyle><Input /></Form.Item>
        <Form.Item name="discountValue" hidden noStyle><Input /></Form.Item>
        <Form.Item name="maxDiscount" hidden noStyle><Input /></Form.Item>
        <Form.Item name="minOrderValue" hidden noStyle><Input /></Form.Item>
        <Form.Item name="startDate" hidden noStyle><Input /></Form.Item>
        <Form.Item name="endDate" hidden noStyle><Input /></Form.Item>
        <Form.Item name="isActive" hidden noStyle><Input /></Form.Item>
        <Form.Item name="description" hidden noStyle><Input /></Form.Item>
        
        {promotionType === 'discount' && (
          <DiscountPromotionForm form={form} initialData={editingPromotion} />
        )}
        {promotionType === 'buy_x_get_y' && (
          <BuyXGetYPromotionForm form={form} initialData={editingPromotion} />
        )}
        {promotionType === 'gift' && (
          <GiftPromotionForm form={form} initialData={editingPromotion} />
        )}
      </div>
    );
  };

  return (
    <Modal
      title="Sửa khuyến mãi"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width="95vw"
      style={{ 
        maxWidth: '500px',
        top: 16
      }}
      styles={{
        body: { 
          padding: '16px 0',
          maxHeight: '70vh',
          overflowY: 'auto'
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <div style={{ padding: '0 16px 16px' }}>
          <Steps 
            current={currentStep} 
            size="small"
            items={[
              { title: 'Thông tin cơ bản' },
              { title: 'Chi tiết khuyến mãi' },
            ]}
          />
        </div>

        <div style={{ padding: '0 16px' }}>
          {renderStepContent()}
        </div>

        <div style={{ 
          position: 'sticky', 
          bottom: 0, 
          background: 'white', 
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          marginTop: '16px'
        }}>
          <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            {currentStep === 0 ? (
              <Button onClick={handleCancel}>Hủy</Button>
            ) : (
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Quay lại</Button>
            )}
            
            {currentStep === 0 ? (
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNext}>Tiếp theo</Button>
            ) : (
              <Button type="primary" loading={loading} onClick={handleSubmit}>Cập nhật</Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default EditPromotionModal;