import { ArrowLeftOutlined, FolderOpenFilled } from "@ant-design/icons";
import { app, dialog, invoke } from "@tauri-apps/api";
import { FloatButton, Space, Input, Button, Form, Tooltip, Table, Divider } from "antd";
import {appLocalDataDir } from "@tauri-apps/api/path";
import {fs} from "@tauri-apps/api";
import { useEffect, useState } from "react";


export default function ConfigForm({ setShowConfig, config, onSubmit }) {
    const form = Form.useForm()[0];
    const [folder, setFolder] = useState(config.BASE_FOLDER || "");

    const setConfig = ()=>{
        invoke("get_dead_line", { path: folder }).then((data) => {
            if (data != "401") {

                const datajson = JSON.parse(data);
                form.setFieldsValue({ DEADLINE_PROJETO: datajson.projeto });
                form.setFieldsValue({ DEADLINE_DIGITACAO: datajson.digitacao });
                form.setFieldsValue({ DEADLINE_REVISAO: datajson.revisao });
                form.setFieldsValue({ DEADLINE_CONFERENCIA: datajson.conferencia });
                form.setFieldsValue({ DEADLINE_NEGOCIACAO: datajson.negociacao });
                form.setFieldsValue({ DEADLINE_FINANCIAMENTO: datajson.financiamento });
                appLocalDataDir().then((dir) => {
                    fs.writeTextFile(`${dir}/config.json`, JSON.stringify({ 
                        BASE_FOLDER: folder,
                        DEAD_LINE:{
                            projeto: datajson.projeto,
                            digitacao: datajson.digitacao,
                            revisao: datajson.revisao,
                            conferencia: datajson.conferencia,
                            negociacao: datajson.negociacao,
                            financiamento: datajson.financiamento

                        }})).then(() => {
                        console.log("Configuração salva com sucesso")
                    }).catch((err) => {
                        console.error(err);
                    })


                })
            }
        });



    }






    useEffect(() => {
        setConfig();
        
        
    }, []);



    const onFolderButtonClick = async () => {
        const result = await dialog.open({ directory: true });
        if (result) {
            setFolder(result);
            form.setFieldsValue({ BASE_FOLDER: result });
        }
    };
    const onHandleSubmit = () => {

        const config = {
            BASE_FOLDER: form.BASE_FOLDER,
            DEAD_LINE: {
                projeto: form.getFieldValue("DEADLINE_PROJETO"),
                digitacao: form.getFieldValue("DEADLINE_DIGITACAO"),
                revisao: form.getFieldValue("DEADLINE_REVISAO"),
                conferencia: form.getFieldValue("DEADLINE_CONFERENCIA"),
                negociacao: form.getFieldValue("DEADLINE_NEGOCIACAO"),
                financiamento: form.getFieldValue("DEADLINE_FINANCIAMENTO"),
            }
        }
        invoke("set_dead_line", { path: folder, deadLine: JSON.stringify(config.DEAD_LINE) }).then((data) => {
            console.log(data);
        });
        onSubmit();



    }

    return (
        <div>
            <div className="bg-blue-500 text-white text-center py-2 text-2xl">
                Configurações
            </div>

            <Form form={form} layout="vertical" onFinish={onHandleSubmit} initialValues={config} className="pt-20">
                <Form.Item label="Pasta Base" name="BASE_FOLDER" rules={[{ required: true, message: "Pasta Base é obrigatória" }]}>
                    <Space.Compact className="w-full">
                        <Input disabled value={folder} />

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
                    <Input type="number" min="1" />
                </Form.Item>
                <Form.Item label="DIGITAÇÃO" name="DEADLINE_DIGITACAO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1" />
                </Form.Item>
                <Form.Item label="REVISÃO" name="DEADLINE_REVISAO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1" />
                </Form.Item>
                <Form.Item label="CONFERÊNCIA" name="DEADLINE_CONFERENCIA" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1" />
                </Form.Item>
                <Form.Item label="NEGOCIAÇÃO" name="DEADLINE_NEGOCIACAO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1" />
                </Form.Item>
                <Form.Item label="FINANCIAMENTO" name="DEADLINE_FINANCIAMENTO" rules={[{ required: true, message: "Prazo é obrigatório" }]}>
                    <Input type="number" min="1" />
                </Form.Item>

                <Divider orientation="vertical" />

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