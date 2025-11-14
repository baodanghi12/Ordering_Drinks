import React, { useState, useMemo } from "react";
import { Table, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import ExportDetailModal from "../modals/ExportDetailModal";

const ExportHistoryTable = ({ data = [], inventory = [] }) => {
  const isMobile = window.innerWidth < 768;
  const [selectedExport, setSelectedExport] = useState(null);

  // ✅ Lấy phiếu RET- từ chính props data (không gọi API lại)
  const returnInvoices = useMemo(() => {
    return (data || []).filter(item => item.invoiceId?.startsWith("RET-"));
  }, [data]);

  const groupedData = useMemo(() => {
  if (!Array.isArray(data)) return [];

  return data
    .filter(record => record.invoiceId?.startsWith("OUT-"))
    .map((record) => {
      const extractOrderCode = (text = "") => {
        const match = text.match(/(OD-[\w-]+)/i);
        return match ? match[1] : null;
      };

      const orderCode = extractOrderCode(record.note);
      
      // ✅ SỬA: Tính totalValue GIỐNG NHƯ TRONG MODAL
      const totalValue = (record.items || []).reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        
        // Tìm nguyên liệu trong inventory để lấy thông tin chuyển đổi
        const ing = inventory.find(inv => 
          inv._id === item.ingredientId || inv.name === item.name
        );
        
        let unitCost = Number(item.unitCost) || 0;
        
        // Nếu có thông tin inventory, tính giá theo usageUnit
        if (ing) {
          const baseCost = Number(ing.averageCostPerUnit || ing.cost_per_unit || 0);
          const unitWeight = Number(ing.unitWeight || 1);
          const ingUnit = (ing.unit || "").toString();
          const usageUnit = (ing.usageUnit || "").toString();

          if (usageUnit && unitWeight && ingUnit && ingUnit !== usageUnit) {
            // Chuyển đổi đơn vị (ví dụ: từ bịch -> gram)
            unitCost = unitWeight > 0 ? baseCost / unitWeight : baseCost;
          } else {
            unitCost = baseCost;
          }
        }
        
        const itemTotal = Math.round(quantity * unitCost);
        
        console.log('💰 ITEM CALC:', {
          name: item.name,
          quantity,
          originalUnitCost: item.unitCost,
          calculatedUnitCost: unitCost,
          itemTotal
        });
        
        return sum + itemTotal;
      }, 0);

      // ... phần còn lại giữ nguyên
      const matchingReturn = returnInvoices.find((ret) => {
        const retOrderCode = extractOrderCode(ret.note);
        return orderCode && retOrderCode && retOrderCode === orderCode;
      });

      const isCancelled = !!matchingReturn;
      const isRefunded = matchingReturn && /hoàn\s*tiền/i.test(matchingReturn.note);

      return {
        _id: record._id,
        invoiceId: record.invoiceId,
        date: record.date || record.createdAt,
        note: record.note || "",
        items: Array.isArray(record.items) ? record.items : [],
        totalValue: Math.round(totalValue),
        isCancelled,
        isRefunded,
      };
    });
}, [data, returnInvoices, inventory]); // ✅ Thêm inventory vào dependencies


  // ✅ Các cột hiển thị (giữ nguyên)
  const columns = [
    {
      title: "Ngày xuất",
      dataIndex: "date",
      key: "date",
      render: (text, record) => (
        <div style={{ 
          opacity: record.isCancelled ? 0.6 : 1,
          textDecoration: record.isCancelled ? "line-through" : "none"
        }}>
          {dayjs(text).format("DD/MM HH:mm")}
        </div>
      ),
      width: 110,
    },
    {
      title: "Mã phiếu",
      dataIndex: "invoiceId",
      key: "invoiceId",
      render: (text, record) => {
  const shortCode =
    text.length > 10 ? text.slice(0, 4) + "-" + text.slice(-4) : text;

  return (
    <Tooltip
      title={
        record.isRefunded
          ? "Phiếu đã hủy & hoàn tiền"
          : record.isCancelled
          ? "Phiếu xuất đã bị hủy (đã hoàn kho)"
          : "Phiếu xuất kho"
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.85rem",
            padding: "2px 8px",
            borderRadius: 6,
            backgroundColor: record.isCancelled ? "#bfbfbf" : "#ff4d4f",
            color: "white",
            textDecoration: record.isCancelled ? "line-through" : "none",
            opacity: record.isCancelled ? 0.9 : 1,
            minWidth: 70,
            textAlign: "center",
          }}
        >
          {shortCode}
        </div>

        {record.isRefunded ? (
          <div
            style={{
              backgroundColor: "#389e0d",
              color: "#fff",
              fontSize: "0.7rem",
              padding: "1px 8px",
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            HOÀN KHO + TIỀN
          </div>
        ) : record.isCancelled ? (
          <div
            style={{
              backgroundColor: "#f0f0f0",
              color: "#555",
              fontSize: "0.7rem",
              padding: "1px 8px",
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            ĐÃ HOÀN KHO
          </div>
        ) : null}
      </div>
    </Tooltip>
  );
},

      width: 120,
    },
    {
      title: "Số NVL",
      dataIndex: "items",
      align: "center",
      render: (items, record) => (
        <div style={{ 
          opacity: record.isCancelled ? 0.6 : 1,
          textDecoration: record.isCancelled ? "line-through" : "none"
        }}>
          {items?.length || 0}
        </div>
      ),
      width: 90,
    },
    {
      title: "Tổng giá trị",
      dataIndex: "totalValue",
      align: "right",
      render: (val, record) => (
        <div style={{ 
          fontWeight: record.isCancelled ? 400 : 500, 
          color: record.isCancelled ? "#999" : "#1677ff",
          textDecoration: record.isCancelled ? "line-through" : "none",
          opacity: record.isCancelled ? 0.6 : 1
        }}>
          {(val || 0).toLocaleString("vi-VN")}₫
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={groupedData}
        pagination={{ pageSize: isMobile ? 5 : 10 }}
        size="small"
        bordered
        rowKey="_id"
        style={{
          fontSize: "0.85rem",
          borderRadius: 8,
          overflow: "hidden",
        }}
        onRow={(record) => ({
          onClick: () => setSelectedExport(record),
          style: { 
            cursor: "pointer",
            background: record.isCancelled ? '#fff2f0' : 'inherit',
          },
        })}
        locale={{ emptyText: "Không có dữ liệu xuất kho" }}
      />

      {selectedExport && (
        <ExportDetailModal
          exportData={selectedExport}
          onClose={() => setSelectedExport(null)}
          inventory={inventory}
        />
      )}
    </>
  );
};

export default ExportHistoryTable;