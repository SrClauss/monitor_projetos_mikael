import { Button, FloatButton, Form, Input, InputNumber, Select, Space, Switch } from "antd";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import InputMask from "react-input-mask"
import { ArrowLeftOutlined, BackwardFilled } from "@ant-design/icons";
const BRUFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
export default function ScreenCustomerForm({ setCustomerForm, config, value = null, onSubmit }) {
    const [nome, setNome] = useState();
    const [cadastroPessoa, setCadastroPessoa] = useState('');
    const [telefone, setTelefone] = useState();
    const [cep, setCep] = useState();
    const [endereco, setEndereco] = useState({});
    const [cadastroPessoaMask, setCadastroPessoaMask] = useState("999.999.999-99");
    const [cadastroPessoaPlaceHolder, setCadastroPessoaPlaceHolder] = useState("CPF");
    const [validCPF, setValidCPF] = useState(false);
    const [validCNPJ, setValidCNPJ] = useState(false);
    const [tipoPessoa, setTipoPessoa] = useState("CPF");


    const handleSendCustomer = () => {
        let customer = {
            nome: nome || "",
            cadastroPessoa: cadastroPessoa || "",
            telefone: telefone || "",
            cep: cep || "",
            logradouro: endereco.logradouro || "",
            bairro: endereco.bairro || "",
            localidade: endereco.localidade || "",
            uf: endereco.uf || "",
            numero: endereco.numero || "",
            complemento: endereco.complemento || ""

        }

        invoke('add_customer', { str: JSON.stringify(customer), path: config.BASE_FOLDER }).then((response) => {
            console.log(response)
            setCustomerForm(false)
        }).catch((error) => {
            console.log(error)
        })

        onSubmit(customer)



    }

    const onChangeSlidePessoa = (e) => {
        if (e){
            setCadastroPessoaMask("99.999.999/9999-99")
            setCadastroPessoaPlaceHolder("CNPJ")
            setTipoPessoa("CNPJ")
        }
        else{
            setCadastroPessoaMask("999.999.999-99")
            setCadastroPessoaPlaceHolder("CPF")
            setTipoPessoa("CPF")
        }

        
    }
    return (
        <>


            <div className="bg-blue-500 text-white text-center py-2 text-2xl">
                Cadastrar Novo Cliente
            </div>
            <div className="flex justify-end py-4">


            </div>
            <Form layout="vertical" className="p-4">
                <Form.Item label="Nome" id="nome">
                    <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} onInput={(e) => e.target.value = e.target.value.toUpperCase()} />
                </Form.Item>
                <Form.Item label={cadastroPessoaPlaceHolder} id="cpf-cnpj">

                    <div className="ant-col ant-form-item-control css-dev-only-do-not-override-1k979oh">
                        <div className="ant-form-item-control-input">
                            <div className="ant-form-item-control-input-content flex">
                                <InputMask
                                    className="w-full border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    mask={cadastroPessoaMask}
                                    placeholder={cadastroPessoaPlaceHolder}
                                    value={cadastroPessoa}
                                    onChange={(e) => setCadastroPessoa(e.target.value)}
                                    onBlur={(e) => handlePessoaBlur(e, tipoPessoa)}
                
                                ></InputMask>
                                <Switch
                                    checkedChildren="CNPJ "
                                    unCheckedChildren=" CPF"
                                    onChange={onChangeSlidePessoa }
                                    className="bg-blue-500 pr-2 mt-1 ml-2" />

                            </div>
                        </div>
                    </div>


                </Form.Item>
                <Form.Item label="Telefone" id="telefone">
                    <Input
                        placeholder="Telefone"
                        value={telefone}
                        onInput={(e) => handleInputNumber(e, 11, setTelefone)}
                        onBlur={(e) => handlePhoneBlur(e, setTelefone)}
                        onFocus={(e) => handleFocus(e, setTelefone)} />
                </Form.Item>


                <Form.Item label="CEP" id="cep">
                    <Input placeholder="CEP"
                        value={cep}
                        onInput={(e) => handleInputNumber(e, 8, setCep)}
                        onBlur={(e) => handleCepBlur(e, setCep, setEndereco, endereco)}
                        onFocus={(e) => handleFocus(e, setCep)}

                    />
                </Form.Item>
                <Form.Item label="Logradouro" id="logradouro">
                    <Input
                        placeholder="Logradouro"
                        value={endereco.logradouro}
                        onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value.toUpperCase() })} />
                </Form.Item>
                <Form.Item label="Bairro" id="bairro">
                    <Input
                        placeholder="Bairro"
                        value={endereco.bairro}
                        onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value.toUpperCase() })} />
                </Form.Item>
                <Form.Item label="Cidade/Estado" id="cidade">
                    <Space.Compact style={{ width: "100%" }}>
                        <Input
                            placeholder="Cidade"
                            value={endereco.localidade}
                            onChange={(e) => setEndereco({ ...endereco, localidade: e.target.value.toUpperCase() })}
                            style={{ width: "80%" }}

                        />

                        <Select
                            showSearch
                            placeholder="Estado"
                            value={endereco.uf}
                            options={BRUFS.map((uf) => ({ label: uf, value: uf }))}
                            onChange={(e) => setEndereco({ ...endereco, uf: e.target.value.toUpperCase() })}
                            style={{ width: "20%" }}
                        />


                    </Space.Compact>
                </Form.Item>
                <Form.Item label="Número/Complemento" id="numero-complemento">
                    <Space.Compact style={{ width: "100%" }}>
                        <InputNumber
                            placeholder="Numero"
                            value={endereco.numero}
                            onChange={(e) => setEndereco({ ...endereco, numero: e })}
                            style={{ width: "30%" }} />
                        <Input
                            placeholder="Complemento"
                            value={endereco.complemento}
                            onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value.toUpperCase() })}
                            style={{ width: "70%" }}
                        />
                    </Space.Compact>
                </Form.Item>

                <Button htmlType="button" className="bg-blue-500 text-white w-full" onClick={handleSendCustomer}>Salvar</Button>
                <FloatButton
                    icon={<ArrowLeftOutlined />}
                    onClick={() => setCustomerForm(false)}
                    style={{top: 80}}
                    />
            </Form>
        </>
    );
}


