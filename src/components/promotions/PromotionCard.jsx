// components/promotions/PromotionCard.jsx
import React from 'react';
import { Tag } from 'antd';
import { CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const PromotionCard = ({ promotion }) => {

  const getStatusColor = (promo) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive) return 'red';         // Đã tắt
    if (now < start) return 'orange';          // Sắp diễn ra
    if (now > end) return 'red';               // Hết hạn
    return 'green';                            // Đang hoạt động
  };

  const getTypeInfo = (promo) => {
    const map = {
      discount: { text: 'Giảm giá', color: 'blue' },
      buy_x_get_y: { text: 'Mua X tặng Y', color: 'purple' },
      gift: { text: 'Quà tặng', color: 'orange' }
    };
    return map[promo.promotionType] || { text: promo.promotionType, color: 'default' };
  };

  const getDiscountInfo = (promo) => {
    if (promo.promotionType === 'buy_x_get_y')
      return `Mua ${promo.buyX} tặng ${promo.getY}`;

    if (promo.promotionType === 'gift')
      return `${promo.giftName} x${promo.giftQuantity}`;

    if (promo.discountType === 'percentage')
      return `${promo.discountValue}%`;

    if (promo.discountType === 'fixed')
      return `${promo.discountValue?.toLocaleString()}đ`;

    return 'Ưu đãi';
  };

  const statusColor = getStatusColor(promotion);

  return (
    <div style={{ padding: 4 }}>
      
      {/* Chấm tròn + Tên khuyến mãi */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <span 
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor,
            display: 'inline-block',
            marginRight: 8,
          }}
        />
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>
          {promotion.name}
        </span>
      </div>

      {/* Loại + ưu đãi */}
      <div style={{ marginBottom: 4 }}>
        <Tag color={getTypeInfo(promotion).color} style={{ marginRight: 6 }}>
          {getTypeInfo(promotion).text}
        </Tag>

        <span style={{ fontSize: 12 }}>
          <DollarOutlined /> <strong>{getDiscountInfo(promotion)}</strong>
        </span>
      </div>

      {/* Mã khuyến mãi */}
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
        Mã: <strong>{promotion.code}</strong>
      </div>

      {/* Thời gian */}
      <div style={{ fontSize: 12, color: '#666' }}>
        <CalendarOutlined /> {dayjs(promotion.startDate).format('DD/MM')} → {dayjs(promotion.endDate).format('DD/MM')}
      </div>
    </div>
  );
};

export default PromotionCard;
