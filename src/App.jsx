import { useState, useEffect } from "react";
import "./App.css";
import { Button, Tooltip, Checkbox } from "antd";
import { DoubleLeftOutlined, DoubleRightOutlined, FolderOpenFilled, CheckOutlined, DeleteColumnOutlined, DeleteOutlined } from "@ant-design/icons";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { dialog, fs, window as tauriWindow } from "@tauri-apps/api";
import SeachScreen from "./components/SeachScreen";
import ScreenNovoProcesso from "./components/ScreenNovoProcesso";
import { invoke } from "@tauri-apps/api";
import ConfigForm from "./components/ConfigForm";
import Consultor from "./components/Consultor";


function App() {
  function open_dialog(){
    const webview = new tauriWindow.WebviewWindow('theUniqueLabel', {
      url: 'https://github.com/tauri-apps/tauri'})
    
  }

  const [filteredValues, setFilteredValues] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [config, setConfig] = useState({})
  const [selectedFolder, setSelectedFolder] = useState("TODOS")
  const [customer, setCustomer] = useState("")
  const [configForm, setConfigForm] = useState(false)


  const DeadLine = (record) => {
    const fases = {
      "01 - PROJETO": config.DEAD_LINE.projeto,
      "02 - DIGITACAO": config.DEAD_LINE.digitacao,
      "03 - REVISAO": config.DEAD_LINE.revisao,
      "04 - CONFERENCIA": config.DEAD_LINE.conferencia,
      "05 - NEGOCIACAO": config.DEAD_LINE.negociacao,
      "06 - FINANCIAMENTO": config.DEAD_LINE.financiamento,
      "07 - FECHADO": "Fechado"

    };
    const arrDataModificacao = record.dataModificacao.split("/")
    const dataModificacao = new Date(arrDataModificacao[2], arrDataModificacao[1] - 1, arrDataModificacao[0])
    const prazo = fases[record.fase]
    const deadlineDate = new Date(dataModificacao.getTime() + (prazo * 24 * 60 * 60 * 1000));
    const today = new Date()

    return (
      <div className={(today > deadlineDate) ? "text-red-500" : "text-green-500"}>
        <div className="text-center">{record.dataModificacao}</div>
        {(record.fase !== "07 - FECHADO") ?
          (<div className="mt-3 text-center">{(today > deadlineDate) ? `(Atrasado desde ${deadlineDate.toLocaleDateString("PT-BR")})` : `Expira em ${deadlineDate.toLocaleDateString("PT-BR")}`}</div>) :
          (<div className="mt-3 text-center">Projeto Fechado</div>)
        }
      </div>
    )


  }
  const navigateTo = (record) => {
    const folder = (config.BASE_FOLDER + "/" + record.fase + "/" + (record.cliente + "-" + record.descricao).replaceAll(" ", "_").toUpperCase()).replaceAll("/", "\\");

    invoke("goto_folder", { path: folder })
  }


  const handleConfigSubmit = (conf) => {

    const configuration = {
      BASE_FOLDER: conf.BASE_FOLDER,
      DEAD_LINE: {
        projeto: conf.DEADLINE_PROJETO,
        digitacao: conf.DEADLINE_DIGITACAO,
        revisao: conf.DEADLINE_REVISAO,
        conferencia: conf.DEADLINE_CONFERENCIA,
        negociacao: conf.DEADLINE_NEGOCIACAO,
        financiamento: conf.DEADLINE_FINANCIAMENTO

      },
      BRUFS: ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"]
    }
    invoke("create_folders_sctructure", { path: configuration.BASE_FOLDER }).then((data) => {
      console.log(data)
    }).catch((error) => {
      console.log(error)
    })

    appLocalDataDir().then((path) =>
      fs.writeTextFile(path + "config.json", JSON.stringify(configuration))
    )
    setConfig(configuration)

    readAllProjects()
    setConfigForm(false)





  }



  const moveForward = async (register) => {
    const folders = [
      "01 - PROJETO",
      "02 - DIGITACAO",
      "03 - REVISAO",
      "04 - CONFERENCIA",
      "05 - NEGOCIACAO",
      "06 - FINANCIAMENTO",
      "07 - FECHADO",

    ]

    const currentFolder = register.fase
    const currentFolderIndex = folders.indexOf(currentFolder)
    const nextFolder = folders[currentFolderIndex + 1]
    const nome_projeto = (register.cliente + "-" + register.descricao).toUpperCase().replaceAll(" ", "_")


    if (nextFolder) {
      const ask = await confirm("Deseja mover o projeto para a pasta " + nextFolder + "?")
      if (ask) {
        invoke('move_path', {
          basepath: config.BASE_FOLDER,
          path: nome_projeto,
          origin: currentFolder,
          dest: nextFolder,
          date: new Date().toLocaleDateString()
        })
        await readAllProjects()



      }

    }

  }

  const moveBack = async (register) => {
    const folders = [
      "01 - PROJETO",
      "02 - DIGITACAO",
      "03 - REVISAO",
      "04 - CONFERENCIA",
      "05 - NEGOCIACAO",
      "06 - FINANCIAMENTO",
      "07 - FECHADO",

    ]

    const currentFolder = register.fase
    const currentFolderIndex = folders.indexOf(currentFolder)
    const previousFolder = currentFolderIndex > 0 ? folders[currentFolderIndex - 1] : folders[10000]
    const nome_projeto = (register.cliente + "-" + register.descricao).toUpperCase().replaceAll(" ", "_")


    if (previousFolder) {
      const ask = await confirm("Deseja mover o projeto para a pasta " + previousFolder + "?")
      if (ask) {
        invoke('move_path', {
          basepath: config.BASE_FOLDER,
          path: nome_projeto,
          origin: currentFolder,
          dest: previousFolder,
          date: new Date().toLocaleDateString()
        })

        await readAllProjects()




      }

    }

  }


  useEffect(() => {


    appLocalDataDir().then((path) => {
      appLocalDataDir().then((path) => {
        fs.exists(path + "config.json").then(async (exists) => {
          if (!exists) {
            setConfigForm(true)
            await dialog.message("Não existe arquivo de cofiguração para esta aplicação, configure o diretorio base e os responsáveis. Esta configuração poderá ser mudada posteriormente")


          }
          else {
            appLocalDataDir().then((path) => {
              fs.readTextFile(path + "config.json").then((data) => {
                if (!JSON.parse(data).BASE_FOLDER) {
                  setConfigForm(true)
                }
                else {
                  setConfig(JSON.parse(data))
                }
              })
            })

          }

        })


      })

      fs.readTextFile(path + "/config.json").then((data) => {
        const parsedData = JSON.parse(data)
        setConfig(parsedData)


        readAllProjects(parsedData)

      }


      ).catch((error) => {
        console.log(error)
      })


    })
  }, [selectedFolder, customer])


  const readAllProjects = async (conf = config) => {
    invoke("read_all_projects", { path: conf.BASE_FOLDER, fase: selectedFolder, customer: customer }).then((data) => {

      const jsonData = data.map(p => JSON.parse(p))
      setFilteredValues(() =>
        jsonData.map((project, index) => ({
          key: index,
          responsavel: project.responsavel,
          descricao: project.descricao,
          cliente: project.cliente.nome,
          dataCriacao: project.dataCriacao,
          dataModificacao: project.dataModificacao,
          fase: project.fase,
          consultor: project.consultor,
          metadata: project.cliente,
          estadoConsultor: 0,
          movimentado: project.movimentado,



        }))
      )




    }).catch((error) => {
      console.log(error)
    })
  }

  


  const columns = [

    {
      title: "Cliente",
      dataIndex: "cliente",
      key: "cliente",
      width: "25%",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.cliente > b.cliente ? -1 : 1,
      filters: filteredValues.map((p) => ({ text: p.cliente, value: p.cliente })),
      onFilter: (value, record) => record.cliente.includes(value),

    },
    {
      title: "Descricão",
      dataIndex: "descricao",
      key: "descricao",
      width: "10%"
    },
    {
      title: "Data Criação",
      dataIndex: "dataCriacao",
      key: "dataCriacao",
      width: "5%"

    },
    {
      title: "Data Modificação",
      dataIndex: "dataModificacao",
      key: "dataModificacao",
      width: "5%",
      render: (_, record) => DeadLine(record)


    },
    {
      title: "Fase",
      dataIndex: "fase",
      key: "fase",
      width: "10%",
      render: (_, record) => (
        <>

          <div className="text-center">{record.fase}</div>
          <Tooltip title="Marque esta caixa caso vá se responsabilizar por esta fase do projeto">
            <div className="text-center border border-gray-300n rounded-md pl-1 pr-1 hover:border-blue-500 hover:border-b-2">
              <div className="pt-2">Movimentado?</div>

              <input
                type="checkbox"
                checked={filteredValues[record.key].movimentado}
                onChange={(e) => {
                  const copy = [...filteredValues]
                  copy[record.key].movimentado = e.target.checked
                  setFilteredValues(copy)
                  //fn edit_project(path:String, fase:String,  cliente: String, descricao:String, campo:String, valor:String) 
                  invoke("edit_project", { path: config.BASE_FOLDER, fase: record.fase, cliente: record.cliente, descricao: record.descricao, campo: "movimentado", valor: e.target.checked }).then((data) => {
                    console.log(data)
                  }).catch((error) => {
                    console.log(error)
                  })

                }} />


            </div>
          </Tooltip>


        </>



      )

    },
    {
      title: "Consultor",
      dataIndex: "consultor",
      key: "consultor",
      width: "20%",
      render: (_, record) => (<Consultor
        consultor={record.consultor}
        fase={record.fase}
        estado={record.estadoConsultor}
        enviaConsultor={(consultor) => {
          const project_name = (record.cliente + "-" + record.descricao).toUpperCase().replaceAll(" ", "_")
          invoke("insert_consultor", { path: config.BASE_FOLDER, consultor: consultor, projectName: project_name }).then((data) => {
            console.log(data)
          }).catch((error) => {
            console.log(error)
          })
          setFilteredValues(() => {
            const copy = [...filteredValues]
            copy[record.key].consultor = consultor
            copy[record.key].estadoConsultor = 0
            return copy

          })


        }}
      />)


    },
    {
      title: "Ações",
      dataIndex: "acoes",
      key: "acoes",
      render: (_, record) => (
        <>

          <Tooltip title="Navegar ao diretorio do projeto">

            <Button className="mr-1" onClick={() => navigateTo(record)} icon={<FolderOpenFilled />} />


          </Tooltip>
          <Tooltip title="Regredir Projeto">
            <Button onClick={() => moveBack(record)} className="mr-1" icon={<DoubleLeftOutlined />} />
          </Tooltip>

          <Tooltip onClick={() => moveForward(record)} title="Avançar Projeto">
            <Button className="mr-1" icon={<DoubleRightOutlined />} />
          </Tooltip>


        </>


      )
    },


  ]

  return (


    <div className="p-4">
      <button onClick={open_dialog}>Open</button>

     
      

      {showForm ? (
        configForm ? (
          <ConfigForm setShowConfig={setConfigForm} config={config} onSubmit={handleConfigSubmit} />
        ) :

          <SeachScreen
            columns={columns}
            filtredValues={filteredValues}
            setShowForm={setShowForm}
            onFilterSet={setSelectedFolder}
            onSetCustomer={setCustomer}
            setConfigForm={setConfigForm}



          />) :
        (<ScreenNovoProcesso
          config={config}
          setShowForm={() => setShowForm(!showForm)}
          readAllProjects={readAllProjects} />)}




    </div>





  )
}



export default App;
