// modals/AddPromotionModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, Select, Button, Steps, 
  Space, message, Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined, ArrowRightOutlined,
  GiftOutlined, ShoppingOutlined, PercentageOutlined,
  ReloadOutlined, CopyOutlined
} from '@ant-design/icons';
import DiscountPromotionForm from './DiscountPromotionForm';
import BuyXGetYPromotionForm from './BuyXGetYPromotionForm';
import GiftPromotionForm from './GiftPromotionForm';
import { createPromotion } from '../services/api';

const { Option } = Select;
const { Step } = Steps;

const AddPromotionModal = ({ 
  visible, 
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [promotionType, setPromotionType] = useState('discount');
  const [loading, setLoading] = useState(false);
  const [usedCodes] = useState(['WEEKEND20', 'BUY1GET1', 'BIRTHDAY15', 'GIFT2024']);

  // Generate mã khuyến mãi
  const generateUniquePromoCode = (type = 'discount') => {
    const prefixes = { discount: 'DC', buy_x_get_y: 'BXGY', gift: 'GF' };
    const keywordList = ['SALE', 'OFF', 'DEAL', 'PROMO', 'GIFT', 'FREE'];

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const randomKeyword = keywordList[Math.floor(Math.random() * keywordList.length)];
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newCode = `${prefixes[type]}${randomKeyword}${randomNum}`;
      
      if (!usedCodes.includes(newCode)) return newCode;
      attempts++;
    }

    const timestamp = Date.now().toString().slice(-6);
    return `${prefixes[type]}${timestamp}`;
  };

  // Reset form khi mở modal
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setCurrentStep(0);
      setPromotionType('discount');
      
      const newCode = generateUniquePromoCode('discount');
      form.setFieldsValue({ 
        name: 'Khuyến mãi giảm giá',
        code: newCode,
        promotionType: 'discount',
        applicableScope: 'all',
        isActive: true
      });
    }
  }, [visible, form]);

  const handleCancel = () => {
    form.resetFields();
    setCurrentStep(0);
    setPromotionType('discount');
    onCancel();
  };

  const handleRegenerateCode = () => {
    const newCode = generateUniquePromoCode(promotionType);
    form.setFieldsValue({ code: newCode });
    message.success('Đã tạo mã mới');
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
          applicableProducts: values.applicableProducts || undefined
        };
        break;
        
      case 'buy_x_get_y':
        payload = {
          ...payload,
          buyX: values.buyX,
          getY: values.getY,
          buyCategories: values.buyCategories || undefined,
          getCategories: values.getCategories || undefined,
          buyProducts: values.buyProducts || undefined,
          getProducts: values.getProducts || undefined,
        };
        break;
        
      case 'gift':
        payload = {
          ...payload,
          giftName: values.giftName,
          giftQuantity: values.giftQuantity,
          giftValue: values.giftValue,
          applicableCategories: values.applicableCategories || undefined,
          applicableProducts: values.applicableProducts || undefined
        };
        break;
    }

    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
        delete payload[key];
      }
      if (Array.isArray(payload[key]) && payload[key].length === 0) {
        delete payload[key];
      }
    });

    return payload;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = handleBeforeSubmit(values);
      
      console.log('🚀 Final payload:', payload);
      
      setLoading(true);
      await createPromotion(payload);
      message.success("Tạo khuyến mãi thành công");
      
      handleCancel();
      onSuccess();
    } catch (error) {
      console.error("❌ Lỗi:", error);
      if (error.errorFields) {
        message.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      } else {
        message.error(error.response?.data?.message || "Thao tác thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div>
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
            rules={[
              { required: true, message: 'Vui lòng nhập mã khuyến mãi' },
              { pattern: /^[A-Z0-9]+$/, message: 'Chỉ được chứa chữ hoa và số' },
              { min: 4, message: 'Mã phải có ít nhất 4 ký tự' },
              { max: 20, message: 'Mã không được quá 20 ký tự' }
            ]}
          >
            <Input 
              size="large" 
              placeholder="Mã sẽ được tạo tự động"
              style={{ textTransform: 'uppercase' }}
              suffix={
                <Space size="small">
                  <Tooltip title="Tạo mã mới">
                    <Button 
                      type="text" 
                      icon={<ReloadOutlined />} 
                      size="small"
                      onClick={handleRegenerateCode}
                    />
                  </Tooltip>
                  <Tooltip title="Sao chép mã">
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />} 
                      size="small"
                      onClick={handleCopyCode}
                    />
                  </Tooltip>
                </Space>
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
              onChange={(value) => {
                setPromotionType(value);
                const currentCode = form.getFieldValue('code');
                const currentName = form.getFieldValue('name');
                
                if (!currentCode || currentCode.startsWith('DC') || currentCode.startsWith('BXGY') || currentCode.startsWith('GF')) {
                  const newCode = generateUniquePromoCode(value);
                  form.setFieldsValue({ code: newCode });
                }
                
                if (!currentName || currentName.trim() === '') {
                  const defaultNames = {
                    discount: 'Khuyến mãi giảm giá',
                    buy_x_get_y: 'Chương trình mua X tặng Y', 
                    gift: 'Khuyến mãi quà tặng'
                  };
                  const defaultName = defaultNames[value] || 'Khuyến mãi';
                  form.setFieldsValue({ name: defaultName });
                }
              }}
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
        
        {promotionType === 'discount' && <DiscountPromotionForm form={form} />}
        {promotionType === 'buy_x_get_y' && <BuyXGetYPromotionForm form={form} />}
        {promotionType === 'gift' && <GiftPromotionForm form={form} />}
      </div>
    );
  };

  return (
    <Modal
      title="Tạo khuyến mãi mới"
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
        initialValues={{
          promotionType: 'discount',
          isActive: true
        }}
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
              <Button type="primary" loading={loading} onClick={handleSubmit}>Tạo khuyến mãi</Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default AddPromotionModal;