import { ArrowLeftOutlined, FolderOpenFilled} from "@ant-design/icons";
import { dialog, invoke } from "@tauri-apps/api";
import { FloatButton, Space, Input, Button, Form, Tooltip, Table, Divider } from "antd";
import { appDataDir, appLocalDataDir } from "@tauri-apps/api/path";

import { useEffect, useState } from "react";


export default function ConfigForm({ setShowConfig, config, onSubmit }) {
    const form = Form.useForm()[0];
    const [folder, setFolder] = useState(config.BASE_FOLDER||"");
    const [configData, setConfigData] = useState(Object.keys(config).length == 0 ? {

        BASE_FOLDER: "",
        DEAD_LINE: {
            projeto: 1,
            digitacao: 1,
            revisao: 1,
            conferencia: 1,
            negociacao: 1,
            financiamento: 1
        }
    }:config);
    

    useEffect(() => {

        console.log(config == {})
        console.log(configData);
     

        form.setFieldsValue({
            BASE_FOLDER: folder,
            DEADLINE_PROJETO: configData.DEAD_LINE.projeto,
            DEADLINE_DIGITACAO: configData.DEAD_LINE.digitacao, 
            DEADLINE_REVISAO: configData.DEAD_LINE.revisao,
            DEADLINE_CONFERENCIA: configData.DEAD_LINE.conferencia,
            DEADLINE_NEGOCIACAO: configData.DEAD_LINE.negociacao,
            DEADLINE_FINANCIAMENTO: configData.DEAD_LINE.financiamento,
        });
        
    }, []); 



    const onFolderButtonClick = async () => {
        const result = await dialog.open({ directory: true });
        if (result) {
            setFolder(result);
            form.setFieldsValue({ BASE_FOLDER: result });
        }
    };

   
    return (
        <div>
            <div className="bg-blue-500 text-white text-center py-2 text-2xl">
                Configurações
            </div>

            <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={config} className="pt-20">
                <Form.Item label="Pasta Base" name="BASE_FOLDER" rules={[{ required: true, message: "Pasta Base é obrigatória" }]}>
                    <Space.Compact className="w-full">
                        <Input disabled  value={folder} />

                        <Button
                            type="primary"
                            className="text-black bg-white hover:bg-black hover:text-white"
                            onClick={onFolderButtonClick}
                        >{(<FolderOpenFilled />)}</Button>
                    </Space.Compact>
                </Form.Item>
                <Divider orientation="left">
                    Dead Lines
                </Divider>
                <Form.Item label="PROJETO" name="DEADLINE_PROJETO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1"  />
                </Form.Item>
                <Form.Item label="DIGITAÇÃO" name="DEADLINE_DIGITACAO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1"  />
                </Form.Item>
                <Form.Item label="REVISÃO" name="DEADLINE_REVISAO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1"  />
                </Form.Item>
                <Form.Item label="CONFERÊNCIA" name="DEADLINE_CONFERENCIA" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1"  />
                </Form.Item>
                <Form.Item label="NEGOCIAÇÃO" name="DEADLINE_NEGOCIACAO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1"  />
                </Form.Item>
                <Form.Item label="FINANCIAMENTO" name="DEADLINE_FINANCIAMENTO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1" />
                </Form.Item>

                <Divider orientation="vertical"/>

                <Button type="primary" className="bg-blue-500 text-white w-full" htmlType="submit">Salvar</Button>

            </Form>

            <FloatButton
                icon={<ArrowLeftOutlined />}
                style={{ top: 85 }}
                onClick={() => setShowConfig(false)}
            />

        </div>

    )
}