import React, { useState, useEffect } from "react";
import { Card, Row, Col, Spin, Alert, DatePicker, Button } from "antd";
import { CalendarOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchDashboardStats } from "../services/api"; 
const { RangePicker } = DatePicker;

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([]);

  // 🆕 Khởi tạo ngày mặc định (hôm nay)
  useEffect(() => {
    const today = dayjs();
    setDateRange([today, today]);
    fetchDashboardData(today, today);
  }, []);

  const fetchDashboardData = async (startDate, endDate) => {
    try {
      setLoading(true);
      console.log("Đang gọi API dashboard...", {
        start: startDate.format("YYYY-MM-DD"),
        end: endDate.format("YYYY-MM-DD")
      });
      
      // 🆕 Sử dụng hàm từ api.js
      const data = await fetchDashboardStats(
        startDate.startOf('day').toISOString(),
        endDate.endOf('day').toISOString()
      );
      
      console.log("Dữ liệu nhận được:", data);
      setStats(data);
    } catch (err) {
      console.error("Lỗi API dashboard:", err);
      setError(err.message || "Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Xử lý chọn ngày
  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      fetchDashboardData(dates[0], dates[1]);
    }
  };

  // 🆕 Làm mới dữ liệu
  const handleRefresh = () => {
    if (dateRange[0] && dateRange[1]) {
      fetchDashboardData(dateRange[0], dateRange[1]);
    }
  };

  // 🆕 Định dạng hiển thị khoảng thời gian
  const getPeriodText = () => {
    if (!dateRange[0] || !dateRange[1]) return "";
    
    const format = "DD/MM/YYYY";
    
    if (dateRange[0].isSame(dateRange[1], 'day')) {
      return dateRange[0].format(format);
    } else {
      return `${dateRange[0].format(format)} - ${dateRange[1].format(format)}`;
    }
  };

  // Hiển thị giá trị
  const displayValue = (value, isCurrency = false) => {
    if (value === undefined || value === null) return "0" + (isCurrency ? "₫" : "");
    return isCurrency ? `${value.toLocaleString("vi-VN")}₫` : value.toString();
  };

  if (loading && !stats.totalRevenue) {
    return (
      <div style={{ padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ color: "black", margin: 0 }}>
          Dashboard {user.role ? `(${user.role})` : "(Admin)"}
        </h2>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Date range picker */}
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            style={{ width: 240 }}
            allowClear={false}
          />

          {/* Refresh button */}
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Period info */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "8px 16px", 
        borderRadius: "6px", 
        marginBottom: "1rem",
        border: "1px solid #d9d9d9",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <CalendarOutlined style={{ color: "#1890ff" }} />
        <span style={{ fontWeight: 500 }}>{getPeriodText()}</span>
      </div>

      {error && (
        <Alert 
          message={error} 
          type="error" 
          style={{ marginBottom: "1rem" }}
          action={
            <Button size="small" onClick={handleRefresh}>
              Thử lại
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title="Tổng doanh thu" 
            bordered
            loading={loading}
          >
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1890ff" }}>
              {displayValue(stats.totalRevenue, true)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "8px" }}>
              {dateRange[0]?.isSame(dateRange[1], 'day') ? "Hôm nay" : getPeriodText()}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title="Lợi nhuận" 
            bordered
            loading={loading}
          >
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#52c41a" }}>
              {displayValue(stats.totalProfit, true)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "8px" }}>
              Tỷ lệ: {stats.totalRevenue ? Math.round((stats.totalProfit / stats.totalRevenue) * 100) : 0}%
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title="Tồn kho" 
            bordered
            loading={loading}
          >
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fa8c16" }}>
              {displayValue(stats.totalInventoryItems)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "8px" }}>
              Nguyên liệu
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title="Chi phí vận hành" 
            bordered
            loading={loading}
          >
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ff4d4f" }}>
              {displayValue(stats.operatingCosts, true)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "8px" }}>
              {dateRange[0]?.isSame(dateRange[1], 'day') ? "Hôm nay" : getPeriodText()}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;