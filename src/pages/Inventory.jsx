import React, { useEffect, useState, useMemo  } from "react";
import {
  Table,
  Button,
  Modal,
  InputNumber,
  Input,
  message,
  AutoComplete,
  Form,
  DatePicker,
  Tabs,
  Select,
  Tooltip
} from "antd";
import { fetchInventory, importInventory, fetchImportHistory } from "../services/api";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const Inventory = () => {
  const [unitOptions, setUnitOptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [form] = Form.useForm();
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [searchText, setSearchText] = useState(""); // cho thanh tìm kiếm lịch sử

const calculateTotalWeight = (item) => {
  if (!item) return 0;
  const { stock = 0, unitWeight = 0, unitType, unit } = item;

  if (unitType === "g" || unitType === "kg") {
    if (unit === "g") return stock * (unitWeight || 1); // g giữ nguyên
    if (unit === "kg") return (stock * (unitWeight || 1)) / 1000; // kg
  }

  if (unitType === "ml" || unitType === "lít") {
    if (unit === "ml") return stock * (unitWeight || 1); // ml giữ nguyên
    if (unit === "lít") return (stock * (unitWeight || 1)) / 1000; // lít
  }

  return stock * (unitWeight || 1); // đếm
};



  const mapping = {
  milk: {
    units: ["ml", "lít"],
    defaultWeightUnit: 1000, // mặc định 1 đơn vị = 1000ml
  },
  powder: {
    units: ["g", "kg"],
    defaultWeightUnit: 1000, // 1 đơn vị = 1000g
  },
  syrup: {
    units: ["ml", "lít"],
    defaultWeightUnit: 1000,
  },
  water: {
    units: ["ml", "lít"],
    defaultWeightUnit: 1000,
  },
  topping: {
    units: ["g", "kg"],
    defaultWeightUnit: 100,
  },
  cup: {
    units: ["cái"],
    defaultWeightUnit: 1,
  },
  lid: {
    units: ["cái"],
    defaultWeightUnit: 1,
  },
  straw: {
    units: ["cái"],
    defaultWeightUnit: 1,
  },
  bag: {
    units: ["cái"],
    defaultWeightUnit: 1,
  },
  ice: { units: ["g", "kg"], defaultWeightUnit: 1000 },
};
  
  // Load dữ liệu kho
  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetchInventory();
      setInventory(res || []);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải dữ liệu kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Load lịch sử nhập kho
  const loadHistory = async (start, end) => {
    try {
      let query = "";
      if (start && end) query = `?start=${start}&end=${end}`;
      const res = await fetchImportHistory(query);
      setHistory(res || []);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải lịch sử nhập kho");
    }
  };

  const handleDateChange = (dates) => {
    if (!dates) {
      setHistory([]);
      setDateRange([]);
      return;
    }
    const [start, end] = dates;
    setDateRange([start, end]);
    loadHistory(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  };

  // Tính cost tự động dựa trên số lượng nhập và trọng lượng
  const handleCalcCost = (changedValues, allValues) => {
    const { stock = 0, unitWeight = 0, cost_per_unit = 0, unitType } = allValues;
    let cost = 0;
    if (unitType === "ml" || unitType === "lít") {
      // chuyển ml -> lít
      const quantityInLiters = unitWeight ? stock * unitWeight / 1000 : stock / 1000;
      cost = quantityInLiters * cost_per_unit;
    } else if (unitType === "g" || unitType === "kg") {
      const quantityInKg = unitWeight ? stock * unitWeight : stock / 1000;
      cost = quantityInKg * cost_per_unit;
    } else {
      cost = stock * cost_per_unit;
    }
    setCalculatedCost(cost);
  };

  const handleAddStock = async () => {
    try {
      const values = await form.validateFields();
      await importInventory({
        items: [
          {
            name: values.name,
            quantity: values.stock,
            unitCost: values.cost_per_unit,
            unitWeight: values.unitWeight,
            note: values.note,
            unit: values.unit,
            unitType: values.unitType,
          },
        ],
      });
      message.success("Nhập kho thành công");
      setModalOpen(false);
      form.resetFields();
      setCalculatedCost(0);
      loadInventory();
      if (dateRange.length === 2) {
        loadHistory(dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD"));
      }
    } catch (err) {
      console.error(err);
      if (err.errorFields) return;
      message.error("Lỗi khi nhập kho");
    }
  };

  const inventoryColumns = [
    { title: "Nguyên liệu", dataIndex: "name" },
    { title: "Tồn kho", dataIndex: "stock" },
    { title: "Đơn vị", dataIndex: "unit" },
    // Trọng lượng/1 đơn vị
{ 
  title: "Trọng lượng/1 đơn vị", 
  dataIndex: "unitWeight", 
  render: (text, record) => text ? text + " " + (record.unit || "") : "" 
},
  {
  title: "Tổng trọng lượng",
  render: (_, record) => {
    const total = calculateTotalWeight(record);
    // Nếu là số nguyên thì không hiển thị .00
    const display = Number.isInteger(total) ? total : total.toFixed(2);
    return display + " " + (record.unit || "");
  },
},

    { title: "Giá vốn/đơn vị", dataIndex: "cost_per_unit", render: (text) => text?.toLocaleString() + "đ" },
    { title: "Ghi chú", dataIndex: "note" },
  ];

  const historyColumns = [
  {
    title: "Ngày nhập",
    dataIndex: "date",
    render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm")
  },
  { title: "Tên NVL", dataIndex: "name" },
  { title: "Số lượng", dataIndex: "quantity" },
  { title: "Đơn vị", dataIndex: "unit" },
  { 
    title: "Giá vốn",
    dataIndex: "unitCost",
    render: (text, record) => (
      <Tooltip title={`Trọng lượng/1 đơn vị: ${record.unitWeight ?? "-"}\nGhi chú: ${record.note ?? "-"}`}>
        {text?.toLocaleString() + "đ"}
      </Tooltip>
    )
  },
];
  const handleCalcCostAndWeight = (changedValues, allValues) => {
  handleCalcCost(changedValues, allValues);
  const totalWeight = calculateTotalWeight(allValues);
  setCalculatedWeight(totalWeight); // nếu muốn hiển thị
};
  const flattenHistory = history.flatMap((inv) =>
  inv.items.map((i) => {
    // Tìm item tương ứng trong inventory để lấy unit nếu API thiếu
    const invItem = inventory.find((item) => item.name === i.name);
    
    return {
      key: i.ingredientId + "-" + inv.invoiceId,
      date: inv.date,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit || i.unitType || invItem?.unit || invItem?.unitType || "-", // fallback
      unitCost: i.unitCost,
      unitWeight: i.unitWeight,
      note: i.note,
    };
  })
);
const filteredHistory = useMemo(() => {
  return flattenHistory.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );
}, [searchText, flattenHistory]);


  return (
    <div style={{ padding: "1rem", marginBottom: "70px" }}>
      <h2>📦 Quản lý kho</h2>

      <Tabs defaultActiveKey="1" destroyInactiveTabPane={false}>
        <TabPane tab="Danh sách kho" key="1">
          <Table
  dataSource={inventory.map((item) => ({ ...item, key: item._id }))}
  columns={inventoryColumns.map(col => {
    if (col.dataIndex === "stock") {
      return {
        ...col,
        sorter: (a, b) => a.stock - b.stock, // sort tăng dần (còn ít trước)
        defaultSortOrder: "ascend", // mặc định sort theo số lượng
      };
    }
    return col;
  })}
  pagination={false}
  size="small"
  loading={loading}
  style={{ marginTop: "1rem" }}
/>

          <Button
            type="primary"
            block
            style={{ marginTop: "1rem" }}
            onClick={() => setModalOpen(true)}
          >
            Nhập thêm hàng
          </Button>
        </TabPane>

        <TabPane tab="Lịch sử nhập kho" key="2">
  <RangePicker
    style={{ marginBottom: 12, marginRight: 12 }}
    onChange={handleDateChange}
    format="YYYY-MM-DD"
  />
  <Input
    placeholder="Tìm theo tên sản phẩm"
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    style={{ marginBottom: 12, width: 300 }}
  />
  <Table
    dataSource={filteredHistory} // dùng biến đã lọc
    columns={historyColumns}
    size="small"
    pagination={{ pageSize: 5 }}
  />
</TabPane>
      </Tabs>

<Modal
  title="Nhập nguyên liệu mới / bổ sung"
  open={modalOpen}
  onCancel={() => setModalOpen(false)}
  onOk={handleAddStock}
>
  <Form form={form} layout="vertical" onValuesChange={handleCalcCost}>
    {/* Tên nguyên liệu */} 
    <Form.Item
      label="Tên nguyên liệu"
      name="name"
      rules={[{ required: true, message: "Vui lòng nhập tên nguyên liệu" }]}
    >
      <AutoComplete
        placeholder="Nhập tên nguyên liệu"
        options={inventory.map((i) => ({ value: i.name }))}
        onSelect={(value) => {
  const selected = inventory.find((i) => i.name === value);
  if (selected) {
    const mapped = mapping[selected.unitType] || { defaultWeightUnit: 1, units: [selected.unit || ""] };
    form.setFieldsValue({
      unitType: selected.unitType || "milk",
      unit: selected.unit || mapped.units[0],
      cost_per_unit: selected.cost_per_unit,
      unitWeight: selected.unitWeight || mapped.defaultWeightUnit,
      note: selected.note,
    });
    handleCalcCost({}, form.getFieldsValue());
  }
}}

      />
    </Form.Item>

    {/* Loại nguyên liệu */}
    <Form.Item
      label="Loại nguyên liệu / vật tư"
      name="unitType"
      rules={[{ required: true }]}
    >
      <Select
  placeholder="Chọn loại nguyên liệu / vật tư"
  // Thay thế toàn bộ onChange của Select unitType bằng:
onChange={(value) => {
  const selected = mapping[value];
  if (selected) {
    setUnitOptions(selected.units);

    // Set unit mặc định nếu unit hiện tại không hợp lệ
    const currentUnit = form.getFieldValue("unit");
    if (!selected.units.includes(currentUnit)) {
      form.setFieldsValue({ unit: selected.units[0] });
    }

    // Luôn set unitWeight theo mapping nếu chưa hợp lệ
    const currentWeight = form.getFieldValue("unitWeight");
    form.setFieldsValue({ unitWeight: currentWeight || selected.defaultWeightUnit });
  } else {
    setUnitOptions([]);
    form.setFieldsValue({ unit: undefined, unitWeight: 0 });
  }
}}
>
        {/* Nguyên liệu pha chế */}
        <Option value="milk">Sữa / Sữa đặc</Option>
        <Option value="powder">Bột (Matcha-Cacao-Houjicha)</Option>
        <Option value="syrup">Syrup</Option>
        <Option value="water">Trà / Cà phê</Option>
        <Option value="topping">Topping</Option>
        <Option value="ice">Đá</Option>
        {/* Bao bì / vật tư */}
        <Option value="cup">Ly nhựa</Option>
        <Option value="lid">Nắp ly</Option>
        <Option value="straw">Ống hút</Option>
        <Option value="bag">Túi / Bọc sản phẩm</Option>
      </Select>
    </Form.Item>

    {/* Đơn vị tự động */}
    <Form.Item
      label="Đơn vị"
      name="unit"
      rules={[{ required: true, message: "Chọn đơn vị đo phù hợp" }]}
    >
      <Select placeholder="Chọn đơn vị đo">
        {unitOptions.map((u) => (
          <Option key={u} value={u}>
            {u}
          </Option>
        ))}
      </Select>
    </Form.Item>

    {/* Số lượng */}
    <Form.Item
      label="Số lượng"
      name="stock"
      rules={[{ required: true, message: "Nhập số lượng" }]}
    >
      <InputNumber min={0} style={{ width: "100%" }} placeholder="Ví dụ: 20 hộp / 50 cái" />
    </Form.Item>

    {/* Trọng lượng / 1 đơn vị */}
    <Form.Item label="Trọng lượng/1 đơn vị" name="unitWeight">
      <InputNumber
        min={0}
        style={{ width: "100%" }}
        placeholder="Ví dụ: 500ml / 0.5kg"
      />
    </Form.Item>

    {/* Giá vốn / đơn vị */}
    <Form.Item
      label="Giá vốn/đơn vị"
      name="cost_per_unit"
      rules={[{ required: true, message: "Nhập giá vốn" }]}
    >
      <InputNumber min={0} style={{ width: "100%" }} placeholder="Ví dụ: 40000" />
    </Form.Item>

    {/* Tổng cost nhập */}
    <Form.Item label="Tổng cost nhập">
      <Input value={calculatedCost.toLocaleString() + " đ"} disabled />
    </Form.Item>

    {/* Ghi chú */}
    <Form.Item label="Ghi chú" name="note">
      <Input placeholder="Ví dụ: 1 hộp = 1000ml" />
    </Form.Item>
  </Form>
</Modal>

    </div>
  );
};

export default Inventory;
