// components/PromotionList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  message, 
  Popconfirm, 
  Tag, 
  Card, 
  Modal,
  Descriptions
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  GiftOutlined, 
  ShoppingOutlined,
  CalendarOutlined,
  DollarOutlined,
  TagOutlined
} from '@ant-design/icons';
import { fetchPromotions, deletePromotion } from '../services/api';
import AddPromotionModal from '../modals/AddPromotionModal';

const Promotion = () => {
  const [promotions, setPromotions] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  // Dữ liệu mẫu tạm thời
  const samplePromotions = [
    {
      _id: '1',
      name: 'Giảm giá cuối tuần',
      code: 'WEEKEND20',
      discountType: 'percentage',
      discountValue: 20,
      promotionType: 'discount',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: true,
      minOrderValue: 50000,
      usageCount: 45,
      description: 'Giảm giá 20% cho tất cả đơn hàng cuối tuần'
    },
    {
      _id: '2',
      name: 'Mua 1 tặng 1',
      code: 'BUY1GET1',
      promotionType: 'buy_x_get_y',
      buyX: 1,
      getY: 1,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      isActive: true,
      minOrderValue: 0,
      usageCount: 28,
      description: 'Mua 1 tặng 1 cho các loại cà phê',
      applicableProducts: ['cf_den', 'cf_sua']
    },
    {
      _id: '3',
      name: 'Giảm giá sinh nhật',
      code: 'BIRTHDAY15',
      discountType: 'percentage',
      discountValue: 15,
      promotionType: 'discount',
      startDate: '2023-12-01',
      endDate: '2023-12-31',
      isActive: false,
      minOrderValue: 0,
      usageCount: 12,
      description: 'Giảm 15% cho khách hàng nhân dịp sinh nhật'
    },
    {
      _id: '4',
      name: 'Quà tặng ly sứ',
      code: 'GIFT2024',
      promotionType: 'gift',
      giftName: 'Ly sứ cao cấp',
      giftQuantity: 1,
      giftValue: 50000,
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      isActive: true,
      minOrderValue: 100000,
      usageCount: 15,
      description: 'Tặng ly sứ cao cấp cho đơn hàng từ 100.000đ'
    }
  ];

  const loadPromotions = async () => {
    setLoading(true);
    try {
      // Tạm thời sử dụng dữ liệu mẫu
      // const data = await fetchPromotions();
      setPromotions(samplePromotions);
    } catch (error) {
      message.error('Lỗi khi tải danh sách khuyến mãi');
      // Fallback to sample data
      setPromotions(samplePromotions);
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

  const handleCreate = () => {
    setEditingPromotion(null);
    setModalVisible(true);
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
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
    setModalVisible(false);
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
    
    if (promotion.promotionType === 'gift') {
      return `${promotion.giftName} x${promotion.giftQuantity}`;
    }
    
    if (promotion.discountType === 'percentage') {
      return `${promotion.discountValue}%`;
    } else if (promotion.discountType === 'fixed') {
      return `${promotion.discountValue?.toLocaleString()}đ` || '0đ';
    } else {
      return 'Quà tặng';
    }
  };

  const getTypeInfo = (promotion) => {
    if (promotion.promotionType === 'buy_x_get_y') {
      return { text: 'Mua X tặng Y', color: 'purple', icon: <ShoppingOutlined /> };
    }
    
    if (promotion.promotionType === 'gift') {
      return { text: 'Quà tặng', color: 'orange', icon: <GiftOutlined /> };
    }
    
    const typeMap = {
      percentage: { text: 'Giảm %', color: 'blue', icon: null },
      fixed: { text: 'Giảm giá', color: 'green', icon: null },
    };
    return typeMap[promotion.discountType] || { text: promotion.discountType, color: 'default', icon: null };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getProductNames = (productIds) => {
    const productMap = {
      'cf_den': 'Cà phê đen',
      'cf_sua': 'Cà phê sữa',
      'bac_xiu': 'Bạc xỉu',
      'tra_sua': 'Trà sữa',
    };
    return productIds?.map(id => productMap[id] || id).join(', ') || 'Tất cả sản phẩm';
  };

  const columns = [
    {
      title: 'Tên khuyến mãi',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => {
        const statusInfo = getStatusInfo(record);
        const typeInfo = getTypeInfo(record);
        
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
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              {typeInfo.icon}
              <Tag color={typeInfo.color} style={{ marginLeft: 4, marginRight: 8 }}>
                {typeInfo.text}
              </Tag>
              <span style={{ fontSize: '12px', color: '#666' }}>
                Mã: <strong>{record.code}</strong>
              </span>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
              <DollarOutlined /> Giảm: <strong>{getDiscountInfo(record)}</strong>
            </div>
            
            {record.minOrderValue > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                Đơn tối thiểu: <strong>{record.minOrderValue.toLocaleString()}đ</strong>
              </div>
            )}
            
            <div style={{ fontSize: '12px', color: '#666' }}>
              <CalendarOutlined /> {formatDate(record.startDate)} - {formatDate(record.endDate)}
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

      {/* Modal thêm/sửa khuyến mãi */}
      <AddPromotionModal
        visible={modalVisible}
        onCancel={handleModalClose}
        onSuccess={handleSuccess}
        editingPromotion={editingPromotion}
      />

      {/* Modal chi tiết khuyến mãi */}
      <Modal
        title="Chi tiết khuyến mãi"
        open={detailModalVisible}
        onCancel={handleDetailModalClose}
        footer={[
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {
            handleDetailModalClose();
            handleEdit(selectedPromotion);
          }}>
            Sửa khuyến mãi
          </Button>,
          <Button key="close" onClick={handleDetailModalClose}>
            Đóng
          </Button>
        ]}
        width="95vw"
        style={{ maxWidth: '500px' }}
      >
        {selectedPromotion && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên khuyến mãi">
              {selectedPromotion.name}
            </Descriptions.Item>
            <Descriptions.Item label="Mã khuyến mãi">
              <Tag icon={<TagOutlined />} color="blue">
                {selectedPromotion.code}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loại khuyến mãi">
              {getTypeInfo(selectedPromotion).text}
            </Descriptions.Item>
            <Descriptions.Item label="Chiết khấu">
              <strong>{getDiscountInfo(selectedPromotion)}</strong>
            </Descriptions.Item>
            
            {selectedPromotion.promotionType === 'gift' && (
              <Descriptions.Item label="Giá trị quà">
                {selectedPromotion.giftValue?.toLocaleString()}đ
              </Descriptions.Item>
            )}
            
            {selectedPromotion.promotionType === 'buy_x_get_y' && (
              <Descriptions.Item label="Sản phẩm áp dụng">
                {getProductNames(selectedPromotion.applicableProducts)}
              </Descriptions.Item>
            )}
            
            <Descriptions.Item label="Đơn hàng tối thiểu">
              {selectedPromotion.minOrderValue > 0 
                ? `${selectedPromotion.minOrderValue.toLocaleString()}đ` 
                : 'Không yêu cầu'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              <div>
                <CalendarOutlined /> Từ: {formatDate(selectedPromotion.startDate)}
              </div>
              <div>
                <CalendarOutlined /> Đến: {formatDate(selectedPromotion.endDate)}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusInfo(selectedPromotion).color}>
                {getStatusInfo(selectedPromotion).text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Số lần sử dụng">
              {selectedPromotion.usageCount || 0} lần
            </Descriptions.Item>
            {selectedPromotion.description && (
              <Descriptions.Item label="Mô tả">
                {selectedPromotion.description}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Promotion;