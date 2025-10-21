import React from "react";
import { Table, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

const RecipeTable = ({ products, inventory, onEdit, onView }) => {
  // ✅ Gom sản phẩm theo size để hiển thị rõ ràng
  const productsForTable = products.flatMap((p) => {
    if (Array.isArray(p.sizes) && p.sizes.length > 0) {
      return p.sizes.map((size) => ({
        ...p,
        displayId: `${p._id}-${size._id}`,
        productId: p._id,
        sizeId: size._id,
        size,
      }));
    }
    return [
      {
        ...p,
        displayId: p._id,
        productId: p._id,
        sizeId: null,
        size: { name: "Mặc định", _id: null, recipe: p.recipe || [] },
      },
    ];
  });

  // ✅ Hàm tính tổng cost (chuẩn theo usageUnit và unitWeight)
  const calcCost = (recipe = [], recordName = "") => {
    return recipe.reduce((total, ing) => {
      const ingId =
        ing.ingredientId?._id?.toString() || ing.ingredientId?.toString();
      const item = inventory?.find((i) => i._id?.toString() === ingId);
      if (!item) return total;

      let amount = ing.qty || ing.amount || 0;
      let costPerUnit = item.cost_per_unit || 0;

      // ✅ Lấy usageUnit từ inventory
      const invUnit = item.usageUnit || "pcs";

      // ✅ Quy đổi chi phí theo usageUnit và unitWeight
      switch (invUnit) {
        case "gram":
          // nếu tồn kho dạng bịch, mỗi bịch có unitWeight gram
          if (item.unitWeight > 0)
            costPerUnit = item.cost_per_unit / item.unitWeight;
          break;

        case "ml":
          // nếu tồn kho dạng hộp/chai, mỗi hộp có unitWeight ml
          if (item.unitWeight > 0)
            costPerUnit = item.cost_per_unit / item.unitWeight;
          break;

        case "cái":
          // không quy đổi, vì đếm từng cái
          break;

        default:
          break;
      }

      const lineCost = amount * costPerUnit;
      return total + lineCost;
    }, 0);
  };

  const columns = [
    {
      title: "Tên món",
      dataIndex: "name",
      render: (text, record) => {
        const sizeLabel =
          record.size?.name && record.size?.name.trim() !== ""
            ? record.size.name
            : !record.size
            ? "Mặc định"
            : "";

        return (
          <span
            style={{ cursor: "pointer", color: "#1890ff" }}
            onClick={() => onView(record)}
          >
            {text} {sizeLabel ? `(${sizeLabel})` : ""}
          </span>
        );
      },
    },
    {
      title: "Tổng cost (₫)",
      align: "center",
      render: (_, record) => {
        const recipe = record.size?.recipe || record.recipe || [];
        const totalCost = calcCost(recipe, record.name);
        return (
          <span style={{ fontWeight: 500 }}>
            {totalCost ? totalCost.toLocaleString() + "₫" : "0₫"}
          </span>
        );
      },
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => onEdit(record, record.sizeId)}
        />
      ),
    },
  ];

  return (
    <Table
      dataSource={productsForTable}
      columns={columns}
      rowKey={(r) => r.displayId}
      pagination={false}
    />
  );
};

export default RecipeTable;
