import React, { useState, useEffect } from "react";
import { Input, Button, message } from "antd";
import { fetchProducts, createOrder, exportInventory, loadInventory } from "../services/api";
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
  const [inventory, setInventory] = useState([]);
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
    const productsData = await fetchProducts();
    setProducts(productsData || []);

    const inventoryData = await loadInventory();
    setInventory(inventoryData || []);

    const cats = Array.from(new Set(["Tất cả", ...(productsData.map(p => p.category || "Khác"))]));
    setCategories(cats);

   
  })();
}, []);

const hasEnoughIngredients = (product, inventory) => {
  if (!inventory || inventory.length === 0) return false;

  // Map: id nguyên liệu => stock đã quy đổi về usageUnit
  const invMap = new Map();
  inventory.forEach(i => {
    let available = i.stock;
    // Nếu unit khác usageUnit thì quy đổi
    if (i.unit !== i.usageUnit && i.unitWeight) {
      available = i.stock * i.unitWeight;
    }
    invMap.set(i._id.toString(), available);
  });

  const recipes = [];

  // Product-level recipe
  if (Array.isArray(product.recipe) && product.recipe.length > 0) {
    recipes.push(product.recipe);
  }

  // Size-level recipe
  if (Array.isArray(product.sizes)) {
    product.sizes.forEach(s => {
      if (Array.isArray(s.recipe) && s.recipe.length > 0) {
        recipes.push(s.recipe);
      }
    });
  }

  return recipes.some(recipeList => {
    const result = recipeList.every(item => {
      const available = invMap.get(item.ingredientId._id.toString()) || 0;
      const enough = available >= item.qty;

      

      return enough;
    });
    
    return result;
  });
};




const filteredProducts = products.filter(
  p =>
    (selectedCategory === "Tất cả" || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchValue.toLowerCase()) &&
    hasEnoughIngredients(p, inventory) // ✅ nhớ truyền inventory
);




  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cartData", JSON.stringify(newCart));
  };

const handlePlaceOrder = async () => {
  if (cart.length === 0) return message.warning("Giỏ hàng trống");

  try {
    // Kiểm tra tồn kho
    const inventoryList = await loadInventory();

    // Kiểm tra từng món trong giỏ có đủ NVL không
    const insufficientItems = [];

    for (let item of cart) {
      const productInDb = await fetchProducts().then(res => res.find(p => p._id === item.productId));
      if (!productInDb) continue;

      const sizeData = productInDb.sizes?.find(s => s.name === item.size);
      const recipe = sizeData?.recipe || productInDb.recipe || [];

      for (let ing of recipe) {
        const inv = inventoryList.find(i => i._id === ing.ingredientId._id || i._id === ing.ingredientId);
        if (!inv) {
          insufficientItems.push(`${item.name} (${item.size}) - Thiếu ${ing.ingredientId.name}`);
          break;
        }

        // ✅ TÍNH TOÁN CHÍNH XÁC SỐ LƯỢNG CÓ SẴN
        let availableStock = inv.stock;
        
        // Nếu unit khác usageUnit thì quy đổi
        if (inv.unit !== inv.usageUnit && inv.unitWeight) {
          availableStock = inv.stock * inv.unitWeight;
        }

        const requiredQty = ing.qty * item.qty;
        
        if (availableStock < requiredQty) {
          insufficientItems.push(`${item.name} (${item.size}) - Thiếu ${inv.name}`);
          break;
        }
      }
    }

    if (insufficientItems.length > 0) {
      return message.error(
        `Không đủ nguyên vật liệu: ${[...new Set(insufficientItems)].join(", ")}`
      );
    }

    // Tính tổng tiền và cost
    const cartTotal = cart.reduce((sum, item) => {
      const base = item.price * item.qty;
      const extraTotal = item.extras
        ? item.extras.reduce((a, e) => a + e.price * (e.qty || 1), 0) * item.qty
        : 0;
      return sum + base + extraTotal;
    }, 0);

    const cartCost = cart.reduce((sum, item) => {
      const baseCost = (item.cost || 0) * (item.qty || 1);
      const extraCost = item.extras
        ? item.extras.reduce((a, e) => a + (e.cost || 0) * (e.qty || 1), 0) * (item.qty || 1)
        : 0;
      const container = item.isExtra ? (item.containerCost || 0) : 0;
      return sum + baseCost + extraCost + container;
    }, 0);

    // 🔹 Tạo đơn hàng với status "pending"
    const payload = {
      items: cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        size: i.size,
        qty: i.qty,
        note: i.note,
        price: i.price,
        // ✅ SỬA: cost → cost_of_goods (theo schema)
        cost_of_goods: (i.cost || 0) * (i.qty || 1),
        isSeparate: i.isSeparate || false,
        extras: i.extras?.map((ex) => ({
          productId: ex.productId,
          name: ex.name,
          price: ex.price,
          qty: ex.qty,
          // ✅ SỬA: cost → cost_of_goods (theo schema)
          cost_of_goods: (ex.cost || 0) * (ex.qty || 1),
          isSeparate: ex.isSeparate || false, // ✅ GIỮ NGUYÊN GIÁ TRỊ GỐC
        })) || [],
      })),
      total: cartTotal,
      totalCost: cartCost, // ✅ GIỮ NGUYÊN - schema có field này
      profit: cartTotal - cartCost,
      paymentMethod: "cash",
      status: "pending"
    };
    // 🔹 THÊM DEBUG ĐỂ KIỂM TRA
    console.log("🚀 Payload gửi lên server:", JSON.stringify(payload, null, 2));
    
    //đâsdasda
    const orderResult = await createOrder(payload);

// ✅ LẤY ĐÚNG orderId TỪ BACKEND
const orderId = orderResult?.order?._id;

if (!orderId) {
  console.error("❌ Không nhận được orderId từ backend:", orderResult);
  message.error("Tạo đơn thất bại (không có orderId)");
  return;
}

localStorage.setItem("currentOrderId", orderId);
localStorage.setItem("cartData", JSON.stringify(cart));
localStorage.setItem("cartTotal", cartTotal.toString());

console.log(`📝 Đã tạo đơn hàng #${orderId}, chuyển đến thanh toán`);

message.success("Tạo đơn thành công! Chuyển đến thanh toán...");

navigate("/payment", { 
  state: { 
    totalAmount: cartTotal, 
    cart, 
    orderId 
  } 
});


  } catch (err) {
  console.error("❌ Lỗi tạo đơn:", err);
  console.error("📝 Response data từ server:", err.response?.data); // 🔹 QUAN TRỌNG
  console.error("📝 Response status:", err.response?.status);
  console.error("📝 Response headers:", err.response?.headers);
  
  const errorMessage = err.response?.data?.message || err.message;
  const insufficientItems = err.response?.data?.insufficientItems;
  
  if (insufficientItems && insufficientItems.length > 0) {
    message.error(`Không đủ nguyên liệu: ${insufficientItems.map(i => i.ingredient).join(", ")}`);
  } else {
    message.error("Lỗi tạo đơn: " + errorMessage);
  }
}
}



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
