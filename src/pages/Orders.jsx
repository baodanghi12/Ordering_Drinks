import React, { useEffect, useState } from "react";
import { Tabs, Spin, Typography, message } from "antd";
import { fetchOrders, updateOrderStatus } from "../services/api";
import CurrentOrdersTab from "../components/OrderTabs/CurrentOrdersTab";
import HistoryOrdersTab from "../components/OrderTabs/HistoryOrdersTab";
import OrderDetailModal from "../components/OrderDetailModal";

const { TabPane } = Tabs;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders();
      setOrders(res || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      message.success("✅ Cập nhật trạng thái thành công");
      loadOrders();
    } catch (err) {
      message.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const showOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setIsModalVisible(false);
  };

  const currentOrders = orders.filter((o) => o.status === "paid");
  const historyOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "cancelled"
  );

  return (
    <div style={{ padding: "1rem", marginBottom: "70px" }}>
      {/* 🌟 Tiêu đề lớn, căn giữa */}
      <h2
        style={{
          textAlign: "center",
          fontSize: "1.8rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
          color: "#333",
          textShadow: "1px 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        📋 Quản lý đơn hàng
      </h2>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Spin />
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", // 🌟 đổ bóng container tab
            padding: "0.5rem",
          }}
        >
          <Tabs
            defaultActiveKey="1"
            centered
            tabBarStyle={{
              fontSize: "1.1rem",
              fontWeight: "600",
              textAlign: "center",
            }}
            items={[
              {
                key: "1",
                label: `Đơn hiện tại (${currentOrders.length})`,
                children: (
                  <CurrentOrdersTab
                    orders={currentOrders}
                    onUpdateStatus={handleUpdateStatus}
                    onShowDetail={showOrderDetail}
                  />
                ),
              },
              {
                key: "2",
                label: `Lịch sử đơn hàng (${historyOrders.length})`,
                children: (
                  <HistoryOrdersTab
                    orders={historyOrders}
                    onShowDetail={showOrderDetail}
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      <OrderDetailModal
        open={isModalVisible}
        onClose={closeModal}
        order={selectedOrder}
      />
    </div>
  );
};

export default Orders;
