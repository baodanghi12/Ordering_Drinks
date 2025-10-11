import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  Card,
  Row,
  Col,
  Modal,
  Select,
  InputNumber,
  message,
  Upload,
} from "antd";
import axios from "axios";
import { fetchProducts, createOrder } from "../services/api";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
const { Search } = Input;
const { Option } = Select;

const Order = () => {
    const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["Tất cả"]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchValue, setSearchValue] = useState("");
  // 🧠 modal sửa món đã thêm
const [editModalOpen, setEditModalOpen] = useState(false);
const [editIndex, setEditIndex] = useState(null);
  const [cart, setCart] = useState(() => {
  const savedCart = JSON.parse(localStorage.getItem("cartData") || "[]");
  return savedCart;
});
  const [cartExpanded, setCartExpanded] = useState(false);

  // modal add item
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);

  // ✅ modal thêm món mới
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data || []);
      const cats = Array.from(
        new Set(["Tất cả", ...(data.map((p) => p.category || "Khác"))])
      );
      setCategories(cats);
    } catch (err) {
      console.error("Load products error", err);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === "Tất cả" || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchValue.toLowerCase())
  );

// ✅ Khi bấm dấu "+"
const handleAddClick = (product) => {
  if (!product) return;

setCart((prev) => {
  const newCart = prev.map((item, i) =>
    i === editIndex
      ? { ...item, size: selectedSize, note, qty: quantity }
      : item
  );
  localStorage.setItem("cartData", JSON.stringify(newCart));
  localStorage.setItem("cartTotal", newCart.reduce((s, i) => s + i.price * i.qty, 0));
  return newCart;
});


  message.success(`Đã thêm ${product.name} vào giỏ hàng`);
};


  const handleConfirmAdd = () => {
    const item = {
      productId: selectedProduct._id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      qty: quantity,
      size: selectedSize,
      note,
    };
    setCart((prev) => [...prev, item]);
    message.success("Đã thêm vào giỏ");
    setModalOpen(false);
    setQuantity(1);
    setNote("");
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price)
      return message.warning("Nhập đủ tên và giá món");
    try {
      await axios.post("http://localhost:5000/api/products", newProduct);
      message.success("Thêm món mới thành công");
      setAddModalOpen(false);
      setNewProduct({ name: "", price: "", category: "", image: "" });
      loadProducts();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi thêm món mới");
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return message.warning("Giỏ hàng trống");
    try {
      const payload = {
        items: cart.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          size: i.size,
          note: i.note,
        })),
        paymentMethod: "cash",
      };
// ✅ Lưu giỏ hàng & tổng tiền tạm vào localStorage
    localStorage.setItem("cartData", JSON.stringify(cart));
    localStorage.setItem("cartTotal", cartTotal);
      await createOrder(payload);
      message.success("Tạo đơn thành công!");
       // 🧭 Chuyển sang trang Payment, truyền tổng tiền + giỏ hàng
    navigate("/payment", { state: { totalAmount: cartTotal, cart } });
    } catch (err) {
      console.error(err);
      message.error(err?.message || "Lỗi tạo đơn");
    }
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const updateCart = (newCart) => {
  setCart(newCart);
  localStorage.setItem("cartData", JSON.stringify(newCart));
  localStorage.setItem("cartTotal", newCart.reduce((s, i) => s + i.price * i.qty, 0));
};

  return (
    <div style={{ padding: "1rem", marginBottom: "90px" }}>
      {/* ✅ Thanh tìm kiếm + nút thêm món */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <Search
          placeholder="Tìm món..."
          allowClear
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ width: "80%" }}
        />
        {/* <Button type="primary" onClick={() => setAddModalOpen(true)}>
          + Thêm món
        </Button> */}
      </div>

      {/* Bộ lọc danh mục */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: "0.5rem",
          overflowX: "auto",
        }}
      >
        {categories.map((cat) => (
          <Button
            key={cat}
            type={cat === selectedCategory ? "primary" : "default"}
            onClick={() => setSelectedCategory(cat)}
            style={{ flexShrink: 0, borderRadius: "20px", padding: "0 1rem" }}
          >
            {cat}
          </Button>
        ))}
      </div>

{/* Danh sách món dạng dọc (mỗi món chiếm 100%) */}
<div
  style={{
    display: "block",
    width: "100%",
  }}
