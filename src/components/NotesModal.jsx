
import { useState, useEffect } from "react";
import { Modal, Input } from "antd";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { fs } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api";


export default function NotesModal({ record, visible, setVisible }) {
    const [path, setPath] = useState("")
    const [notes, setNote] = useState("")


    useEffect(() => {


        appLocalDataDir().then((dir) => {
            fs.exists(`${dir}/config.json`).then((exists) => {
                fs.readTextFile(`${dir}/config.json`).then((data) => {
                    const basePath = JSON.parse(data).BASE_FOLDER
                    setPath(JSON.parse(data).BASE_FOLDER)

                    invoke("get_field_value", { path: basePath, customer: record.cliente, projectName: record.descricao, field: "anotacoes" }).
                        then((data) => {
                            setNote(JSON.parse(data))
                        }).catch((err) => {
                            console.log(err)
                        })

                }).catch((err) => {
                    alert(err)
                })
            })
        })
    },[])


    const handleOnOk = () => {
        
        invoke("set_field_value", {
            path: path,
            customer: record.cliente,
            projectName: record.descricao,
            field: "anotacoes", value: notes
        }).then((data) => {
            console.log(data)

        }).catch((err) => {
            console.log(err)
        })
        setVisible(false)


    }


    return (
        <Modal


            okText="Salvar"
            okButtonProps={{content: "Salvar", className: "bg-blue-600 text-white m-5"}}
            cancelButtonProps={{content: "Cancelar", className: "bg-red-600  text-white"}}
            
            title="Notas"
            open={visible}
            onOk={handleOnOk}
            onCancel={() => setVisible(false)}
            width={800}
        >
            <Input.TextArea
                className="text-justify"
                value={notes}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: "100%", height: "300px" }}
            />
        </Modal>
    )







}