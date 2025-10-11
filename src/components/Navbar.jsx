import React from "react";
import {
  HomeOutlined,
  OrderedListOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Order", icon: <HomeOutlined />, path: "/order" },
    { name: "Đơn hàng", icon: <OrderedListOutlined />, path: "/orders" },
    { name: "Kho", icon: <ShoppingOutlined />, path: "/inventory" },
    { name: "Thống kê", icon: <BarChartOutlined />, path: "/dashboard" },
    { name: "Cài đặt", icon: <SettingOutlined />, path: "/settings" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "65px",
        backgroundColor: "#fff",
        borderTop: "1px solid #eee",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 100,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
      }}
    >
      {menuItems.map((item, idx) => {
        const active = location.pathname === item.path;
        return (
          <div
            key={idx}
            onClick={() => navigate(item.path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: "12px",
              color: active ? "#1677ff" : "#666",
              cursor: "pointer",
              fontWeight: active ? "600" : "400",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "2px" }}>
              {item.icon}
            </div>
            <span>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Navbar;
