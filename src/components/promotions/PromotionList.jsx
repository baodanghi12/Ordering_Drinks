// components/promotions/PromotionList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  Input,
  Select,
  Tooltip,
  Space,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { fetchPromotions, deletePromotion } from '../../services/api';
import PromotionView from './PromotionView';
import PromotionEdit from './PromotionEdit';
import PromotionCard from './PromotionCard';

const { Search } = Input;
const { Option } = Select;

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    promotionType: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Load promotions từ API
  const loadPromotions = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.promotionType && { promotionType: filters.promotionType })
      };

      const response = await fetchPromotions(params);
      
      if (response.success) {
        setPromotions(response.data);
        setPagination({
          current: response.pagination.page,
          pageSize: response.pagination.limit,
          total: response.pagination.total
        });
      } else {
        message.error('Lỗi khi tải danh sách khuyến mãi');
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      message.error('Lỗi kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [filters]);

  const handleDelete = async (id) => {
    try {
      await deletePromotion(id);
      message.success('Xóa khuyến mãi thành công');
      loadPromotions();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi xóa khuyến mãi');
    }
  };

  const handleCreate = () => {
    setSelectedPromotion(null);
    setEditModalVisible(true);
  };

  const handleEdit = (promotion) => {
    setSelectedPromotion(promotion);
    setEditModalVisible(true);
  };

  const handleView = (promotion) => {
    setSelectedPromotion(promotion);
    setViewModalVisible(true);
  };

  const handleModalClose = () => {
    setViewModalVisible(false);
    setEditModalVisible(false);
    setSelectedPromotion(null);
  };

  const handleSuccess = () => {
    loadPromotions();
    setEditModalVisible(false);
    setSelectedPromotion(null);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const handleStatusFilter = (value) => {
    setFilters(prev => ({
      ...prev,
      status: value,
      page: 1
    }));
  };

  const handleTypeFilter = (value) => {
    setFilters(prev => ({
      ...prev,
      promotionType: value,
      page: 1
    }));
  };

  const handleTableChange = (newPagination) => {
    setFilters(prev => ({
      ...prev,
      page: newPagination.current,
      limit: newPagination.pageSize
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      promotionType: '',
      page: 1,
      limit: 10
    });
  };

  const columns = [
    {
      title: 'Thông tin khuyến mãi',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <PromotionCard 
          promotion={record}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ),
    },
    {
      title: 'Sử dụng',
      key: 'usage',
      width: 100,
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            {record.usageCount || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>lần dùng</div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small" direction="vertical" style={{ width: '100%' }}>
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<SearchOutlined />}
              onClick={() => handleView(record)}
              size="small"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              Chi tiết
            </Button>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              Sửa
            </Button>
          </Tooltip>
        </Space>
      ),
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
        {/* Bộ lọc */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Search
            placeholder="Tìm theo tên hoặc mã khuyến mãi"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton={<SearchOutlined />}
          />
          
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 150 }}
            onChange={handleStatusFilter}
            value={filters.status || undefined}
          >
            <Option value="active">Đang hoạt động</Option>
            <Option value="inactive">Đã tắt</Option>
            <Option value="expired">Hết hạn</Option>
            <Option value="upcoming">Sắp diễn ra</Option>
          </Select>
          
          <Select
            placeholder="Loại khuyến mãi"
            allowClear
            style={{ width: 150 }}
            onChange={handleTypeFilter}
            value={filters.promotionType || undefined}
          >
            <Option value="discount">Giảm giá</Option>
            <Option value="buy_x_get_y">Mua X tặng Y</Option>
            <Option value="gift">Quà tặng</Option>
          </Select>

          <Tooltip title="Làm mới bộ lọc">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
            >
              Làm mới
            </Button>
          </Tooltip>
        </div>

        <Table
          columns={columns}
          dataSource={promotions}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} khuyến mãi`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal xem chi tiết */}
      <PromotionView
        visible={viewModalVisible}
        promotion={selectedPromotion}
        onClose={handleModalClose}
        onEdit={() => {
          setViewModalVisible(false);
          setEditModalVisible(true);
        }}
      />

      {/* Modal chỉnh sửa */}
      <PromotionEdit
        visible={editModalVisible}
        promotion={selectedPromotion}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default PromotionList;