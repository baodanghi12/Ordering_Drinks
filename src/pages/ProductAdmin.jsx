import React, { useEffect, useState } from "react";
import { Input, Button, Select, InputNumber, message, Card } from "antd";
import { fetchInventory, createProduct } from "../services/api";

const { Option } = Select;

const ProductAdmin = () => {
  const [inventory, setInventory] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");
  const [recipe, setRecipe] = useState([]); // [{ingredientId, qty}]

  useEffect(() => {
    loadInv();
  }, []);

  const loadInv = async () => {
    const data = await fetchInventory();
    setInventory(data || []);
  };

  const addRecipeRow = () => setRecipe(prev => [...prev, { ingredientId: "", qty: 0 }]);
  const updateRow = (idx, key, val) => {
    const c = [...recipe];
    c[idx][key] = val;
    setRecipe(c);
  };
  const removeRow = (idx) => setRecipe(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name || !price) return message.warning("Nhập tên và giá");
    // build payload -> recipe items must have ingredientId
    const payload = {
      name,
      category,
      price: Number(price),
      image,
      recipe: recipe.filter(r => r.ingredientId).map(r => ({ ingredientId: r.ingredientId, qty: Number(r.qty) }))
    };
    try {
      await createProduct(payload);
      message.success("Tạo sản phẩm thành công");
      // clear fields
      setName(""); setCategory(""); setPrice(0); setImage(""); setRecipe([]);
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Thêm sản phẩm mới</h3>
      <Input placeholder="Tên món" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 8 }} />
      <Input placeholder="Danh mục" value={category} onChange={e => setCategory(e.target.value)} style={{ marginBottom: 8 }} />
      <Input placeholder="Link ảnh" value={image} onChange={e => setImage(e.target.value)} style={{ marginBottom: 8 }} />
      <InputNumber placeholder="Giá" value={price} onChange={v => setPrice(v)} style={{ width: "100%", marginBottom: 8 }} />
      <Card title="Công thức (Recipe)">
        {recipe.map((r, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Select style={{ flex: 2 }} value={r.ingredientId} onChange={v => updateRow(idx, "ingredientId", v)}>
              {inventory.map(inv => <Option key={inv._id} value={inv._id}>{inv.name} ({inv.unit})</Option>)}
            </Select>
            <InputNumber style={{ flex: 1 }} value={r.qty} onChange={v => updateRow(idx, "qty", v)} />
            <Button danger onClick={() => removeRow(idx)}>X</Button>
          </div>
        ))}
        <Button type="dashed" onClick={addRecipeRow}>+ Thêm nguyên liệu</Button>
      </Card>

      <Button type="primary" onClick={handleSave} style={{ marginTop: 12 }}>Lưu sản phẩm</Button>
    </div>
  );
};

export default ProductAdmin;
