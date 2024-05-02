import { useState } from "react"
import { Modal, Form, Input, Button } from "antd"
import { type } from "@tauri-apps/api/os";
export default function LoginModal({ visible, onLoginSubmit, onCancel }) {
  const [form] = Form.useForm();

  const handleCancelSubmit = () => {
    form.resetFields();
   
    onCancel();
  }


  return (
    <Modal onCancel={handleCancelSubmit} title="Necessário senha para acessar configurações" open={visible} className="p-1" footer={<></>}>

      
      <Form form={form} layout="vertical" className="m-10" onFinish={(formValues)=>{onLoginSubmit(formValues); form.resetFields();}}>
        

        <Form.Item
          name="senha"
          label="Senha"
          id="password-modal"
        >

          <Input type="password"  />
        </Form.Item>
        <Form.Item>
          <Button type="primary" className="bg-blue-500 w-full" htmlType="submit">Submeter</Button>
          <Button type="default" className="bg-red-500 w-full text-white mt-1" onClick={handleCancelSubmit}>Cancelar</Button>
        </Form.Item>
      </Form>
    </Modal>

  )

}