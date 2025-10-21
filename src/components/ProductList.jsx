import React from "react";
import { Button } from "antd";

const ProductList = ({ products, onAddClick }) => {
  // Hàm lấy giá size M (hoặc size đầu tiên nếu không có M)
  const getPrice = (product) => {
    if (!product.sizes || product.sizes.length === 0) return product.price || 0;

    const sizeM = product.sizes.find((s) => s.size === "M");
    return sizeM ? sizeM.price : product.sizes[0].price;
  };

  return (
    <div style={{ display: "block", width: "100%" }}>
      {products
  .filter(
    (p) =>
      (p.recipe && p.recipe.length > 0) || // có công thức chung
      (p.sizes && p.sizes.some((s) => s.recipe && s.recipe.length > 0)) // hoặc có công thức ở size
  )
  .map((product) => (
        <div
          key={product._id}
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            padding: "0.8rem",
            marginBottom: "0.8rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          {/* Bên trái: Ảnh + thông tin món */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
            <img
              src={product.image || "/images/default.jpg"}
              alt={product.name}
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "10px",
                border: "1px solid #ddd",
              }}
            />
            <div>
              <h4 style={{ fontSize: "1rem", margin: 0, color: "#000" }}>
                {product.name}
              </h4>
              <p style={{ color: "#888", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                {getPrice(product).toLocaleString()}đ
              </p>
            </div>
          </div>

          {/* Nút thêm món */}
          <Button type="primary" shape="circle" onClick={() => onAddClick(product)}>
            +
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