>
  {filteredProducts.map((product) => (
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
        alignItems: "center", // canh giữa theo chiều dọc
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      {/* Bên trái: ảnh + thông tin món */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
        <img
          src={product.image || "/images/default.jpg"}
          alt={product.name}
          style={{
            width: "80px",
            height: "80px",
            objectFit: "cover",
            borderRadius: "10px",
            border: "1px solid #ddd", // viền ảnh
          }}
        />
        <div>
          <h4
            style={{
              fontSize: "1rem",
              margin: 0,
              color: "black",
            }}
          >
            {product.name}
          </h4>
          <p
            style={{
              color: "#888",
              fontSize: "0.85rem",
              margin: "4px 0 0 0",
            }}
          >
            {product.price?.toLocaleString()}đ
          </p>
        </div>
      </div>

      {/* Bên phải: nút thêm */}
      <Button
  type="primary"
  shape="circle"
  onClick={() => {
    if (!product) {
      message.error("Không tìm thấy thông tin món!");
      return;
    }
    setSelectedProduct(product);
    setModalOpen(true);
  }}
>
  +
</Button>

    </div>
  ))}
</div>

{/* 🧾 Khu vực giỏ hàng (rút gọn + mở rộng khi vuốt lên) */}
{cart.length > 0 && (
  <div
    style={{
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      background: "#fff",
      borderTop: "1px solid #eee",
      boxShadow: "0 -3px 15px rgba(0,0,0,0.1)",
      borderRadius: "16px 16px 0 0",
      zIndex: 1000,
      transition: "max-height 0.3s ease",
      overflow: "hidden",
      maxHeight: cartExpanded ? "60vh" : "80px",
    }}
  >
    {/* Header giỏ hàng */}
    <div
      onClick={() => setCartExpanded((prev) => !prev)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        cursor: "pointer",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div>
        <b>🧾 Xác nhận đơn hàng</b>{" "}
        <span style={{ color: "#888" }}>({cart.length} món)</span>
      </div>
      <div style={{ fontWeight: "600", color: "#1677ff" }}>
        {cartTotal.toLocaleString()}đ
      </div>
    </div>

    {/* Nội dung chi tiết (chỉ hiển thị khi mở) */}
    <div
  style={{
    maxHeight: "50vh",
    overflowY: "auto",
    padding: cartExpanded ? "0.8rem 1rem 1rem" : "0",
    display: cartExpanded ? "block" : "none",
    touchAction: "pan-y",
    WebkitOverflowScrolling: "touch",
  }}
>

      {cart.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            padding: "0.6rem 0",
          }}
        >
            
          <div style={{ flex: 1 }}>
  <b style={{ fontSize: "1rem", color: "#000" }}>{item.name}</b> {/* ✅ Thêm dòng này */}
  <div style={{ fontSize: "0.85rem", color: "#666" }}>
    Size {item.size} • SL: {item.qty}
  </div>
  {item.note && (
    <div style={{ fontSize: "0.8rem", color: "#999" }}>📝 {item.note}</div>
  )}
</div>
          <div style={{ textAlign: "right" }}>
            <b>{(item.price * item.qty).toLocaleString()}đ</b>
            <div>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setSelectedProduct(item);
                  setSelectedSize(item.size);
                  setNote(item.note);
                  setQuantity(item.qty);
                  setModalOpen(false);
                  setTimeout(() => {
                    setEditIndex(index);
                    setEditModalOpen(true);
                  }, 200);
                }}
              >
                Sửa
              </Button>
              <Button
  type="link"
  danger
  size="small"
  onClick={() => updateCart(cart.filter((_, i) => i !== index))}
>
  Xóa
</Button>

            </div>
          </div>
        </div>
      ))}

      {/* Tổng cộng + xác nhận */}
      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "600",
          fontSize: "1rem",
        }}
      >
        <span>Tổng cộng:</span>
        <span style={{ color: "#1677ff", fontSize: "1.1rem" }}>
          {cartTotal.toLocaleString()}đ
        </span>
      </div>

      <Button
        type="primary"
        size="large"
        block
        style={{
          marginTop: "0.8rem",
          height: "45px",
          fontSize: "1rem",
          fontWeight: "500",
          borderRadius: "10px",
        }}
        onClick={handlePlaceOrder}
      >
        ✅ Xác nhận & Thanh toán
      </Button>
    </div>
  </div>
)}

{/* Modal chọn Size / Ghi chú / Số lượng khi click "+" */}
<Modal
  open={modalOpen}
  onCancel={() => setModalOpen(false)}
  onOk={handleConfirmAdd}
  title={`Thêm ${selectedProduct?.name || ""}`}
>
  <div style={{ marginBottom: 12 }}>
    <b>Chọn size</b>
    <Select
      value={selectedSize}
      onChange={setSelectedSize}
      style={{ width: "100%", marginTop: 8 }}
    >
      <Option value="M">Size M</Option>
      <Option value="L">Size L</Option>
    </Select>
  </div>

  <div style={{ marginBottom: 12 }}>
    <b>Ghi chú</b>
    <Input.TextArea
      rows={2}
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Ví dụ: ít đá, thêm ngọt..."
    />
  </div>

  <div>
    <b>Số lượng</b>
    <InputNumber
      min={1}
      value={quantity}
      onChange={setQuantity}
      style={{ width: "100%", marginTop: 8 }}
    />
  </div>
</Modal>
    
      {/* Modal sửa món trong giỏ */}
<Modal
  open={editModalOpen}
  onCancel={() => setEditModalOpen(false)}
  onOk={() => {
    if (editIndex !== null) {
      setCart((prev) =>
        prev.map((item, i) =>
          i === editIndex
            ? {
                ...item,
                size: selectedSize,
                note,
                qty: quantity,
              }
            : item
        )
      );
    }
    message.success("Đã cập nhật món");
    setEditModalOpen(false);
  }}
  title={`Sửa ${selectedProduct?.name}`}
>
  <div style={{ marginBottom: 12 }}>
    <b>Chọn size</b>
    <Select
      value={selectedSize}
      onChange={setSelectedSize}
      style={{ width: "100%", marginTop: 8 }}
    >
      <Option value="S">Size S</Option>
      <Option value="M">Size M</Option>
      <Option value="L">Size L</Option>
    </Select>
  </div>
  <div style={{ marginBottom: 12 }}>
    <b>Ghi chú</b>
    <Input.TextArea
      rows={2}
      value={note}
      onChange={(e) => setNote(e.target.value)}
    />
  </div>
  <div>
    <b>Số lượng</b>
    <InputNumber
      min={1}
      value={quantity}
      onChange={setQuantity}
      style={{ width: "100%", marginTop: 8 }}
    />
  </div>
</Modal>
    </div>
  );
};

export default Order;
