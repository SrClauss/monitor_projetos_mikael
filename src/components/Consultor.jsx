import { Button, Input, Space } from "antd"
import { useState, useEffect } from "react"
import { CheckOutlined } from "@ant-design/icons"
/**
 * Renders the Consultor component.
 * @param {Object} props - The component props.
 * @param {string} props.consultor - The consultor value.
 * @param {string} props.fase - The fase value.
 * @param {number} props.estado - The estado value.
 * @param {function} props.enviaConsultor - The function to send the consultor value.
 * @param {string} props.key - The unique key for the component.
 * @returns {JSX.Element} The rendered Consultor component.
 */
export default function Consultor({ consultor, fase, estado, enviaConsultor, key }) {
    const [estadoConsultor, setEstadoConsultor] = useState(estado)
    const [consultorInput, setConsultorInput] = useState(consultor)


    if (!consultor && fase === "06 - FINANCIAMENTO") {
        if (estadoConsultor === 0) {
            return (

                <Button className="bg-cyan-600" type="primary" onClick={() => setEstadoConsultor(1)}>
                    Inserir Consultor
                </Button>
            )
        }
        else if (estadoConsultor === 1) {
            return (
                <Space.Compact>
                    <Input
                        onInput={(e) => e.target.value = e.target.value.toUpperCase()}
                        onChange={e => setConsultorInput(e.target.value)} placeholder="Consultor" />
                    <Button type="primary"
                        className="bg-cyan-600"

                        icon={<CheckOutlined />}
                        onClick={() => {


                            enviaConsultor(consultorInput)

                        }


                        } />


                </Space.Compact>

            )
        }
        else {
            return (<div>
              
            </div>)
        }

    }
    else {
        return (<div>{consultor}</div>)
    }
}