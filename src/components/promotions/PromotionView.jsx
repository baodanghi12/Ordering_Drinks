// components/promotions/PromotionView.jsx
import React from 'react';
import { Modal, Descriptions, Tag, Button } from 'antd';
import { 
  EditOutlined,
  CalendarOutlined,
  DollarOutlined,
  TagOutlined,
  GiftOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const PromotionView = ({ visible, promotion, onClose, onEdit }) => {
  if (!promotion) return null;

  const getStatusInfo = (promo) => {
    const now = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    
    if (!promo.isActive) {
      return { status: 'inactive', text: 'Đã tắt', color: 'red' };
    }
    
    if (now < startDate) {
      return { status: 'upcoming', text: 'Sắp diễn ra', color: 'orange' };
    }
    
    if (now > endDate) {
      return { status: 'expired', text: 'Đã hết hạn', color: 'red' };
    }
    
    return { status: 'active', text: 'Đang hoạt động', color: 'green' };
  };

  const getTypeInfo = (promo) => {
    const typeMap = {
      discount: { text: 'Giảm giá', color: 'blue', icon: <DollarOutlined /> },
      buy_x_get_y: { text: 'Mua X tặng Y', color: 'purple', icon: <ShoppingOutlined /> },
      gift: { text: 'Quà tặng', color: 'orange', icon: <GiftOutlined /> }
    };
    
    return typeMap[promo.promotionType] || { text: promo.promotionType, color: 'default', icon: null };
  };

  const getScopeInfo = (promo) => {
    const scopeMap = {
      all: { text: 'Tất cả sản phẩm', color: 'green' },
      category: { text: 'Theo danh mục', color: 'blue' },
      specific: { text: 'Sản phẩm cụ thể', color: 'orange' }
    };
    return scopeMap[promo.applicableScope] || { text: promo.applicableScope, color: 'default' };
  };

  const getDiscountInfo = (promo) => {
    if (promo.promotionType === 'buy_x_get_y') {
      return `Mua ${promo.buyX} tặng ${promo.getY}`;
    }
    
    if (promo.promotionType === 'gift') {
      return `${promo.giftName} x${promo.giftQuantity}`;
    }
    
    if (promo.discountType === 'percentage') {
      return `${promo.discountValue}%${promo.maxDiscount ? ` (tối đa ${promo.maxDiscount.toLocaleString()}đ)` : ''}`;
    } else if (promo.discountType === 'fixed') {
      return `${promo.discountValue?.toLocaleString()}đ` || '0đ';
    } else {
      return 'Quà tặng';
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  const statusInfo = getStatusInfo(promotion);
  const typeInfo = getTypeInfo(promotion);
  const scopeInfo = getScopeInfo(promotion);

  return (
    <Modal
      title="Chi tiết khuyến mãi"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={onEdit}>
          Sửa khuyến mãi
        </Button>,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width="95vw"
      style={{ maxWidth: '600px' }}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Tên khuyến mãi">
          {promotion.name}
        </Descriptions.Item>
        <Descriptions.Item label="Mã khuyến mãi">
          <Tag icon={<TagOutlined />} color="blue">
            {promotion.code}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Loại khuyến mãi">
          <Tag color={typeInfo.color}>
            {typeInfo.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Phạm vi áp dụng">
          <Tag color={scopeInfo.color}>
            {scopeInfo.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Chiết khấu">
          <strong>{getDiscountInfo(promotion)}</strong>
        </Descriptions.Item>
        
        {promotion.promotionType === 'gift' && (
          <>
            <Descriptions.Item label="Tên quà tặng">
              {promotion.giftName}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng quà">
              {promotion.giftQuantity}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị quà">
              {promotion.giftValue?.toLocaleString()}đ
            </Descriptions.Item>
          </>
        )}
        
        {promotion.promotionType === 'buy_x_get_y' && (
          <>
            <Descriptions.Item label="Điều kiện">
              Mua {promotion.buyX} tặng {promotion.getY}
            </Descriptions.Item>
            {promotion.applicableScope === 'category' && (
              <>
                <Descriptions.Item label="Danh mục mua">
                  {promotion.buyCategories?.join(', ') || 'Không có'}
                </Descriptions.Item>
                <Descriptions.Item label="Danh mục tặng">
                  {promotion.getCategories?.join(', ') || 'Không có'}
                </Descriptions.Item>
              </>
            )}
            {promotion.applicableScope === 'specific' && (
              <>
                <Descriptions.Item label="Sản phẩm mua">
                  {promotion.buyProducts?.length || 0} sản phẩm
                </Descriptions.Item>
                <Descriptions.Item label="Sản phẩm tặng">
                  {promotion.getProducts?.length || 0} sản phẩm
                </Descriptions.Item>
              </>
            )}
          </>
        )}
        
        {promotion.promotionType === 'discount' && (
          <>
            <Descriptions.Item label="Hình thức giảm giá">
              {promotion.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
            </Descriptions.Item>
            {promotion.applicableScope === 'category' && (
              <Descriptions.Item label="Danh mục áp dụng">
                {promotion.applicableCategories?.join(', ') || 'Không có'}
              </Descriptions.Item>
            )}
            {promotion.applicableScope === 'specific' && (
              <Descriptions.Item label="Sản phẩm áp dụng">
                {promotion.applicableProducts?.length || 0} sản phẩm
              </Descriptions.Item>
            )}
          </>
        )}
        
        <Descriptions.Item label="Đơn hàng tối thiểu">
          {promotion.minOrderValue > 0 
            ? `${promotion.minOrderValue.toLocaleString()}đ` 
            : 'Không yêu cầu'
          }
        </Descriptions.Item>
        <Descriptions.Item label="Thời gian">
          <div>
            <CalendarOutlined /> Bắt đầu: {formatDate(promotion.startDate)}
          </div>
          <div>
            <CalendarOutlined /> Kết thúc: {formatDate(promotion.endDate)}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={statusInfo.color}>
            {statusInfo.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Số lần sử dụng">
          {promotion.usageCount || 0} lần
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {formatDate(promotion.createdAt)}
        </Descriptions.Item>
        {promotion.description && (
          <Descriptions.Item label="Mô tả">
            {promotion.description}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};

export default PromotionView;