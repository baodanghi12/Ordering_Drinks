// modals/PromotionDetailModal.jsx
import React from 'react';
import { Modal, Descriptions, Tag, Button, Space, Divider, Badge } from 'antd';
import { EditOutlined, CalendarOutlined, GiftOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';

const PromotionDetailModal = ({ visible, promotion, onClose, onEdit }) => {
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
    if (promo.promotionType === 'buy_x_get_y') {
      return { text: 'Mua X tặng Y', color: 'purple', icon: <ShoppingOutlined /> };
    }
    
    const typeMap = {
      percentage: { text: 'Giảm giá phần trăm', color: 'blue' },
      fixed: { text: 'Giảm giá cố định', color: 'green' },
      gift: { text: 'Quà tặng', color: 'orange', icon: <GiftOutlined /> },
    };
    return typeMap[promo.discountType] || { text: promo.discountType, color: 'default' };
  };

  const statusInfo = getStatusInfo(promotion);
  const typeInfo = getTypeInfo(promotion);

  return (
    <Modal
      title={
        <div>
          <span>Chi tiết khuyến mãi</span>
          <Tag color={typeInfo.color} style={{ marginLeft: 8 }}>
            {typeInfo.icon && <span style={{ marginRight: 4 }}>{typeInfo.icon}</span>}
            {typeInfo.text}
          </Tag>
          <Tag color={statusInfo.color} style={{ marginLeft: 4 }}>
            {statusInfo.text}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={onEdit}>
          Chỉnh sửa
        </Button>,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={600}
    >
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="Tên khuyến mãi">
          <strong style={{ fontSize: '18px', color: '#1890ff' }}>
            {promotion.name}
          </strong>
        </Descriptions.Item>
        
        <Descriptions.Item label="Mã khuyến mãi">
          <Tag color="blue">{promotion.code}</Tag>
        </Descriptions.Item>
        
        <Descriptions.Item label="Mô tả">
          {promotion.description || 'Không có mô tả'}
        </Descriptions.Item>

        <Descriptions.Item label="Thời gian hiệu lực">
          <Space>
            <CalendarOutlined />
            <span>
              Từ: {new Date(promotion.startDate).toLocaleDateString('vi-VN')}
            </span>
            <span>→</span>
            <span>
              Đến: {new Date(promotion.endDate).toLocaleDateString('vi-VN')}
            </span>
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Đơn hàng tối thiểu">
          <DollarOutlined /> 
          <span style={{ marginLeft: 8 }}>
            {promotion.minOrderValue > 0 
              ? `${promotion.minOrderValue.toLocaleString()}đ`
              : 'Không yêu cầu'
            }
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Chi tiết khuyến mãi">
          {promotion.promotionType === 'buy_x_get_y' ? (
            <div>
              <div style={{ marginBottom: 8 }}>
                <ShoppingOutlined style={{ marginRight: 8 }} />
                <strong>Mua {promotion.buyX} tặng {promotion.getY}</strong>
              </div>
              {promotion.getYProduct && (
                <div>Sản phẩm tặng: {promotion.getYProduct}</div>
              )}
              {promotion.maxFreeItems && (
                <div>Tặng tối đa: {promotion.maxFreeItems} sản phẩm/đơn</div>
              )}
            </div>
          ) : (
            <div>
              {promotion.discountType === 'percentage' && (
                <div>
                  <div>Giảm: <strong>{promotion.discountValue}%</strong> giá trị đơn hàng</div>
                  {promotion.maxDiscount && (
                    <div>Giảm tối đa: <strong>{promotion.maxDiscount.toLocaleString()}đ</strong></div>
                  )}
                </div>
              )}
              
              {promotion.discountType === 'fixed' && (
                <div>
                  Giảm: <strong>{promotion.discountValue.toLocaleString()}đ</strong> trên tổng đơn hàng
                </div>
              )}
              
              {promotion.discountType === 'gift' && (
                <div>
                  <GiftOutlined /> 
                  <strong style={{ marginLeft: 8 }}>{promotion.gift?.name || 'Quà tặng'}</strong>
                  <div>Số lượng: {promotion.gift?.quantity || 1}</div>
                  {promotion.gift?.productId && (
                    <div>ID sản phẩm: {promotion.gift.productId}</div>
                  )}
                  {promotion.maxGiftValue > 0 && (
                    <div>Giá trị tối đa: {promotion.maxGiftValue.toLocaleString()}đ</div>
                  )}
                </div>
              )}
            </div>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Ngày tạo">
          {new Date(promotion.createdAt).toLocaleString('vi-VN')}
        </Descriptions.Item>

        <Descriptions.Item label="Cập nhật lần cuối">
          {new Date(promotion.updatedAt).toLocaleString('vi-VN')}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default PromotionDetailModal;