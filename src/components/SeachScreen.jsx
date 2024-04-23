import { Select, Radio, Divider, FloatButton, Table, Button } from "antd";
import { PlusOutlined, SettingOutlined, ReloadOutlined } from "@ant-design/icons";
import Search from "antd/es/input/Search";
import { useEffect, useState} from "react";
import { app, fs, invoke } from "@tauri-apps/api";
import { appLocalDataDir } from "@tauri-apps/api/path";


export default function SeachScreen({ columns, filtredValues, setShowForm, onFilterSet, onSetCustomer, setConfigForm}) {
  const [numTodos, setNumTodos] = useState(0)
  const [numProjeto, setNumProjeto] = useState(0)
  const [numDigitacao, setNumDigitacao] = useState(0)
  const [numRevisao, setNumRevisao] = useState(0)
  const [numConferencia, setNumConferencia] = useState(0)
  const [numNegociacao, setNumNegociacao] = useState(0)
  const [numFinanciamento, setNumFinanciamento] = useState(0)
  const [numFechado, setNumFechado] = useState(0)
  

  useEffect(() => {
    appLocalDataDir().then((dir) => {

      fs.exists(`${dir}/config.json`).then((exists)=>{
        fs.readTextFile(`${dir}/config.json`).then((data) => {
          const path = JSON.parse(data).BASE_FOLDER
          invoke("get_number_of_projects", { path: path }).then((data) => {
            setNumTodos(data[0])
            setNumProjeto(data[1])
            setNumDigitacao(data[2])
            setNumRevisao(data[3])
            setNumConferencia(data[4])
            setNumNegociacao(data[5])
            setNumFinanciamento(data[6])
            setNumFechado(data[7])
            
          })

          
        })
      })


    })
  }, [filtredValues])


  const radioOptions = [
    {
      label: `Todos (${numTodos})`,
      value: "TODOS",
    },
    {
      label: `Projeto (${numProjeto})`,
      value: "01 - PROJETO",
    },
    {
      label: `Digitação (${numDigitacao})`,
      value: "02 - DIGITACAO",
    },
    {
      label: `Revisão (${numRevisao})`,
      value: "03 - REVISAO",
    },
    {
      label: `Conferência (${numConferencia})`,
      value: "04 - CONFERENCIA",
    },
    {
      label: `Negociação (${numNegociacao})`,
      value: "05 - NEGOCIACAO",
    },
    {
      label: `Financiamento (${numFinanciamento})`,
      value: "06 - FINANCIAMENTO",
    },
    {
      label: `Fechado (${numFechado})`,
      value: "07 - FECHADO",
    }
  ]



  return (
    <div>
      <div id="processos">
        <div className="flex justify-between">

          <Search
            placeholder="Pesquisar por cliente"
            enterButton
            allowClear
            className="bg-blue-500 mr-2"
            onSearch={(value) => onSetCustomer(value)}
            onInput={(e) => e.target.value = e.target.value.toUpperCase()} />

        </div>

        <Divider orientation="left">Fases</Divider>

        <div className="flex justify-center">

          <Radio.Group
            options={radioOptions}
            onChange={(e) => onFilterSet(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            defaultValue="TODOS" />
        </div>
        <Divider />
        <div>
          <Table columns={columns} dataSource={filtredValues} />

        </div>
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          aria-label="Adcionar Processo"
          tooltip="Adcionar Processo"
          onClick={() => setShowForm(false)} />
        <FloatButton
          icon={<SettingOutlined />}
          style={{ right: "82px" }}
          aria-label="Configurações"
          tooltip="Configurações"
          onClick={() => setConfigForm(true)} />
        <FloatButton
          icon={<ReloadOutlined />}
          style={{ left: "40px" }}

          aria-label="Configurações"
          tooltip="Recarregar"
          onClick={() => window.location.reload()} />

          



      </div>

    </div>
  )
}