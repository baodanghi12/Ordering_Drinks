import React from "react";
import { Card, Row, Col } from "antd";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div style={{ padding: "1rem", backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem", color:"black" }}>
        Dashboard {user.role ? `(${user.role})` : "(Admin)"}
      </h2>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Tổng doanh thu" bordered>
            0₫
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Lợi nhuận" bordered>
            0₫
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Tồn kho" bordered>
            0
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Chi phí vận hành" bordered>
            0₫
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
