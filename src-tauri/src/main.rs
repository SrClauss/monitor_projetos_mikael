// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::json;
use std::fs;
use std::process::Command;
use uuid::Uuid;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
fn insert_consultor(path: &str, consultor: &str, project_name: &str) -> String {
    // Leia o diretório
    let diretorio = fs::read_dir(path);
    if diretorio.is_err() {
        return "Erro ao adicionar consultor - Diretorio inexistente".to_string();
    }

    // Itere sobre as entradas do diretório
    for entrada in diretorio.unwrap() {
        if entrada.is_ok() {
            let entrada = entrada.unwrap();

            // Verifique se a entrada é um diretório
            if entrada.file_type().unwrap().is_dir() {
                // Verifique se o nome do diretório não é "CLIENTES"
                if entrada.file_name() != "CLIENTES" {
                    // Procure dentro deste diretório um diretório chamado project_name
                    let diretorio_projeto = fs::read_dir(entrada.path().join(project_name));

                    if diretorio_projeto.is_ok() {
                        // Itere sobre as entradas do diretório do projeto
                        for entrada_projeto in diretorio_projeto.unwrap() {
                            if entrada_projeto.is_ok() {
                                let entrada_projeto = entrada_projeto.unwrap();

                                if entrada_projeto.file_name() == "metadata.json" {
                                    let metadata = fs::read_to_string(entrada_projeto.path());
                                    if metadata.is_ok() {
                                        let metadata = metadata.unwrap();
                                        let metadata_json = serde_json::from_str::<serde_json::Value>(
                                            metadata.as_str(),
                                        );
                                        if metadata_json.is_ok() {
                                            let mut metadata_json = metadata_json.unwrap();
                                            metadata_json["consultor"] = json!(consultor);
                                            fs::write(
                                                entrada_projeto.path(),
                                                metadata_json.to_string(),
                                            )
                                            .unwrap();
                                            return "Operação Executada Com Sucesso!".to_string();
                                        }

                                        return "Projeto ja existe".to_string();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Retorne uma mensagem de erro
    "Erro ao adicionar consultor".to_string()
}

#[tauri::command]
fn create_folders_sctructure(path: &str) {
    //criar as pastas do projeto
    let folders: [&str; 8] = [
        "01 - PROJETO",
        "02 - DIGITACAO",
        "03 - REVISAO",
        "04 - CONFERENCIA",
        "05 - NEGOCIACAO",
        "06 - FINANCIAMENTO",
        "07 - FECHADO",
        "CLIENTES",
    ];
    for folder in folders {
        if fs::read_dir(format!("{}/{}", path, folder)).is_err() {
            fs::create_dir(format!("{}/{}", path, folder)).unwrap();
        }
    }
}
#[tauri::command]

fn goto_folder(path: &str) {
    //abrir o caminho path
    println!("abrir o caminho {}", path);
    Command::new("explorer").arg(path).spawn().unwrap();
}

#[tauri::command]
fn read_all_projects(path: &str, fase: &str, customer: &str) -> Vec<String> {
    let mut projects: Vec<String> = Vec::new();
    if fase == "TODOS" || fase == "" {
        let folders: [&str; 7] = [
            "01 - PROJETO",
            "02 - DIGITACAO",
            "03 - REVISAO",
            "04 - CONFERENCIA",
            "05 - NEGOCIACAO",
            "06 - FINANCIAMENTO",
            "07 - FECHADO",
        ];
        for folder in folders {
            let dir = fs::read_dir(format!("{}/{}", path, folder)).unwrap();
            for entry in dir {
                if entry.is_ok() {
                    let entry = entry.unwrap();
                    if entry.file_type().unwrap().is_dir() {
                        //procure um arquivo chamado metadata.json dentro da pasta e mande seu conteudo para projects
                        let metadata = fs::read_to_string(entry.path().join("metadata.json"));
                        if metadata.is_ok() {
                            projects.push(metadata.unwrap());
                        }
                    }
                }
            }
        }
    } else {
        let dir = fs::read_dir(format!("{}/{}", path, fase)).unwrap();
        for entry in dir {
            if entry.is_ok() {
                let entry = entry.unwrap();
                if entry.file_type().unwrap().is_dir() {
                    let metadata = fs::read_to_string(entry.path().join("metadata.json"));
                    if metadata.is_ok() {
                        projects.push(metadata.unwrap());
                    }
                }
            }
        }
    }
    if customer != "" {
        projects = projects
            .into_iter()
            .filter(|x| x.contains(customer))
            .collect();
    }

    projects
}

#[tauri::command]
fn add_project(path: &str, fase: &str, project_name: &str, metadata: &str) -> String {
    //verifique se existe uma pasta dentro de path com o nome project_name, se não houver, crie uma, caso haja, retorne um erro
    //verifica em todas as subpastas de se existe uma pasta com o mesmo nome de project_name, se houver, retorne um erro
    let directories = [
        "01 - PROJETO",
        "02 - DIGITACAO",
        "03 - REVISAO",
        "04 - CONFERENCIA",
        "05 - NEGOCIACAO",
        "06 - FINANCIAMENTO",
        "07 - FECHADO",
    ];
    for directory in directories {
        let dir_fases = fs::read_dir(format!("{}/{}", path, directory));
        if dir_fases.is_ok() {
            let dir_fases = dir_fases.unwrap();
            for entry in dir_fases {
                if entry.is_ok() {
                    let entry = entry.unwrap();
                    if entry.file_type().unwrap().is_dir() {
                        if entry.file_name() == project_name {
                            return "Já existe um projeto com esse mesmo nome".to_string();
                        }
                    }
                }
            }
        }
    }

    let dir = fs::read_dir(format!("{}/{}/{}", path, fase, project_name));
    if dir.is_err() {
        fs::create_dir(format!("{}/{}/{}", path, fase, project_name)).unwrap();
        //verifique se metadata pode ser parseada para um json
        let metadata = serde_json::from_str::<serde_json::Value>(metadata);
        if metadata.is_err() {
            "Erro ao adicionar projeto".to_string()
        } else {
            fs::write(
                format!("{}/{}/{}/metadata.json", path, fase, project_name),
                metadata.unwrap().to_string(),
            )
            .unwrap();
            "Operação Executada Com Sucesso!".to_string()
        }
    } else {
        "Já existe um projeto com esse mesmo nome".to_string()
    }
}
#[tauri::command]
fn read_all_custommers(path: &str) -> Vec<String> {
    let dir = fs::read_dir(format!("{}/CLIENTES", path));
    if dir.is_ok() {
        let dir = dir.unwrap();
        let mut customers = Vec::new();
        for entry in dir {
            if let Ok(entry) = entry {
                if entry.file_type().unwrap().is_file() {
                    //veriifique se a extensão do arquivo é .json
                    if entry.path().extension().unwrap() == "json" {
                        //leia o conteúdo do arquivo
                        let content = fs::read_to_string(entry.path()).unwrap();
                        customers.push(content);
                    }
                }
            }
        }
        return customers;
    }
    Vec::new()
}

#[tauri::command]
fn move_path<'a>(
    basepath: &'a str,
    path: &'a str,
    origin: &'a str,
    dest: &'a str,
    date: &'a str,
) -> &'a str {
    //procure uma pasta chamada path no caminho basepath/orign e de um erro caso não ache
    //mova a pasta path par ao caminho basepath/dest, com todos os seus arquivos e pasta
    //procure uma pasta chamada path no caminho basepath/orign e de um erro caso não ache
    //mova a pasta path par ao caminho basepath/dest, com todos os seus arquivos e pasta

    let origin_path = format!("{}/{}/{}", basepath, origin, path);
    let dest_path = format!("{}/{}/{}", basepath, dest, path);

    let orign_metadata_path = format!("{}/{}/{}/{}", basepath, origin, path, "metadata.json");
    let dest_metadata_path = format!("{}/{}/{}/{}", basepath, dest, path, "/metadata.json");

    let metadata = fs::read_to_string(&orign_metadata_path);
    if metadata.is_err() {
        return "Erro ao mover pasta";
    }
    let metadata = metadata.unwrap();
    fs::remove_file(&orign_metadata_path).unwrap();

    let metadata_json = serde_json::from_str::<serde_json::Value>(metadata.as_str());
    if metadata_json.is_err() {
        return "Erro ao mover pasta";
    }
    let mut metadata_json = metadata_json.unwrap();
    metadata_json["fase"] = json!(dest);
    metadata_json["dataModificacao"] = json!(date);
    metadata_json["movimentado"] = json!(false);
    fs::rename(origin_path, dest_path).unwrap();
    fs::write(&dest_metadata_path, metadata_json.to_string()).unwrap();

    "Operação Executada Com Sucesso!"
}

#[tauri::command]
fn add_customer<'a>(str: &'a str, path: &'a str) -> String {
    //verifique se existe uma pasta dentro de path com o nome 'CLIENTES'se não existir, crie uma
    let dir = fs::read_dir(format!("{}/CLIENTES", path));
    if dir.is_err() {
        fs::create_dir(format!("{}/CLIENTES", path)).unwrap();
    }
    //criar um uuid
    let id = Uuid::new_v4().to_string();
    //ler o arquivo json e verificar se ele é valido
    let customer: Result<serde_json::Value, serde_json::Error> =
        serde_json::from_str::<serde_json::Value>(str);

    if customer.is_err() {
        "Erro ao adicionar cliente".to_string()
    } else {
        let mut customer = customer.unwrap();
        if customer["name"] == json!("") {
            return "Erro ao adicionar cliente".to_string();
        }
        let cpf = customer["cadastroPessoa"].to_string();
        let vec_customers = read_all_custommers(path)
            .into_iter()
            .map(|customer| serde_json::from_str::<serde_json::Value>(&customer).unwrap())
            .enumerate();

        for (_i, customer) in vec_customers {
            if clean_string(customer["cadastroPessoa"].to_string()) == clean_string(cpf.clone()) {
                return "Cliente ja existe".to_string();
            }
        }

        customer["id"] = json!(id);
        customer["cadastroPessoa"] = json!(clean_string(cpf));
        customer["telefone"] = json!(clean_string(customer["telefone"].to_string()));
        customer["cep"] = json!(clean_string(customer["cep"].to_string()));
        println!("{}", serde_json::to_string_pretty(&customer).unwrap());
        let filename = format!(
            "{}/CLIENTES/{}-{}.json",
            path,
            id,
            customer["nome"]
                .to_string()
                .replace(" ", "_")
                .replace("\"", "")
                .as_str()
        );
        fs::write(filename, serde_json::to_string_pretty(&customer).unwrap()).unwrap();
        "Operação Executada Com Sucesso!".to_string()
    }
}

fn clean_string(s: String) -> String {
    s.replace(".", "")
        .replace("-", "")
        .replace("/", "")
        .replace("(", "")
        .replace(")", "")
        .replace("\"", "")
}
#[tauri::command]
fn edit_project(
    path: String,
    fase: String,
    cliente: String,
    descricao: String,
    campo: String,
    valor: serde_json::Value,
) -> String {
    let cliente = cliente.replace(" ", "_");
    let descricao = descricao.replace(" ", "_");
    let cliente_descricao = format!("{}-{}", cliente, descricao);
    let path = format!("{}/{}/{}", path, fase, cliente_descricao);
    let metadata = fs::read_to_string(format!("{}/metadata.json", path));
    if metadata.is_err() {
        return "Erro ao encontrar metadata".to_string();
    }
    let metadata = metadata.unwrap();
    let metadata_json = serde_json::from_str::<serde_json::Value>(metadata.as_str());
    if metadata_json.is_err() {
        return "Erro ao parsear metadata".to_string();
    }
    let mut metadata_json = metadata_json.unwrap();
    metadata_json[campo] = valor;
    fs::write(format!("{}/metadata.json", path), metadata_json.to_string()).unwrap();
    "Operação Executada Com Sucesso!".to_string()
}
#[tauri::command]
fn get_number_of_projects(path: String) -> Vec<i32> {
    let mut projects: Vec<i32> = Vec::new();
    let folders: [&str; 7] = [
        "01 - PROJETO",
        "02 - DIGITACAO",
        "03 - REVISAO",
        "04 - CONFERENCIA",
        "05 - NEGOCIACAO",
        "06 - FINANCIAMENTO",
        "07 - FECHADO",
    ];
    for folder in folders {
        let dir = fs::read_dir(format!("{}/{}", path, folder));
        if dir.is_ok() {
            let dir = dir.unwrap();
            let mut count = 0;
            for entry in dir {
                if entry.is_ok() {
                    let entry = entry.unwrap();
                    if entry.file_type().unwrap().is_dir() {
                        count += 1;
                    }
                }
            }

           
            projects.push(count);
        }
    }
    let total: i32 = projects.iter().sum();
    projects.insert(0, total);
    projects
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            goto_folder,
            create_folders_sctructure,
            read_all_projects,
            add_project,
            move_path,
            read_all_custommers,
            add_customer,
            insert_consultor,
            edit_project,
            get_number_of_projects
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
