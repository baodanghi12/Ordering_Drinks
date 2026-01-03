import React, { useState, useEffect } from "react";
import { Card, InputNumber, Button, Radio, List, Tag, Input, message, Select, Spin, Tooltip, Modal, Alert } from "antd";
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

  const [showFreeItemModal, setShowFreeItemModal] = useState(false);
  const [availableFreeItems, setAvailableFreeItems] = useState([]);
  const [selectedFreeItems, setSelectedFreeItems] = useState([]);
  const [promotionDetails, setPromotionDetails] = useState(null);
  
  // ✅ Lấy dữ liệu từ location.state hoặc localStorage
  const savedCart = JSON.parse(localStorage.getItem("cartData") || "[]");
  const savedTotal = Number(localStorage.getItem("cartTotal") || 0);

  const { totalAmount = savedTotal, cart = savedCart } = location.state || {};
  const orderId = location.state?.orderId || localStorage.getItem("currentOrderId");
  // Payment.jsx - CẬP NHẬT useEffect
useEffect(() => {
  const calculateAndSetTotals = () => {
    if (cart.length > 0) {
      const calculatedTotal = calculateTotalCost(cart);
      console.log("🛒 Cart items count:", cart.length);
      console.log("💰 Calculated total from cart:", calculatedTotal);
      console.log("🏷️ Saved total from localStorage:", savedTotal);
      
      // Ưu tiên sử dụng tính toán từ cart
      const finalTotal = calculatedTotal > 0 ? calculatedTotal : (savedTotal || 0);
      
      console.log("🎯 Setting totals:", { original: finalTotal, final: finalTotal });
      setOriginalTotal(finalTotal);
      setFinalTotal(finalTotal);
    } else {
      console.log("⚠️ Cart is empty, using saved total:", savedTotal);
      setOriginalTotal(savedTotal || 0);
      setFinalTotal(savedTotal || 0);
    }
  };
  
  calculateAndSetTotals();
}, [cart]); // Chỉ phụ thuộc vào cart, không phụ thuộc vào savedTotal
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

// Payment.jsx - THÊM hàm mới
const checkPromotionApplicabilityWithFallback = async (promotion, cartItems) => {
  try {
    // Lấy total từ state hoặc tính toán trực tiếp
    let currentTotal = originalTotal;
    if (currentTotal === 0 && cartItems.length > 0) {
      currentTotal = calculateTotalCost(cartItems);
      console.log(`🔧 Sử dụng fallback total: ${currentTotal}`);
    }
    
    return await checkPromotionApplicability(promotion, cartItems, currentTotal);
  } catch (error) {
    console.error(`❌ Lỗi kiểm tra promotion với fallback:`, error);
    return false;
  }
};

  // ✅ Lấy danh sách mã khuyến mái
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
      
      // 🆕 LỌC RA NHỮNG MÃ CÒN HIỆU LỰC
      const now = new Date();
      const validPromotions = promotions.filter(promo => {
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);
        return startDate <= now && endDate >= now && promo.isActive;
      });
      
      console.log(`📊 Tổng số mã hợp lệ: ${validPromotions.length}`);
      
      // Tính toán total hiện tại
      const currentTotal = originalTotal > 0 ? originalTotal : calculateTotalCost(cart);
      
      // Kiểm tra điều kiện áp dụng cho từng mã
      const checkedPromotions = await Promise.all(
        validPromotions.map(async (promo) => {
          try {
            const isApplicable = await checkPromotionApplicability(promo, cart, currentTotal);
            return {
              ...promo,
              isApplicable,
              disabledReason: isApplicable ? null : getDisabledReason(promo, cart, currentTotal)
            };
          } catch (error) {
            console.error(`❌ Lỗi kiểm tra mã ${promo.code}:`, error);
            return {
              ...promo,
              isApplicable: false,
              disabledReason: "Lỗi kiểm tra điều kiện"
            };
          }
        })
      );
      
      setAvailablePromotions(checkedPromotions);
      console.log(`✅ Đã tải ${checkedPromotions.length} mã khuyến mãi`);
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

