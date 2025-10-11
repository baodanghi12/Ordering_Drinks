import React from "react";
import { Table, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

const RecipeTable = ({ products, inventory, onEdit, onView }) => {
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

  // ✅ Hàm tính cost giống EditRecipeModal + log để debug
  const calcCost = (recipe = [], recordName = "") => {
    const total = recipe.reduce((total, ing) => {
      const ingId =
        ing.ingredientId?._id?.toString() || ing.ingredientId?.toString();
      const item = inventory?.find((i) => i._id?.toString() === ingId);

      if (!item) {
        console.warn(
          `⚠️ Ingredient not found in inventory:`,
          ing.ingredientId,
          " | recipe item:",
          ing
        );
        return total;
      }

      let amount = ing.qty || ing.amount || 0;
      let costPerUnit = item.cost_per_unit || 0;

      // Quy đổi đơn vị giống EditRecipeModal
      switch (item.unit) {
        case "g":
          if (item.unitWeight && item.unitWeight !== 0) {
            costPerUnit = costPerUnit / item.unitWeight;
          }
          if (ing.unit === "kg") amount *= 1000;
          break;

        case "kg":
          if (ing.unit === "gr") amount /= 1000;
          break;

        case "ml":
          if (item.unitWeight && item.unitWeight !== 0) {
            costPerUnit = costPerUnit / item.unitWeight;
          }
          if (ing.unit === "l") amount *= 1000;
          break;

        case "l":
          if (ing.unit === "ml") amount /= 1000;
          break;

        case "pcs":
          if (item.unitWeight && ing.unit !== "pcs") {
            amount = amount / item.unitWeight;
          }
          break;

        default:
          break;
      }
      const lineCost = amount * costPerUnit;
      return total + lineCost;
    }, 0);
    return total;
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
