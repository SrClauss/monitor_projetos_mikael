import { useState, useEffect } from "react";
import "./App.css";
import { Button, Tooltip, Modal, Form, Input } from "antd";
import { DoubleLeftOutlined, DoubleRightOutlined, FolderOpenFilled, CheckOutlined, DeleteColumnOutlined, DeleteOutlined, FileTextFilled } from "@ant-design/icons";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { fs } from "@tauri-apps/api";
import SeachScreen from "./components/SeachScreen";
import ScreenNovoProcesso from "./components/ScreenNovoProcesso";
import { invoke } from "@tauri-apps/api";
import ConfigForm from "./components/ConfigForm";
import Consultor from "./components/Consultor";
import LoginModal from "./components/LoginModal";
import NotesModal from "./components/NotesModal";




function App() {




  const [filteredValues, setFilteredValues] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [config, setConfig] = useState({})
  const [selectedFolder, setSelectedFolder] = useState("TODOS")
  const [customer, setCustomer] = useState("")
  const [configForm, setConfigForm] = useState(false)
  const [loginVisible, setLoginVisible] = useState(false)
  const [recordNotes, setRecordNotes] = useState()
  const [notesVisible, setNotesVisible] = useState(false)
  
  

  const DeadLine = (record) => {

    let deadLineConfig = {}
    try{
       deadLineConfig = JSON.parse(config.DEAD_LINE)
    }
    catch(error){
       deadLineConfig = config.DEAD_LINE
    }
   
    const fases = {
      "01 - PROJETO": deadLineConfig.projeto,
      "02 - DIGITACAO": deadLineConfig.digitacao,
      "03 - REVISAO": deadLineConfig.revisao,
      "04 - CONFERENCIA": deadLineConfig.conferencia,
      "05 - NEGOCIACAO": deadLineConfig.negociacao,
      "06 - FINANCIAMENTO": deadLineConfig.financiamento,
      "07 - FECHADO": "Fechado"

    };


    const arrDataModificacao = record.dataModificacao.split("/")
    const dataModificacao = new Date(arrDataModificacao[2], arrDataModificacao[1] - 1, arrDataModificacao[0])
    const prazo = fases[record.fase]
    const deadlineDate = new Date(dataModificacao.getTime() + (prazo*86400000));
    const today = new Date()

    return (
      <div className={(today > deadlineDate) ? "text-red-500" : "text-green-500"}>
        <div className="text-center">{record.dataModificacao}</div>
        {(record.fase !== "07 - FECHADO") ?
          (<div className="mt-3 text-center">{(today > deadlineDate) ? 
          `(Atrasado desde ${deadlineDate.toLocaleDateString("PT-BR")})` : 
          `Expira em ${deadlineDate.toLocaleDateString("PT-BR")}`}</div>) :
          (<div className="mt-3 text-center">Projeto Fechado</div>)
        }
      </div>
    )

   

  }

  const navigateTo = (record) => {
    let fase = ""
    if (record.fase === "02 - DIGITACAO" || record.fase === "03 - REVISAO" || record.fase === "04 - CONFERENCIA") {
      fase = "01 - PROJETO"
    }
    else{

      fase = record.fase
    }
    const folder = (config.BASE_FOLDER + "/" + fase + "/" + (record.cliente + "-" + record.descricao).replaceAll(" ", "_").toUpperCase()).replaceAll("/", "\\");

    invoke("goto_folder", { path: folder })
  }


  const handleConfigSubmit = () => {

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
      "08 - ARQUIVADO"

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
        await readAllProjects(config)



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
      "08 - ARQUIVADO"

    ]

    const currentFolder = register.fase
    const currentFolderIndex = folders.indexOf(currentFolder)
    const previousFolder = currentFolderIndex > 0 ? folders[currentFolderIndex - 1] : folders[10000]
    const nome_projeto = (register.cliente + "-" + register.descricao).toUpperCase().replaceAll(" ", "_")


    if (previousFolder) {
      const ask =  confirm("Deseja mover o projeto para a pasta " + previousFolder + "?")
      if (ask) {
        invoke('move_path', {
          basepath: config.BASE_FOLDER,
          path: nome_projeto,
          origin: currentFolder,
          dest: previousFolder,
          date: new Date().toLocaleDateString()
        })

        await readAllProjects(config)




      }

    }

  }

  useEffect(() => {


    appLocalDataDir().then((path) => {
      appLocalDataDir().then((path) => {
        fs.exists(path + "config.json").then(async (exists) => {
          if (!exists) {
            setLoginVisible(true)
          }
          else {
            appLocalDataDir().then((path) => {
              fs.readTextFile(path + "config.json").then((data) => {
                if (!JSON.parse(data).BASE_FOLDER) {
                  setLoginVisible(true)
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

  const readAllProjects = async (conf) => {
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
      width: "5%",
    

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
                  
                  invoke("set_field_value", { path: config.BASE_FOLDER, customer: record.cliente, projectName: record.descricao, field: "movimentado", value: e.target.value}).then((data) => {
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
          <Tooltip title="Inserir Anotação ao Projeto">
            <Button className="mr-1" icon={<FileTextFilled />} onClick={(e)=>openNotesModal(record)} />
          </Tooltip>
        </>


      )
    },


  ]
  const handleLoginSubmit = (formValues) => {
    if (formValues.senha === "031265") {
      setLoginVisible(false)
      setConfigForm(true)
    } else {
      alert("Senha incorreta")

    }

  }
  const handleCancelLoginForm = () => {

    setLoginVisible(false)
  }
  const openNotesModal = (record) => {
    setRecordNotes(record)
    setNotesVisible(true)
  }

  return (


    <div className="p-4">



      {showForm ?
        (
          configForm ? (
            <ConfigForm setShowConfig={setConfigForm} config={config} onSubmit={handleConfigSubmit} />
          ) :
            <>
              <LoginModal visible={loginVisible} onLoginSubmit={handleLoginSubmit} onCancel={handleCancelLoginForm}/>

              {notesVisible &&
              <NotesModal record={recordNotes} visible={notesVisible} setVisible={setNotesVisible}/>}
              <SeachScreen
                columns={columns}
                filtredValues={filteredValues}
                setShowForm={setShowForm}
                onFilterSet={setSelectedFolder}
                onSetCustomer={setCustomer}
                setConfigForm={setConfigForm}
                loginSubmit={handleLoginSubmit}



              />
            </>
        ) :
        (<ScreenNovoProcesso
          config={config}
          setShowForm={() => setShowForm(!showForm)}
          readAllProjects={readAllProjects} />
        )}




    </div>





  )
}





export default App;
