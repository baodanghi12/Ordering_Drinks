import React from "react";
import { Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const ImageUpload = ({ value, onChange }) => (
  <Upload
    name="image"
    maxCount={1}
    customRequest={async ({ file, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await axios.post(
          "http://localhost:5000/api/upload",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        onChange(res.data.imageUrl);
        onSuccess("ok");
      } catch (err) {
        onError(err);
      }
    }}
  >
    <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
  </Upload>
);

export default ImageUpload;