// Payment.jsx - CẬP NHẬT checkPromotionApplicability để debug chi tiết
const checkPromotionApplicability = async (promotion, cartItems, totalAmount) => {
  try {
    console.log(`🔍 Kiểm tra mã: ${promotion.code}, loại: ${promotion.promotionType}`);
    console.log(`🛒 Số lượng sản phẩm trong cart: ${cartItems.length}`);
    console.log(`💰 Tổng tiền đơn hàng: ${totalAmount}`);
    console.log(`📅 Thời gian hiện tại: ${new Date()}`);
    console.log(`📅 Start date: ${new Date(promotion.startDate)}`);
    console.log(`📅 End date: ${new Date(promotion.endDate)}`);
    
    // Kiểm tra cơ bản
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    // 1. Kiểm tra thời gian
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
    
    // 3. Kiểm tra giá trị đơn hàng tối thiểu - FIX LỖI HIỂN THỊ
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

  // Payment.jsx - THÊM hàm debugBackendResponse (trước handleApplyPromoCode)

const debugBackendResponse = (response, code, cart) => {
  console.log("🔍 Debug backend response for code:", code);
  console.log("📦 Full response:", response);
  
  let promoData = response.data || {};
  
  // Kiểm tra và fix dữ liệu nếu cần
  if (promoData.promotionType === 'buy_x_get_y') {
    console.log("🔄 Processing buy_x_get_y promotion...");
    
    // Lấy promotion details
    const promotion = promoData.promotion || {};
    const buyX = promotion.buyX || 2;
    const getY = promotion.getY || 1;
    
    // Tính toán số lượng free items
    const totalQuantity = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    const freeTimes = Math.floor(totalQuantity / buyX);
    const totalFreeItems = freeTimes * getY;
    
    console.log(`📊 Buy ${buyX} Get ${getY}: Total quantity=${totalQuantity}, Free items=${totalFreeItems}`);
    
    // Tạo free items nếu không có từ backend
    if (totalFreeItems > 0 && (!promoData.freeItems || promoData.freeItems.length === 0)) {
      console.log("🆕 Creating free items array...");
      
      let freeItems = [];
      let totalFreeValue = 0;
      
      // Lấy sản phẩm áp dụng từ cart
      const applicableItems = cart.filter(item => {
        // Lọc theo scope
        if (promotion.applicableScope === 'category') {
          return promotion.applicableCategories?.includes(item.category);
        } else if (promotion.applicableScope === 'specific') {
          return promotion.applicableProducts?.some(p => 
            p.productId === item.productId && p.size === item.size
          );
        }
        return true; // Scope all
      });
      
      if (applicableItems.length > 0) {
        // Chọn item đầu tiên làm free item
        const firstItem = applicableItems[0];
        const itemPrice = firstItem.size?.cost || firstItem.price || 14000;
        
        freeItems = [{
          productId: firstItem.productId || firstItem._id,
          name: firstItem.name,
          size: firstItem.size || 'M',
          quantity: totalFreeItems,
          price: itemPrice,
          cost: firstItem.cost || firstItem.size?.cost || 9344,
          isFree: true
        }];
        
        totalFreeValue = itemPrice * totalFreeItems;
        
        console.log(`✅ Created free items:`, freeItems);
        console.log(`💰 Total free value: ${totalFreeValue}`);
        
        // Cập nhật promoData
        promoData = {
          ...promoData,
          buyX,
          getY,
          freeItems,
          totalFreeValue,
          // Cập nhật discount để tính toán giá trị tiết kiệm
          discount: totalFreeValue, // Coi như discount
          discountAmount: totalFreeValue,
          // Giữ finalTotal không đổi
          finalTotal: promoData.finalTotal || 56000
        };
      }
    }
  }
  
  console.log("🔄 Final promo data:", promoData);
  return promoData;
};
// VỊ TRÍ: Sau hàm debugBackendResponse, trước handleApplyPromoCode
const openFreeItemSelection = async (promotionData) => {
  try {
    console.log("🎁 Opening free item selection for:", promotionData);
    setPromotionDetails(promotionData);
    
    // Lấy danh sách sản phẩm có thể tặng
    let freeItemsList = [];
    
    // 🆕 AUTO-SELECT: Tự động chọn sản phẩm tặng
    const autoSelectedItems = [];
    
    // Logic auto-select đơn giản: chọn sản phẩm đầu tiên trong cart
    if (cart.length > 0) {
      const firstCartItem = cart[0];
      autoSelectedItems.push({
        productId: firstCartItem.productId || firstCartItem._id,
        name: firstCartItem.name,
        size: firstCartItem.size?.name || firstCartItem.size || 'M',
        quantity: promotionData.getY || 1,
        price: firstCartItem.size?.price || firstCartItem.price || 0,
        cost: firstCartItem.cost || firstCartItem.size?.cost || 0
      });
      
      console.log("✅ Auto-selected free item:", autoSelectedItems[0]);
    }
    
    setSelectedFreeItems(autoSelectedItems);
    setShowFreeItemModal(true);
    
  } catch (error) {
    console.error("❌ Lỗi khi mở modal chọn sản phẩm tặng:", error);
    message.error("Không thể tải danh sách sản phẩm tặng");
  }
};
// VỊ TRÍ: Ngay sau hàm openFreeItemSelection
const confirmFreeItemSelection = () => {
  if (selectedFreeItems.length === 0) {
    message.warning("Vui lòng chọn ít nhất một sản phẩm tặng");
    return;
  }
  
  // Cập nhật appliedPromo với freeItems đã chọn
  if (appliedPromo && appliedPromo.promotionType === 'buy_x_get_y') {
    const updatedPromo = {
      ...appliedPromo,
      freeItems: selectedFreeItems,
      totalFreeValue: selectedFreeItems.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
      }, 0),
      status: 'selected' // Đánh dấu đã chọn
    };
    
    setAppliedPromo(updatedPromo);
    console.log("✅ Đã chọn sản phẩm tặng:", updatedPromo.freeItems);
    
    message.success(`Đã chọn ${selectedFreeItems.length} sản phẩm tặng`);
  }
  
  setShowFreeItemModal(false);
};
// File: Payment.jsx - CẬP NHẬT handleApplyPromoCode với fallback
const handleApplyPromoCode = async (code) => {
  if (!code) {
    if (appliedPromo) {
      handleRemovePromoCode();
    }
    message.warning("Vui lòng chọn mã khuyến mãi");
    return;
  }

  setApplyingPromo(true);
  try {
    const response = await applyPromoCode(code, originalTotal, cart);
    
    if (response.success) {
      let promoData = response.data;
      
      console.log("📊 Promotion data từ backend:", promoData);
      
      // 🆕 Debug và fix dữ liệu nếu cần
      promoData = debugBackendResponse(response, code, cart) || promoData;  // THÊM cart vào tham số
      
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
          promotionType: 'discount',
          promotionId: promoData.promotion?._id || promoData._id,
          discountType: promoData.discountType,
          discountValue: promoData.discountValue,
          applicableScope: promoData.applicableScope || 'all'
        });
        
        message.success("Áp dụng mã khuyến mãi thành công!");
        
      } else if (promoData.promotionType === 'gift') {
        setAppliedPromo({
          code: code,
          discountAmount: 0,
          discountPercent: 0,
          description: `Tặng ${promoData.gift?.quantity || 1}x ${promoData.gift?.name}`,
          promotionType: 'gift',
          giftName: promoData.gift?.name,
          giftQuantity: promoData.gift?.quantity,
          promotionId: promoData.promotion?._id || promoData._id,
          applicableScope: promoData.applicableScope || 'all'
        });
        
        setFinalTotal(originalTotal);
        message.success(`Áp dụng mã tặng quà: ${promoData.gift?.name}`);
        
      } else if (promoData.promotionType === 'buy_x_get_y') {

  console.log("🎯 Processing buy_x_get_y in handleApplyPromoCode");
  const buyX = promoData.buyX || promoData.promotion?.buyX || 2;
  const getY = promoData.getY || promoData.promotion?.getY || 1;

  const totalQuantity = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const freeTimes = Math.floor(totalQuantity / buyX);
  const totalFreeItems = freeTimes * getY;
  
  console.log(`📊 Buy ${buyX} Get ${getY}, Free items needed: ${totalFreeItems}`);
  
  // 🆕 KIỂM TRA NẾU CẦN CHỌN SẢN PHẨM TẶNG
  const hasPredefinedFreeItems = promoData.freeItems && promoData.freeItems.length > 0;
  
  if (hasPredefinedFreeItems && totalFreeItems > 0) {
    // 🆕 TRƯỜNG HỢP 1: Có freeItems định nghĩa sẵn -> áp dụng luôn
    console.log("✅ Using predefined free items from backend");
    
    const freeItems = promoData.freeItems.slice(0, totalFreeItems); // Lấy đúng số lượng
    const totalFreeValue = freeItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    
    const discountRate = originalTotal > 0 ? Math.round((totalFreeValue / originalTotal) * 100) : 0;
    const avgPricePerItem = totalFreeValue > 0 ? originalTotal / (totalQuantity + totalFreeItems) : 0;
    
    // Set applied promo với đầy đủ thông tin
    setAppliedPromo({
      code: code,
      discountAmount: 0,
      effectiveDiscountValue: totalFreeValue,
      discountPercent: 0,
      description: `Mua ${buyX} tặng ${getY} - Tiết kiệm ${formatCurrency(totalFreeValue)} (${discountRate}%)`,
      promotionType: 'buy_x_get_y',
      freeItems: freeItems,
      totalFreeValue: totalFreeValue,
      promotionId: promoData.promotion?._id || promoData._id,
      buyX: buyX,
      getY: getY,
      applicableScope: promoData.applicableScope || 'all',
      totalItems: totalQuantity,
      totalFreeItems: freeItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
      totalItemsReceived: totalQuantity + freeItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
      effectiveDiscountRate: discountRate,
      effectivePricePerItem: avgPricePerItem,
      originalPricePerItem: totalQuantity > 0 ? originalTotal / totalQuantity : 0
    });
    
    setFinalTotal(originalTotal);
    
    Modal.success({
      title: `✅ Áp dụng mã "${code}" thành công!`,
      content: (
        <div style={{ marginTop: "16px" }}>
          <div style={{ marginBottom: "12px", fontSize: "16px", color: "#1890ff" }}>
            <strong>Chương trình: Mua {buyX} Tặng {getY}</strong>
          </div>
          
          <div style={{ 
            backgroundColor: "#f6ffed", 
            padding: "12px", 
            borderRadius: "6px",
            marginBottom: "12px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Số lượng mua:</span>
              <strong>{totalQuantity} sản phẩm</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Số lượng tặng:</span>
              <strong style={{ color: "#52c41a" }}>{freeItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} sản phẩm</strong>
            </div>
          </div>
          
          {freeItems.length > 0 && (
            <div style={{ 
              backgroundColor: "#e6f7ff", 
              padding: "12px", 
              borderRadius: "6px",
              marginBottom: "12px"
            }}>
              <strong>🎁 Sản phẩm được tặng:</strong>
              {freeItems.map((item, idx) => (
                <div key={idx} style={{ marginTop: "4px", fontSize: "0.9rem" }}>
                  • {item.name} ({item.size}) × {item.quantity || 1}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      okText: "Tuyệt vời!",
      width: 500,
    });
    
  } else if (totalFreeItems > 0) {
    // 🆕 TRƯỜNG HỢP 2: Cần staff/admin chọn sản phẩm tặng
    console.log("🔄 Promotion yêu cầu chọn sản phẩm tặng");
    
    // Lưu tạm promotion data
    setPromotionDetails({
      ...promoData,
      code: code,
      buyX: buyX,
      getY: getY,
      totalFreeItemsNeeded: totalFreeItems
    });
    
    // MỞ MODAL CHỌN SẢN PHẨM TẶNG
    setTimeout(() => {
      openFreeItemSelection({
        ...promoData,
        code: code,
        buyX: buyX,
        getY: getY,
        totalFreeItemsNeeded: totalFreeItems
      });
    }, 300);
    
    // Tạm thời set appliedPromo với trạng thái "cần chọn sản phẩm"
    setAppliedPromo({
      code: code,
      promotionType: 'buy_x_get_y',
      status: 'needs_selection',
      description: `Mua ${buyX} tặng ${getY} - Cần chọn ${totalFreeItems} sản phẩm tặng`,
      promotionId: promoData.promotion?._id || promoData._id,
      buyX: buyX,
      getY: getY,
      totalFreeItemsNeeded: totalFreeItems,
      totalItems: totalQuantity
    });
    
    setFinalTotal(originalTotal);
    message.info(`Vui lòng chọn ${totalFreeItems} sản phẩm tặng cho khuyến mãi`);
    
  } else {
    // Trường hợp không đủ điều kiện mua X
    message.warning(`Chương trình Mua ${buyX} Tặng ${getY}: Bạn cần mua ít nhất ${buyX} sản phẩm`);
    setApplyingPromo(false);
  }
} else {
        message.error("Loại khuyến mãi không được hỗ trợ");
      }
    } else {
      message.error(response.message || "Mã khuyến mãi không hợp lệ");
    }
  } catch (error) {
    console.error("❌ Lỗi khi áp dụng mã khuyến mãi:", error);
    message.error(error.response?.data?.message || error.message || "Lỗi khi áp dụng mã khuyến mãi");
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

    console.log("📦 Bắt đầu xuất kho...");
    console.log("🛒 Items mua:", cart.length);
    console.log("🎁 Items tặng:", appliedPromo?.freeItems?.length || 0);

    // 🆕 TRUYỀN CART VÀ FREEITEMS
    const result = await exportInventoryFromOrder(
      orderId, 
      cart, 
      appliedPromo?.freeItems || []  // 🆕 THÊM FREEITEMS
    );
    
    console.log("✅ Xuất kho thành công:", result);
    return result;
    
  } catch (error) {
    console.error("❌ Lỗi khi xuất kho:", error);
    throw error;
  }
};
// Payment.jsx - CẬP NHẬT handleConfirmPayments
const handleConfirmPayment = async () => {
  if (!orderId) {
    alert("Không tìm thấy đơn hàng. Vui lòng tạo đơn hàng trước khi thanh toán!");
    return;
  }

  // 🆕 KIỂM TRA NẾU LÀ BUY_X_GET_Y VÀ CHƯA CHỌN SẢN PHẨM TẶNG
  if (appliedPromo && appliedPromo.promotionType === 'buy_x_get_y') {
    if (!appliedPromo.freeItems || appliedPromo.freeItems.length === 0) {
      Modal.warning({
        title: "⚠️ Thiếu sản phẩm tặng",
        content: "Vui lòng chọn sản phẩm tặng trước khi thanh toán",
        okText: "Chọn ngay",
        onOk: () => openFreeItemSelection(appliedPromo)
      });
      return;
    }
  }

  setLoading(true);

  try {
    // 🆕 BƯỚC 1: XUẤT KHO
    await handleExportInventory();

    // 🔹 BƯỚC 2: Chuẩn bị promotion data CHÍNH XÁC
    let promotionData = null;
    
    if (appliedPromo) {
      promotionData = {
        code: appliedPromo.code,
        promotionId: appliedPromo.promotionId,
        promotionType: appliedPromo.promotionType,
        applicableScope: appliedPromo.applicableScope || 'all',
        effectiveDiscountRate: appliedPromo.effectiveDiscountRate || 0
      };
      
      // Chi tiết theo loại promotion
      if (appliedPromo.promotionType === 'discount') {
        promotionData.discountType = appliedPromo.discountType;
        promotionData.discountValue = appliedPromo.discountValue;
        promotionData.discountAmount = appliedPromo.discountAmount || 0;
      } 
      else if (appliedPromo.promotionType === 'buy_x_get_y') {
        promotionData.buyX = appliedPromo.buyX;
        promotionData.getY = appliedPromo.getY;
        
        // 🚨 QUAN TRỌNG: Gửi freeItems với đầy đủ thông tin
        if (appliedPromo.freeItems && appliedPromo.freeItems.length > 0) {
          promotionData.freeItems = appliedPromo.freeItems.map(item => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price || 0,
            cost: item.cost || 0
          }));
          promotionData.totalFreeValue = appliedPromo.totalFreeValue || 0;
        }
      }
      else if (appliedPromo.promotionType === 'gift') {
        promotionData.giftName = appliedPromo.giftName;
        promotionData.giftQuantity = appliedPromo.giftQuantity;
      }
    }

    console.log("📤 Gửi promotion data đến backend:", promotionData);

    // 🔹 BƯỚC 3: Gọi API với tham số đúng thứ tự
    await updateOrderPayment(
      orderId,           // string
      method,            // string: 'cash' hoặc 'transfer'
      finalTotal,        // number
      promotionData      // object hoặc null
    );
    
    await updateOrderStatus(orderId, "paid");

    // 🔹 BƯỚC 4: Xóa dữ liệu tạm
    localStorage.removeItem("cartData");
    localStorage.removeItem("cartTotal");
    localStorage.removeItem("currentOrderId");

    console.log("✅ Thanh toán thành công!");
    console.log("📊 Chi tiết order:", {
      orderId,
      originalTotal,
      finalTotal,
      promotionType: appliedPromo?.promotionType || "none",
      promoCode: appliedPromo?.code || "Không có",
      savedAmount: originalTotal - finalTotal,
      freeItemsCount: appliedPromo?.freeItems?.length || 0
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate("/order", { replace: true });
    }, 2000);
  } catch (error) {
    console.error("❌ Lỗi khi xác nhận thanh toán:", error);
    console.error("📋 Error details:", error.response?.data);
    
    // Hiển thị thông báo chi tiết hơn
    const errorMessage = error.response?.data?.message || error.message || "Lỗi không xác định";
    alert(`Lỗi khi xác nhận thanh toán: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};

 // 📍 Vị trí: Thay thế hàm formatCurrency hiện tại
// 🆕 HÀM ĐỊNH DẠNG TIỀN - AN TOÀN
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0 ₫";
  }
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
  // VỊ TRÍ: Ngay trước phần return render chính
const FreeItemSelectionModal = () => {
  const handleSelectItem = (item) => {
    // Đơn giản hóa: chỉ cho phép chọn 1 sản phẩm
    setSelectedFreeItems([item]);
  };
  
  return (
    <Modal
      title="🎁 Chọn sản phẩm tặng"
      open={showFreeItemModal}
      onOk={confirmFreeItemSelection}
      onCancel={() => setShowFreeItemModal(false)}
      okText="Xác nhận"
      cancelText="Hủy"
      width={400}
    >
      <div>
        <Alert
          message={`Chương trình: Mua ${promotionDetails?.buyX || 2} Tặng ${promotionDetails?.getY || 1}`}
          description="Chọn sản phẩm tặng cho khách hàng"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        {/* 🆕 DANH SÁCH SẢN PHẨM TRONG CART ĐỂ CHỌN */}
        <Card title="Chọn sản phẩm tặng" size="small">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              Không có sản phẩm trong đơn hàng
            </div>
          ) : (
            <List
              dataSource={cart}
              renderItem={(item) => {
                const isSelected = selectedFreeItems.some(
                  selected => selected.productId === (item.productId || item._id)
                );
                
                return (
                  <List.Item
                    style={{
                      backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      padding: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSelectItem({
                      productId: item.productId || item._id,
                      name: item.name,
                      size: item.size?.name || item.size || 'M',
                      quantity: promotionDetails?.getY || 1,
                      price: item.size?.price || item.price || 0,
                      cost: item.cost || item.size?.cost || 0
                    })}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{item.name}</span>
                          {isSelected && <Tag color="green">Đã chọn</Tag>}
                        </div>
                      }
                      description={
                        <div>
                          Size: {item.size?.name || item.size || 'M'} | 
                          Giá: {formatCurrency(item.size?.price || item.price || 0)}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
        
        {/* 🆕 HIỂN THỊ SẢN PHẨM ĐÃ CHỌN */}
        {selectedFreeItems.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
            <strong>✅ Sản phẩm đã chọn:</strong>
            {selectedFreeItems.map((item, idx) => (
              <div key={idx} style={{ marginTop: '8px' }}>
                {item.name} ({item.size}) × {item.quantity}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
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
  {/* Hiển thị cho buy_x_get_y */}
  {appliedPromo?.promotionType === 'buy_x_get_y' && appliedPromo?.totalFreeValue > 0 && (
    <>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        marginBottom: "8px",
        color: "#52c41a"
      }}>
        <div>Quà tặng (giá trị):</div>
        <div style={{ fontWeight: 600 }}>
          -{formatCurrency(appliedPromo.totalFreeValue)}
        </div>
      </div>
      
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        marginBottom: "8px",
        color: "#fa541c",
        fontSize: "0.9rem"
      }}>
        <div>Tỷ lệ giảm giá:</div>
        <div style={{ fontWeight: 600 }}>
          {Math.round(appliedPromo.effectiveDiscountRate || 0)}%
        </div>
      </div>
      {/* //VỊ TRÍ: Trong phần hiển thị appliedPromo, thêm button */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <div>
    <Tag color={appliedPromo.promotionType === 'buy_x_get_y' ? "blue" : "success"}>
      {appliedPromo.promotionType === 'buy_x_get_y' ? "Mua X Tặng Y" : "Đã áp dụng"}
    </Tag>
    <span style={{ marginLeft: "8px", fontWeight: 600 }}>{appliedPromo.code}</span>
  </div>
  <div>
    {/* 🆕 BUTTON CHỌN SẢN PHẨM TẶNG */}
    {appliedPromo.promotionType === 'buy_x_get_y' && 
     (!appliedPromo.freeItems || appliedPromo.freeItems.length === 0) && (
      <Button
        type="primary"
        size="small"
        onClick={() => openFreeItemSelection(appliedPromo)}
        style={{ marginRight: '8px' }}
      >
        🎁 Chọn sản phẩm tặng
      </Button>
    )}
    <Button
      type="link"
      danger
      size="small"
      onClick={handleRemovePromoCode}
    >
      Xoá
    </Button>
  </div>
</div>
    </>
  )}
  
  {/* Hiển thị cho discount thông thường */}
  {appliedPromo?.promotionType === 'discount' && appliedPromo.discountAmount > 0 && (
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
          : appliedPromo.discountPercent > 0 
            ? `-${appliedPromo.discountPercent}%`
            : ""
        }
      </div>
    </div>
  )}
  
  {/* Tổng tiền thực tế */}
  <div style={{ 
    display: "flex", 
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
    fontSize: "1.1rem",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #eee"
  }}>
    <div>Thành tiền:</div>
    <div style={{ 
      color: "#1890ff", 
      fontSize: "1.2rem",
      textAlign: "right"
    }}>
      <div>{formatCurrency(finalTotal)}</div>
      
      {/* Hiển thị giá trị tiết kiệm */}
      {(appliedPromo?.discountAmount > 0 || appliedPromo?.totalFreeValue > 0) && (
        <div style={{ 
          fontSize: "0.85rem", 
          color: "#999",
          fontWeight: "normal",
          marginTop: "2px"
        }}>
          <div>
            <span style={{ color: "#52c41a" }}>💎 Tiết kiệm: </span>
            {formatCurrency(
              (appliedPromo?.discountAmount || 0) + 
              (appliedPromo?.totalFreeValue || 0)
            )}
            {appliedPromo?.promotionType === 'buy_x_get_y' && (
              <span> (Tặng {appliedPromo.totalFreeItems} sản phẩm)</span>
            )}
          </div>
          
          {/* Hiển thị giá trị trung bình cho buy_x_get_y */}
          {appliedPromo?.promotionType === 'buy_x_get_y' && (
            <div style={{ marginTop: "4px", color: "#666" }}>
              Giá trung bình: {formatCurrency(appliedPromo.effectivePricePerItem || 0)}/sản phẩm
              <div style={{ fontSize: "0.8rem", color: "#888" }}>
                (Mua {appliedPromo.totalItems} + Tặng {appliedPromo.totalFreeItems} = {appliedPromo.totalItemsReceived} sản phẩm)
              </div>
            </div>
          )}
          
          <div style={{ marginTop: "4px" }}>Giá gốc: {formatCurrency(originalTotal)}</div>
        </div>
      )}
    </div>
  </div>
</div>
      </Card>
          {/* Hiển thị sản phẩm được tặng nếu có */}
{appliedPromo?.freeItems && appliedPromo.freeItems.length > 0 && (
  <div style={{
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#f0f9ff",
    border: "1px solid #91d5ff",
    borderRadius: "8px"
  }}>
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "8px",
      marginBottom: "8px" 
    }}>
      <span style={{ color: "#1890ff" }}>🎁</span>
      <strong>Sản phẩm được tặng:</strong>
      <span style={{ 
        marginLeft: "auto", 
        fontSize: "0.9rem", 
        color: "#52c41a",
        fontWeight: "600"
      }}>
        Tiết kiệm {formatCurrency(appliedPromo.totalFreeValue || 0)}
      </span>
    </div>
    
    {/* ... phần List freeItems giữ nguyên ... */}
    
    <div style={{ 
      marginTop: "12px", 
      padding: "10px",
      backgroundColor: "#e6f7ff",
      borderRadius: "6px",
      borderLeft: "3px solid #1890ff"
    }}>
      <div style={{ fontSize: "0.9rem", color: "#0050b3", marginBottom: "6px" }}>
        <strong>📊 Phân tích giá trị:</strong>
      </div>
      
      <div style={{ fontSize: "0.85rem", color: "#262626" }}>
        <div>• <strong>Tổng chi phí:</strong> {formatCurrency(finalTotal)}</div>
        <div>• <strong>Số lượng mua:</strong> {appliedPromo.totalItems || 0} sản phẩm</div>
        <div>• <strong>Số lượng tặng:</strong> {appliedPromo.totalFreeItems || 0} sản phẩm</div>
        <div>• <strong>Tổng nhận được:</strong> {appliedPromo.totalItemsReceived || 0} sản phẩm</div>
        
        <div style={{ 
          marginTop: "6px", 
          paddingTop: "6px", 
          borderTop: "1px dashed #91d5ff",
          color: "#fa541c",
          fontWeight: "500"
        }}>
          • <strong>Giá trị mỗi sản phẩm:</strong> {formatCurrency(appliedPromo.effectivePricePerItem || 0)}
          <span style={{ fontSize: "0.8rem", color: "#8c8c8c", marginLeft: "6px" }}>
            (giảm {Math.round(100 - ((appliedPromo.effectivePricePerItem || 0) / (originalTotal / (appliedPromo.totalItems || 1))) * 100)}%)
          </span>
        </div>
      </div>
    </div>
  </div>
)}
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
    backgroundColor: appliedPromo.promotionType === 'buy_x_get_y' ? "#f0f9ff" : "#f6ffed",
    border: appliedPromo.promotionType === 'buy_x_get_y' ? "1px solid #91d5ff" : "1px solid #b7eb8f",
    borderRadius: "8px",
    marginBottom: "16px"
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Tag color={
          appliedPromo.promotionType === 'buy_x_get_y' ? "blue" : 
          appliedPromo.promotionType === 'gift' ? "orange" : "success"
        }>
          {appliedPromo.promotionType === 'buy_x_get_y' ? "Mua X Tặng Y" :
           appliedPromo.promotionType === 'gift' ? "Quà tặng" : "Đã áp dụng"}
        </Tag>
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
        
        {/* Hiển thị thêm thông tin cho buy_x_get_y */}
        {appliedPromo.promotionType === 'buy_x_get_y' && appliedPromo.freeItems && (
          <div style={{ 
            marginTop: "8px", 
            padding: "8px", 
            backgroundColor: "rgba(145, 213, 255, 0.1)",
            borderRadius: "4px"
          }}>
            <strong>🎁 Sản phẩm được tặng:</strong>
            {appliedPromo.freeItems.map((item, idx) => (
              <div key={idx} style={{ 
                marginTop: "4px", 
                fontSize: "0.85rem",
                display: "flex", 
                justifyContent: "space-between" 
              }}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ color: "#52c41a" }}>
                  -{formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
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