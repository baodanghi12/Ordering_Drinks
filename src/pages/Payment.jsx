import React, { useState, useEffect } from "react";
import { Card, InputNumber, Button, Radio, List, Tag, Input, message, Select, Spin, Tooltip } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  updateOrderPayment, 
  updateOrderStatus, 
  exportInventoryFromOrder, 
  applyPromoCode,
  fetchPromotions // Thêm hàm fetch promotions
} from "../services/api";

const { Option } = Select;

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSuccess, setShowSuccess] = useState(false);
  const [method, setMethod] = useState(null);
  const [customerPay, setCustomerPay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [finalTotal, setFinalTotal] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  
  // ✅ Lấy dữ liệu từ location.state hoặc localStorage
  const savedCart = JSON.parse(localStorage.getItem("cartData") || "[]");
  const savedTotal = Number(localStorage.getItem("cartTotal") || 0);

  const { totalAmount = savedTotal, cart = savedCart } = location.state || {};
  const orderId = location.state?.orderId || localStorage.getItem("currentOrderId");
  // ✅ THÊM ĐOẠN NÀY NGAY SAU DÒNG 62
  useEffect(() => {
    if (cart.length > 0) {
      const calculatedTotal = calculateTotalCost(cart);
      setOriginalTotal(calculatedTotal);
      setFinalTotal(calculatedTotal);
      console.log("💰 Tổng tiền đơn hàng:", calculatedTotal);
      console.log("📦 Cấu trúc cart:", JSON.stringify(cart, null, 2));
    }
  }, [cart]);
  // ✅ Tính toán tổng tiền từ cart (bao gồm cả extras)
  const calculateTotalCost = (cartItems) => {
    return cartItems.reduce((sum, item) => {
      const sizeCost = item.size?.cost || item.price || 0;
      const quantity = item.qty || item.quantity || 1;
      
      // Tính tiền toppings/extras
      const extrasTotal = item.extras
        ? item.extras.reduce((extSum, extra) => {
            const extraPrice = extra.price || 0;
            const extraQty = extra.qty || 1;
            return extSum + extraPrice * extraQty;
          }, 0) * quantity
        : 0;
      
      const baseCost = sizeCost * quantity;
      return sum + baseCost + extrasTotal;
    }, 0);
  };



  // ✅ Lấy danh sách mã khuyến mãi
  useEffect(() => {
    const loadAvailablePromotions = async () => {
  setLoadingPromotions(true);
  try {
    const response = await fetchPromotions({
      isActive: true,
      limit: 50
    });
    
    if (response.success) {
      const promotions = response.data || [];
      
      // 🆕 LỌC RA NHỮNG MÃ CÒN HIỆU LỰC (CHƯA HẾT HẠN)
      const now = new Date();
      const validPromotions = promotions.filter(promo => {
        const startDate = new Date(promo.startDate); // ✅ THÊM DÒNG NÀY
        const endDate = new Date(promo.endDate);
        return startDate <= now && endDate >= now; // ✅ ĐÃ CÓ startDate
      });
      
      // Kiểm tra điều kiện áp dụng cho từng mã
      const checkedPromotions = await Promise.all(
        validPromotions.map(async (promo) => {
          try {
            const isApplicable = await checkPromotionApplicability(promo, cart, originalTotal);
            return {
              ...promo,
              isApplicable,
              disabledReason: isApplicable ? null : getDisabledReason(promo, cart, originalTotal)
            };
          } catch (error) {
            return {
              ...promo,
              isApplicable: false,
              disabledReason: "Lỗi kiểm tra điều kiện"
            };
          }
        })
      );
      
      setAvailablePromotions(checkedPromotions);
    }
  } catch (error) {
    console.error("❌ Lỗi khi tải mã khuyến mãi:", error);
    message.error("Không thể tải danh sách mã khuyến mãi");
  } finally {
    setLoadingPromotions(false);
  }
};

    if (cart.length > 0) {
      loadAvailablePromotions();
    }
  }, [cart, originalTotal]);

  // ✅ Hàm kiểm tra điều kiện áp dụng mã khuyến mãi
const checkPromotionApplicability = async (promotion, cartItems, totalAmount) => {
  try {
    // Kiểm tra cơ bản
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    // 1. Kiểm tra thời gian (BỎ COMMENT)
    if (now < startDate) {
      console.log(`❌ Mã ${promotion.code}: Chưa đến thời gian áp dụng (${startDate})`);
      return false;
    }
    
    if (now > endDate) {
      console.log(`❌ Mã ${promotion.code}: Đã hết hạn (${endDate})`);
      return false;
    }
    
    // 2. Kiểm tra trạng thái
    if (!promotion.isActive) {
      console.log(`❌ Mã ${promotion.code}: Không active`);
      return false;
    }
    
    // 3. Kiểm tra giá trị đơn hàng tối thiểu
    const minOrderValue = promotion.minOrderValue || 0;
    console.log(`💰 Mã ${promotion.code}: Đơn hàng ${totalAmount} >= ${minOrderValue}?`);
    
    if (totalAmount < minOrderValue) {
      console.log(`❌ Mã ${promotion.code}: Đơn hàng ${totalAmount} < ${minOrderValue}`);
      return false;
    }
    
    // 4. Kiểm tra scope áp dụng
    if (promotion.applicableScope === 'category') {
      const applicableCategories = promotion.applicableCategories || [];
      console.log(`📂 Mã ${promotion.code}: Danh mục áp dụng:`, applicableCategories);
      
      const hasApplicableCategory = cartItems.some(item => 
        applicableCategories.includes(item.category)
      );
      
      if (!hasApplicableCategory) {
        console.log(`❌ Mã ${promotion.code}: Không có sản phẩm thuộc danh mục ${applicableCategories.join(', ')}`);
        return false;
      }
    }
    
    if (promotion.applicableScope === 'specific') {
      const applicableProducts = promotion.applicableProducts || [];
      console.log(`📦 Mã ${promotion.code}: Sản phẩm áp dụng:`, applicableProducts);
      
      const hasApplicableProduct = cartItems.some(item => {
        return applicableProducts.some(promoProduct => 
          promoProduct.productId === item.productId && 
          promoProduct.size === (item.size?.name || item.size)
        );
      });
      
      if (!hasApplicableProduct) {
        console.log(`❌ Mã ${promotion.code}: Không có sản phẩm phù hợp`);
        return false;
      }
    }
    
    // 5. Kiểm tra loại buy_x_get_y
    if (promotion.promotionType === 'buy_x_get_y') {
      let totalQuantity = 0;
      console.log(`🎯 Mã ${promotion.code}: Kiểm tra buy ${promotion.buyX} get ${promotion.getY}`);
      
      if (promotion.applicableScope === 'category') {
        const buyCategories = promotion.buyCategories || [];
        const applicableItems = cartItems.filter(item => 
          buyCategories.includes(item.category)
        );
        totalQuantity = applicableItems.reduce((sum, item) => sum + (item.qty || 1), 0);
        console.log(`📊 Mã ${promotion.code}: Số lượng trong danh mục ${buyCategories.join(', ')}: ${totalQuantity}`);
      } else if (promotion.applicableScope === 'specific') {
        const buyProducts = promotion.buyProducts || [];
        const applicableItems = cartItems.filter(item => {
          return buyProducts.some(promoProduct => 
            promoProduct.productId === item.productId && 
            promoProduct.size === (item.size?.name || item.size)
          );
        });
        totalQuantity = applicableItems.reduce((sum, item) => sum + (item.qty || 1), 0);
        console.log(`📊 Mã ${promotion.code}: Số lượng sản phẩm cụ thể: ${totalQuantity}`);
      } else {
        // Scope all
        totalQuantity = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
        console.log(`📊 Mã ${promotion.code}: Tổng số lượng: ${totalQuantity}`);
      }
      
      if (totalQuantity < promotion.buyX) {
        console.log(`❌ Mã ${promotion.code}: Chỉ có ${totalQuantity} sản phẩm, cần ${promotion.buyX}`);
        return false;
      }
    }
    
    console.log(`✅ Mã ${promotion.code} CÓ THỂ áp dụng!`);
    return true;
  } catch (error) {
    console.error(`❌ Lỗi kiểm tra mã ${promotion.code}:`, error);
    return false;
  }
};

  const getDisabledReason = (promotion, cartItems, totalAmount) => {
  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);
  
  // Kiểm tra thời gian - BỎ COMMENT DÒNG NÀY
  if (now < startDate) return "Chưa đến thời gian áp dụng";
  if (now > endDate) return "Đã hết hạn";  // ✅ BỎ COMMENT
    
    // Kiểm tra trạng thái
     if (!promotion.isActive) return "Không khả dụng";
    
    // Kiểm tra giá trị đơn hàng
    const minOrderValue = promotion.minOrderValue || 0;
    if (totalAmount < minOrderValue) {
      return `Đơn tối thiểu ${formatCurrency(minOrderValue)}`;
    }
    
    // Kiểm tra scope
    if (promotion.applicableScope === 'category') {
      const applicableCategories = promotion.applicableCategories || [];
      if (applicableCategories.length > 0) {
        const hasApplicableCategory = cartItems.some(item => 
          applicableCategories.includes(item.category)
        );
        if (!hasApplicableCategory) {
          return `Chỉ áp dụng cho danh mục: ${applicableCategories.join(', ')}`;
        }
      }
    }
    
    if (promotion.applicableScope === 'specific') {
      const applicableProducts = promotion.applicableProducts || [];
      if (applicableProducts.length > 0) {
        const hasApplicableProduct = cartItems.some(item => {
          return applicableProducts.some(promoProduct => 
            promoProduct.productId === item.productId && 
            promoProduct.size === (item.size?.name || item.size)
          );
        });
        if (!hasApplicableProduct) {
          return "Chỉ áp dụng cho sản phẩm nhất định";
        }
      }
    }
    
    // Kiểm tra buy_x_get_y
    if (promotion.promotionType === 'buy_x_get_y') {
      if (promotion.applicableScope === 'category') {
        const buyCategories = promotion.buyCategories || [];
        if (buyCategories.length > 0) {
          const applicableItems = cartItems.filter(item => buyCategories.includes(item.category));
          const totalQuantity = applicableItems.reduce((sum, item) => sum + (item.qty || 1), 0);
          if (totalQuantity < promotion.buyX) {
            return `Cần mua ${promotion.buyX} sản phẩm trong danh mục ${buyCategories.join(', ')}`;
          }
        }
      } else if (promotion.applicableScope === 'specific') {
        const buyProducts = promotion.buyProducts || [];
        if (buyProducts.length > 0) {
          const applicableItems = cartItems.filter(item => {
            return buyProducts.some(promoProduct => 
              promoProduct.productId === item.productId && 
              promoProduct.size === (item.size?.name || item.size)
            );
          });
          const totalQuantity = applicableItems.reduce((sum, item) => sum + (item.qty || 1), 0);
          if (totalQuantity < promotion.buyX) {
            return `Cần mua ${promotion.buyX} sản phẩm nhất định`;
          }
        }
      } else {
        const totalQuantity = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
        if (totalQuantity < promotion.buyX) {
          return `Cần mua ${promotion.buyX} sản phẩm`;
        }
      }
    }
    
    return "Không đủ điều kiện";
  };

  const qrImage = "https://res.cloudinary.com/drzyhqg1q/image/upload/v1759862613/n35pepabrqglambdjzcu.jpg";
  const change = Math.max(customerPay - finalTotal, 0);

 // File: Payment.jsx - trong hàm handleApplyPromoCode