function handleInputNumber(e, max, setValue) {

    if (e.target.value.length <= max) {
        setValue(e.target.value.replace(/[^0-9]/g, ''));

    }


}
function handlePhoneBlur(e, setTelefone) {
    if (e.target.value.length == 10) {
        setTelefone("(" + e.target.value.substring(0, 2) + ")" + e.target.value.substring(2, 6) + "-" + e.target.value.substring(6, 10));
    }
    if (e.target.value.length == 11) {
        setTelefone("(" + e.target.value.substring(0, 2) + ")" + e.target.value.substring(2, 7) + "-" + e.target.value.substring(7, 11));
    }
}
function  handlePessoaBlur(e, tipoPessoa){
    const validateCPF =() => {
        const cpf = e.target.value.replaceAll(".", "").replaceAll("/", "").replaceAll("-", "").replaceAll("(", "").replaceAll(")", "").replaceAll(" ", "").replaceAll(" ", "");
        let sum;
        let rest;
        sum = 0;
        if (cpf == "00000000000") return false;
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        rest = (sum * 10) % 11;
        if (rest == 10 || rest == 11) rest = 0;
        if (rest != parseInt(cpf.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        rest = (sum * 10) % 11;
        if (rest == 10 || rest == 11) rest = 0;
        if (rest != parseInt(cpf.substring(10, 11))) return false;
        return true;
    }

    const validateCNPJ = () => {
        const cnpj = e.target.value.replaceAll(".", "").replaceAll("/", "").replaceAll("-", "").replaceAll("(", "").replaceAll(")", "").replaceAll(" ", "").replaceAll(" ", "");
        if (cnpj == "00000000000000") return false;
        if (cnpj.length != 14) return false;
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado != digitos.charAt(0)) return false;
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado != digitos.charAt(1)) return false;
        return true;
    }
    if (tipoPessoa == "CPF"){

        if(e.target.value !== "" && !validateCPF()){
            alert("CPF inválido")
            e.target.value = ""
        }
    }
    else{
        if(e.target.value !== "" && !validateCNPJ()){
            alert("CNPJ inválido")
            e.target.value = ""
        }
    }

        
}
function handleFocus(e, setCadastroPessoa) {
    setCadastroPessoa(e.target.value.replaceAll(".", "").replaceAll("/", "").replaceAll("-", "").replaceAll("(", "").replaceAll(")", "").replaceAll(" ", "").replaceAll(" ", ""));
}
function handleCepBlur(e, setCep, setEndereco, endereco) {
    if (e.target.value.length == 8) {
        let value = e.target.value;
        setCep(value.substring(0, 5) + "-" + value.substring(5, 8));
        fetch(`https://viacep.com.br/ws/${value}/json`).then(response => response.json()).then(data => {
            setEndereco({
                ...data,
                logradouro: data.logradouro.toUpperCase(),
                bairro: data.bairro.toUpperCase(),
                localidade: data.localidade.toUpperCase(),
                uf: data.uf.toUpperCase()
            });



        });




    }

}
