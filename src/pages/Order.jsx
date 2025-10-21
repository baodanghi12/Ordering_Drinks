import React, { useState, useEffect } from "react";
import { Input, Button, message } from "antd";
import { fetchProducts, createOrder, exportInventory } from "../services/api";
import { useNavigate } from "react-router-dom";
import ProductList from "../components/ProductList";
import CartSection from "../components/CartSection";
import AddItemModal from "../modals/AddItemModal";
import EditItemModal from "../modals/EditItemModal";

const { Search } = Input;

const Order = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["Tất cả"]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchValue, setSearchValue] = useState("");

  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("cartData") || "[]")
  );
  const [cartExpanded, setCartExpanded] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await fetchProducts();
      setProducts(data || []);
      const cats = Array.from(new Set(["Tất cả", ...(data.map((p) => p.category || "Khác"))]));
      setCategories(cats);
    })();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === "Tất cả" || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cartData", JSON.stringify(newCart));
  };

const handlePlaceOrder = async () => {
  if (cart.length === 0) return message.warning("Giỏ hàng trống");

  // ✅ Tính tổng giá bán
  const cartTotal = cart.reduce((sum, item) => {
    const base = item.price * item.qty;
    const extraTotal = item.extras
      ? item.extras.reduce((a, e) => a + e.price * (e.qty || 1), 0) * item.qty
      : 0;
    return sum + base + extraTotal;
  }, 0);

  // ✅ Tính tổng cost
  const cartCost = cart.reduce((sum, item) => {
    const baseCost = (item.cost || 0) * (item.qty || 1);
    const extraCost = item.extras
      ? item.extras.reduce(
          (a, e) => a + (e.cost || 0) * (e.qty || 1),
          0
        ) * (item.qty || 1)
      : 0;

    const container = item.isExtra ? (item.containerCost || 0) : 0;
    return sum + baseCost + extraCost + container;
  }, 0);

  try {
    // 1. Tạo đơn hàng trước
    const payload = {
      items: cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        size: i.size,
        qty: i.qty,
        note: i.note,
        price: i.price,
        cost: i.cost,
        containerCost: i.containerCost || 0,
        isSeparate: i.isSeparate || false,
        extras: i.extras?.map((ex) => ({
          productId: ex.productId,
          name: ex.name,
          price: ex.price,
          qty: ex.qty,
          cost: ex.cost,
          isSeparate: false,
        })) || [],
      })),
      total: cartTotal,
      totalCost: cartCost,
      profit: cartTotal - cartCost,
      paymentMethod: "cash",
    };

    const orderResult = await createOrder(payload);
    console.log("✅ Order created:", orderResult);

    // 2. Chuẩn bị data xuất kho
const exportItems = [];

// Lấy tất cả products để có recipe
const allProducts = await fetchProducts();
console.log("📦 All products loaded:", allProducts.length);

cart.forEach(item => {
  console.log("🔍 Processing cart item:", item.name, "productId:", item.productId);
  
  // Tìm product trong database để lấy recipe
  const productInDb = allProducts.find(p => p._id === item.productId);
  
  if (productInDb && productInDb.sizes) {
    const sizeData = productInDb.sizes.find(s => s.name === item.size);
    console.log("🔍 Size data found:", sizeData);
    
    if (sizeData && sizeData.recipe) {
      console.log("🔍 Recipe found:", sizeData.recipe);
      // Nhân số lượng với qty của item
      sizeData.recipe.forEach(ingredient => {
        exportItems.push({
          ingredientId: ingredient.ingredientId,
          qty: ingredient.qty * item.qty,
          note: `Dùng cho ${item.name} (${item.size}) x${item.qty}`
        });
      });
    } else {
      console.log("❌ No recipe found for size:", item.size);
    }
  } else {
    console.log("❌ Product or sizes not found in DB");
  }
});

console.log("📦 Export items prepared:", exportItems);

// 3. Gọi export inventory nếu có nguyên liệu cần xuất
if (exportItems.length > 0) {
  const exportPayload = {
    items: exportItems,
    note: `Xuất kho khi tạo đơn hàng #${orderResult._id}`
  };
  
  console.log("🚀 Calling exportInventory with:", exportPayload);
  await exportInventory(exportPayload);
  console.log("✅ Export inventory thành công");
} else {
  console.log("ℹ️ Không có nguyên liệu nào cần xuất kho");
}

    message.success("Tạo đơn thành công!");
    navigate("/payment", { state: { totalAmount: cartTotal, cart } });
  } catch (err) {
    console.error("❌ Lỗi tạo đơn:", err);
    message.error("Lỗi tạo đơn");
  }
};

  return (
    <div style={{ padding: "1rem", marginBottom: "90px" }}>
      <Search
        placeholder="Tìm món..."
        onChange={(e) => setSearchValue(e.target.value)}
        style={{ width: "80%", marginBottom: "1rem" }}
      />

      <div style={{ display: "flex", justifyContent: "space-around", overflowX: "auto" }}>
        {categories.map((cat) => (
          <Button
            key={cat}
            type={cat === selectedCategory ? "primary" : "default"}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <ProductList products={filteredProducts} onAddClick={(p) => {
        setSelectedProduct(p);
        setModalOpen(true);
      }} />

      <CartSection
        cart={cart}
        cartExpanded={cartExpanded}
        setCartExpanded={setCartExpanded}
        updateCart={updateCart}
        cartTotal={cart.reduce((sum, item) => {
  const base = (item.price || 0) * (item.qty || 0);
  const extras = item.extras
    ? item.extras.reduce(
        (sub, e) => sub + (e.price || 0) * (e.qty || 1),
        0
      ) * (item.qty || 1)
    : 0;
  return sum + base + extras;
}, 0)}

        onEditItem={(item, idx) => {
          setSelectedProduct(item);
          setSelectedSize(item.size);
          setNote(item.note);
          setQuantity(item.qty);
          setEditIndex(idx);
          setEditModalOpen(true);
        }}
        onPlaceOrder={handlePlaceOrder}
      />


<AddItemModal
  visible={modalOpen}
  product={selectedProduct}
  size={selectedSize}
  setSize={setSelectedSize}
  note={note}
  setNote={setNote}
  qty={quantity}
  setQty={setQuantity}
  onOk={(itemData) => {
    // ✅ itemData đã có extras do AddItemModal truyền ra
    const newItem = {
      ...itemData,
      isSeparate: selectedProduct.isExtra ? true : false,
    };

    const updatedCart = [...cart, newItem];
    setCart(updatedCart);
    localStorage.setItem("cartData", JSON.stringify(updatedCart));

    message.success("Đã thêm vào giỏ");
    setModalOpen(false);
  }}
  onCancel={() => setModalOpen(false)}
/>

<EditItemModal
  visible={editModalOpen}
  product={selectedProduct}
  size={selectedSize}
  setSize={setSelectedSize}
  note={note}
  setNote={setNote}
  qty={quantity}
  setQty={setQuantity}
  onOk={(updatedData) => {
    // ✅ Cập nhật lại đúng món (bao gồm cả extras)
    const newCart = cart.map((i, index) =>
      index === editIndex ? updatedData : i
    );

    updateCart(newCart);
    setEditModalOpen(false);
    message.success("Đã cập nhật món");
  }}
  onCancel={() => setEditModalOpen(false)}
/>


    </div>
  );
};

export default Order;