const handleApplyPromoCode = async (code) => {
  if (!code) {
    // Nếu chọn "-- Không áp dụng mã --"
    if (appliedPromo) {
      handleRemovePromoCode();
    }
    message.warning("Vui lòng chọn mã khuyến mãi");
    return;
  }

  setApplyingPromo(true);
  try {
    const response = await applyPromoCode(code, originalTotal, cart);
    
    // ✅ CẬP NHẬT: Backend trả về response.data chứa thông tin
    if (response.success) {
      const promoData = response.data;
      
      // Xử lý theo promotionType
      if (promoData.promotionType === 'discount') {
        const discountAmount = promoData.discount || 0;
        const newTotal = Math.max(originalTotal - discountAmount, 0);
        
        setFinalTotal(newTotal);
        setAppliedPromo({
          code: code,
          discountAmount: discountAmount,
          discountPercent: promoData.discountType === 'percentage' ? promoData.discountValue : 0,
          description: `Giảm ${discountAmount.toLocaleString()}₫`,
          promotionType: 'discount'
        });
        
        message.success("Áp dụng mã khuyến mãi thành công!");
        
      } else if (promoData.promotionType === 'gift') {
        // Xử lý gift promotion
        setAppliedPromo({
          code: code,
          discountAmount: 0,
          discountPercent: 0,
          description: `Tặng ${promoData.gift?.quantity || 1}x ${promoData.gift?.name}`,
          promotionType: 'gift',
          giftName: promoData.gift?.name,
          giftQuantity: promoData.gift?.quantity
        });
        
        setFinalTotal(originalTotal); // Tổng không đổi
        message.success(`Áp dụng mã tặng quà: ${promoData.gift?.name}`);
        
      } else if (promoData.promotionType === 'buy_x_get_y') {
        // Xử lý buy_x_get_y
        setAppliedPromo({
          code: code,
          discountAmount: 0,
          discountPercent: 0,
          description: `Mua ${promoData.qualifiedItems} tặng ${promoData.freeItems} sản phẩm`,
          promotionType: 'buy_x_get_y',
          freeItems: promoData.freeItems
        });
        
        setFinalTotal(originalTotal); // Tổng không đổi
        message.success(`Áp dụng mã Mua ${promo.promotion?.buyX} Tặng ${promo.promotion?.getY} thành công!`);
      }
    } else {
      message.error(response.message || "Mã khuyến mãi không hợp lệ");
    }
  } catch (error) {
    console.error("❌ Lỗi khi áp dụng mã khuyến mãi:", error);
    
    // Hiển thị thông báo lỗi chi tiết hơn
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        "Lỗi khi áp dụng mã khuyến mãi";
    message.error(errorMessage);
  } finally {
    setApplyingPromo(false);
  }
};

  // 🆕 HÀM XOÁ MÃ KHUYẾN MÃI
  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setFinalTotal(originalTotal);
    message.info("Đã xoá mã khuyến mãi");
  };

  // 🆕 HÀM XUẤT KHO KHI THANH TOÁN
  const handleExportInventory = async () => {
    try {
      if (!orderId) {
        console.error("❌ Không có orderId để xuất kho");
        return;
      }

      console.log("📦 Bắt đầu xuất kho cho đơn hàng:", orderId);
      
      const result = await exportInventoryFromOrder(orderId, cart);
      console.log("✅ Xuất kho thành công:", result);
      return result;
    } catch (error) {
      console.error("❌ Lỗi khi xuất kho:", error);
      throw error;
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderId) {
      alert("Không tìm thấy đơn hàng. Vui lòng tạo đơn hàng trước khi thanh toán!");
      return;
    }

    setLoading(true);

    try {
      // 🆕 BƯỚC 1: XUẤT KHO
      await handleExportInventory();

      // 🔹 BƯỚC 2: Cập nhật phương thức thanh toán và trạng thái
      await updateOrderPayment(orderId, method);
      await updateOrderStatus(orderId, "paid");

      // 🔹 BƯỚC 3: Xóa dữ liệu tạm
      localStorage.removeItem("cartData");
      localStorage.removeItem("cartTotal");
      localStorage.removeItem("currentOrderId");

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/order", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("❌ Lỗi khi xác nhận thanh toán:", error);
      alert("Lỗi khi xác nhận thanh toán: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 HÀM ĐỊNH DẠNG TIỀN
  const formatCurrency = (amount) => {
    return amount.toLocaleString("vi-VN") + " ₫";
  };

  // 🆕 RENDER GIFT THÔNG TIN
  const renderGiftInfo = () => {
    if (!appliedPromo || appliedPromo.promotionType !== "gift") return null;
    
    return (
      <div style={{
        padding: "8px",
        backgroundColor: "#fff7e6",
        border: "1px solid #ffd591",
        borderRadius: "6px",
        marginTop: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#fa8c16" }}>🎁</span>
          <span style={{ fontWeight: 500 }}>
            Tặng {appliedPromo.giftQuantity}x {appliedPromo.giftName}
          </span>
        </div>
      </div>
    );
  };

  // 🆕 RENDER PROMOTION OPTION
  const renderPromotionOption = (promotion) => {
    const isDisabled = !promotion.isApplicable;
    
    // Định dạng hiển thị cho option
    const getOptionText = () => {
      let text = `${promotion.code} - ${promotion.name}`;
      
      if (promotion.discountType === 'percentage' && promotion.discountValue) {
        text += ` (-${promotion.discountValue}%)`;
      } else if (promotion.discountType === 'fixed' && promotion.discountValue) {
        text += ` (-${formatCurrency(promotion.discountValue)})`;
      } else if (promotion.promotionType === 'buy_x_get_y') {
        text += ` (Mua ${promotion.buyX} tặng ${promotion.getY})`;
      } else if (promotion.promotionType === 'gift') {
        text += ` (Tặng ${promotion.giftQuantity}x ${promotion.giftName})`;
      }
      
      return text;
    };

    return (
      <Option 
        key={promotion.code} 
        value={promotion.code}
        disabled={isDisabled}
      >
        <Tooltip 
          title={isDisabled ? promotion.disabledReason : promotion.description}
          placement="right"
        >
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            opacity: isDisabled ? 0.5 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer"
          }}>
            <span>{getOptionText()}</span>
            {promotion.minOrderValue > 0 && (
              <span style={{ fontSize: "0.85rem", color: "#666" }}>
                Đơn tối thiểu: {formatCurrency(promotion.minOrderValue)}
              </span>
            )}
          </div>
        </Tooltip>
      </Option>
    );
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        marginBottom: "90px",
      }}
    >
      <Button
        type="default"
        onClick={() => navigate("/order")}
        style={{ alignSelf: "flex-start", borderRadius: 8, marginBottom: "0.5rem" }}
      >
        ← Quay lại
      </Button>

      {/* 🆕 CARD THÔNG TIN MÓN HÀNG */}
      <Card
        title={`Thông tin đơn hàng (${cart.length} món)`}
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <List
          dataSource={cart}
          renderItem={(item, index) => {
            const sizeCost = item.size?.cost || item.price || 0;
            const quantity = item.qty || item.quantity || 1;
            const baseTotal = sizeCost * quantity;
            
            // Tính tiền toppings/extras
            const extrasTotal = item.extras
              ? item.extras.reduce((sum, extra) => {
                  const extraPrice = extra.price || 0;
                  const extraQty = extra.qty || 1;
                  return sum + extraPrice * extraQty;
                }, 0) * quantity
              : 0;
            
            const itemTotal = baseTotal + extrasTotal;

            return (
              <List.Item
                key={index}
                style={{ borderBottom: "1px solid #f0f0f0", padding: "12px 0" }}
              >
                <div style={{ width: "100%" }}>
                  {/* Tên món và số lượng */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ fontWeight: 600 }}>
                      {item.name} {item.size && `(${item.size.name || item.size})`}
                    </div>
                    <div style={{ color: "#1890ff", fontWeight: 600 }}>
                      {formatCurrency(itemTotal)}
                    </div>
                  </div>

                  {/* Thông tin chi tiết */}
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    <div>Số lượng: {quantity} × {formatCurrency(sizeCost)}</div>
                    
                    {/* Toppings/Extras */}
                    {item.extras && item.extras.length > 0 && (
                      <div style={{ marginTop: "4px" }}>
                        <div style={{ fontWeight: 500, color: "#555" }}>Toppings:</div>
                        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                          {item.extras.map((extra, idx) => (
                            <li key={idx} style={{ fontSize: "0.85rem", color: "#777" }}>
                              {extra.name} × {extra.qty || 1} (+{formatCurrency((extra.price || 0) * (extra.qty || 1))})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ghi chú */}
                    {item.note && (
                      <div style={{ marginTop: "4px", fontStyle: "italic", color: "#888" }}>
                        📝 Ghi chú: {item.note}
                      </div>
                    )}
                  </div>
                </div>
              </List.Item>
            );
          }}
        />

        {/* Tổng tiền */}
        <div style={{ 
          marginTop: "16px", 
          paddingTop: "16px", 
          borderTop: "1px solid #f0f0f0",
        }}>
          {appliedPromo && (
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              marginBottom: "8px",
              color: "#fa541c"
            }}>
              <div>Giảm giá:</div>
              <div style={{ fontWeight: 600 }}>
                {appliedPromo.discountAmount > 0 
                  ? `-${formatCurrency(appliedPromo.discountAmount)}`
                  : `-${appliedPromo.discountPercent}%`
                }
              </div>
            </div>
          )}
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
            fontSize: "1.1rem"
          }}>
            <div>Thành tiền:</div>
            <div style={{ color: "#1890ff", fontSize: "1.2rem" }}>
              {formatCurrency(finalTotal)}
            </div>
          </div>
          
          {appliedPromo && (
            <div style={{ 
              marginTop: "4px", 
              fontSize: "0.85rem", 
              color: "#999",
              textAlign: "right"
            }}>
              (Giá gốc: {formatCurrency(originalTotal)})
            </div>
          )}
        </div>
      </Card>

      {/* 🆕 CARD ÁP DỤNG MÃ KHUYẾN MÃI DƯỚI DẠNG SELECT */}
      <Card
        title="Áp dụng mã khuyến mãi"
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {loadingPromotions ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin />
            <p style={{ marginTop: "10px" }}>Đang tải mã khuyến mãi...</p>
          </div>
        ) : (
          <>
            {/* Select mã khuyến mãi */}
            <div style={{ marginBottom: "16px" }}>
              <Select
  placeholder="Chọn mã khuyến mãi"
  style={{ width: "100%" }}
  value={appliedPromo?.code || promoCode}
  onChange={(value) => {
    if (appliedPromo) {
      handleRemovePromoCode();
    }
    setPromoCode(value);
    if (value) {
      handleApplyPromoCode(value);
    }
  }}
  disabled={!!appliedPromo || applyingPromo}
  showSearch
  filterOption={(input, option) => {
    // 🆕 SỬA LỖI: Kiểm tra option có children hay không
    if (!option || !option.children) return false;
    
    // Trường hợp "-- Không áp dụng mã --"
    if (typeof option.children === 'string') {
      return option.children.toLowerCase().includes(input.toLowerCase());
    }
    
    // Trường hợp promotion option
    if (option.children.props && option.children.props.children) {
      const text = option.children.props.children[0].props.children;
      return text.toLowerCase().includes(input.toLowerCase());
    }
    
    return false;
  }}
  size="large"
>
  <Option value="">-- Không áp dụng mã --</Option>
  {availablePromotions.map(promotion => renderPromotionOption(promotion))}
</Select>
              
              <div style={{ 
                marginTop: "8px", 
                fontSize: "0.85rem", 
                color: "#666",
                textAlign: "center"
              }}>
                Mã không khả dụng sẽ bị làm mờ
              </div>
            </div>

            {/* Thông tin mã khuyến mãi đã áp dụng */}
            {appliedPromo && (
              <div style={{
                padding: "12px",
                backgroundColor: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: "8px",
                marginBottom: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Tag color="success">Đã áp dụng</Tag>
                    <span style={{ marginLeft: "8px", fontWeight: 600 }}>{appliedPromo.code}</span>
                  </div>
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={handleRemovePromoCode}
                  >
                    Xoá
                  </Button>
                </div>
                
                {appliedPromo.description && (
                  <div style={{ marginTop: "8px", fontSize: "0.9rem", color: "#666" }}>
                    {appliedPromo.description}
                  </div>
                )}
                
                {/* Hiển thị thông tin quà tặng nếu có */}
                {renderGiftInfo()}
              </div>
            )}

            {/* Thống kê mã khuyến mãi */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              fontSize: "0.85rem",
              color: "#666",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid #f0f0f0"
            }}>
              <span>Tổng mã khả dụng: {availablePromotions.filter(p => p.isApplicable).length}</span>
              <span>Tổng mã: {availablePromotions.length}</span>
            </div>
          </>
        )}
      </Card>

      {/* CARD CHỌN PHƯƠNG THỨC THANH TOÁN */}
      <Card
        title="Chọn phương thức thanh toán"
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Radio.Group
          onChange={(e) => setMethod(e.target.value)}
          value={method}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Radio value="cash">💵 Thanh toán bằng tiền mặt</Radio>
          <Radio value="transfer">🏦 Thanh toán bằng chuyển khoản (QR)</Radio>
        </Radio.Group>
      </Card>

      {/* PHẦN THANH TOÁN CHUYỂN KHOẢN */}
      {method === "transfer" && (
        <Card
          title="Thanh toán qua mã QR"
          style={{
            width: "100%",
            maxWidth: 400,
            textAlign: "center",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <img
            src={qrImage}
            alt="QR Thanh toán"
            style={{
              width: 220,
              height: 220,
              borderRadius: 8,
              border: "1px solid #ddd",
              marginBottom: "1rem",
              objectFit: "cover",
            }}
          />
          <p>
            Quét mã QR để chuyển khoản qua MoMo hoặc ngân hàng.
            <br />
            Vui lòng ghi rõ nội dung chuyển khoản.
          </p>

          <div style={{ marginBottom: "1rem", textAlign: "left" }}>
            <p>
              <strong>Số tiền sẽ chuyển:</strong>
            </p>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Nhập số tiền chuyển khoản"
              value={customerPay}
              onChange={(value) => setCustomerPay(value)}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </div>

          <div style={{ marginBottom: "1rem", textAlign: "left" }}>
            <p>
              <strong>Tổng tiền sau giảm giá:</strong> {formatCurrency(finalTotal)}
            </p>
            <p>
              <strong>Chênh lệch:</strong> {formatCurrency(change)}
            </p>
          </div>

          <Button
            type="primary"
            block
            onClick={handleConfirmPayment}
            disabled={!method || customerPay < finalTotal}
            loading={loading}
          >
            ✅ Xác nhận đã thanh toán
          </Button>
        </Card>
      )}

      {/* PHẦN THANH TOÁN TIỀN MẶT */}
      {method === "cash" && (
        <Card
          title="Thanh toán bằng tiền mặt"
          style={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <p>
              <strong>Tổng tiền sau giảm giá:</strong> {formatCurrency(finalTotal)}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <p>
              <strong>Khách đưa:</strong>
            </p>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Nhập số tiền khách đưa"
              value={customerPay}
              onChange={(value) => setCustomerPay(value)}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <p>
              <strong>Tiền thừa trả khách:</strong> {formatCurrency(change)}
            </p>
          </div>

          <Button
            type="primary"
            block
            onClick={handleConfirmPayment}
            disabled={customerPay < finalTotal}
            loading={loading}
          >
            ✅ Xác nhận thanh toán
          </Button>
        </Card>
      )}

      {/* THÔNG BÁO THÀNH CÔNG */}
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.9)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            fontSize: "1.2rem",
            color: "#52c41a",
            animation: "fadeInOut 2s forwards",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "1rem",
              animation: "bounce 1s infinite",
            }}
          >
            ✅
          </div>
          <div>Đơn hàng đã được tạo thành công!</div>
        </div>
      )}
    </div>
  );
};

export default Payment;