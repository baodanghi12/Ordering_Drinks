// components/PromotionList.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, GiftOutlined, ShoppingOutlined } from '@ant-design/icons';
import { fetchPromotions, deletePromotion } from '../services/api';
import PromotionModal from '../modals/PromotionModal';
import PromotionDetailModal from '../modals/PromotionDetailModal';

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await fetchPromotions();
      setPromotions(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);
  
  const handleDelete = async (id) => {
    try {
      await deletePromotion(id);
      message.success('Xóa khuyến mãi thành công');
      loadPromotions();
    } catch (error) {
      message.error('Lỗi khi xóa khuyến mãi');
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setModalVisible(true);
  };

  const handleCreate = () => {
    setEditingPromotion(null);
    setModalVisible(true);
  };

  const handleViewDetail = (promotion) => {
    setSelectedPromotion(promotion);
    setDetailModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingPromotion(null);
  };

  const handleDetailModalClose = () => {
    setDetailModalVisible(false);
    setSelectedPromotion(null);
  };

  const handleSuccess = () => {
    loadPromotions();
  };

  const getStatusInfo = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    if (!promotion.isActive) {
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

  const getDiscountInfo = (promotion) => {
    if (promotion.promotionType === 'buy_x_get_y') {
      return `Mua ${promotion.buyX} tặng ${promotion.getY}`;
    }
    
    if (promotion.discountType === 'percentage') {
      return `${promotion.discountValue}%${promotion.maxDiscount ? ` (tối đa ${promotion.maxDiscount.toLocaleString()}đ)` : ''}`;
    } else if (promotion.discountType === 'fixed') {
      return `${promotion.discountValue.toLocaleString()}đ`;
    } else {
      const giftName = promotion.gift?.name || 'Quà tặng';
      const quantity = promotion.gift?.quantity || 1;
      return `${giftName} x${quantity}`;
    }
  };

  const getTypeInfo = (promotion) => {
    if (promotion.promotionType === 'buy_x_get_y') {
      return { text: 'Mua X tặng Y', color: 'purple', icon: <ShoppingOutlined /> };
    }
    
    const typeMap = {
      percentage: { text: 'Giảm %', color: 'blue', icon: null },
      fixed: { text: 'Giảm giá', color: 'green', icon: null },
      gift: { text: 'Quà tặng', color: 'orange', icon: <GiftOutlined /> },
    };
    return typeMap[promotion.discountType] || { text: promotion.discountType, color: 'default', icon: null };
  };

  const columns = [
  {
    title: 'Tên khuyến mãi',
    dataIndex: 'name',
    key: 'name',
    render: (name, record) => {
      const statusInfo = getStatusInfo(record);
      
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <Button 
              type="link" 
              onClick={() => handleViewDetail(record)}
              style={{ 
                padding: 0, 
                height: 'auto', 
                fontWeight: 'bold',
                fontSize: '14px',
                textAlign: 'left',
                whiteSpace: 'normal',
                flex: 1,
                marginRight: 8
              }}
            >
              {name}
            </Button>
            <Tag color={statusInfo.color} style={{ margin: 0, flexShrink: 0 }}>
              {statusInfo.text}
            </Tag>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
            Mã: {record.code}
          </div>
          
          {record.minOrderValue > 0 && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
              Đơn tối thiểu: {record.minOrderValue.toLocaleString()}đ
            </div>
          )}
          
          <div style={{ fontSize: '12px', color: '#666' }}>
            {new Date(record.startDate).toLocaleDateString('vi-VN')} - {new Date(record.endDate).toLocaleDateString('vi-VN')}
          </div>
        </div>
      );
    },
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 120,
    render: (_, record) => {
      return (
        <Space size="small" direction="vertical" style={{ width: '100%' }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            Xem chi tiết
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa khuyến mãi này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      );
    },
  },
];

  return (
    <div>
      <Card
        title="Quản lý khuyến mãi"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Tạo khuyến mãi
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={promotions}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} khuyến mãi`,
          }}
        />
      </Card>

      <PromotionModal
        visible={modalVisible}
        promotion={editingPromotion}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />

      <PromotionDetailModal
        visible={detailModalVisible}
        promotion={selectedPromotion}
        onClose={handleDetailModalClose}
        onEdit={() => {
          setDetailModalVisible(false);
          handleEdit(selectedPromotion);
        }}
      />
    </div>
  );
};

export default PromotionList;