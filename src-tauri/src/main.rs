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
    let folders: [&str; 5] = [
        "01 - PROJETO",
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
fn read_all_projects(path: &str, fase: &str) -> Vec<String> {
    let dir = fs::read_dir(format!("{}", path));

    if dir.is_err() {
        return Vec::new();
    }

    let dir = dir.unwrap();
    let mut projects = Vec::new();
    for entry in dir {
        if let Ok(entry) = entry {
            if entry.file_type().unwrap().is_dir() {
                let sub_dir = fs::read_dir(entry.path());
                if let Ok(sub_dir) = sub_dir {
                    for sub_entry in sub_dir {
                        if let Ok(sub_entry) = sub_entry {
                            if sub_entry.file_type().unwrap().is_dir() {
                                let metadata =
                                    fs::read_to_string(sub_entry.path().join("metadata.json"));
                                if let Ok(metadata) = metadata {
                                    projects.push(metadata);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if fase != "TODOS" && fase != "" {
        projects = projects
            .into_iter()
            .filter_map(|metadata| {
                // Parse the metadata string into a JSON value
                let json: serde_json::Result<serde_json::Value> = serde_json::from_str(&metadata);
                match json {
                    Ok(json) => {
                        // Check if the "fase" field of the JSON is equal to the "fase" parameter
                        if json.get("fase").map_or(false, |f| f == fase) {
                            Some(metadata)
                        } else {
                            None
                        }
                    }
                    Err(_) => None, // If the metadata is not valid JSON, ignore it
                }
            })
            .collect();

        return projects;
    }

    return projects;
}

#[tauri::command]
fn add_project(path: &str, fase: &str, project_name: &str, metadata: &str) -> String {
    let real_fase: &str;
    if fase == "02 - DIGITACAO" || fase == "03 - REVISAO" || fase == "04 - CONFERENCIA" {
        real_fase = "01 - PROJETO";
    } else {
        real_fase = fase;
    }

    let project_path = format!("{}/{}/{}", path, real_fase, project_name);

    if fs::read_dir(&project_path).is_ok() {
        return "Já existe um projeto com esse mesmo nome".to_string();
    }

    let metadata_json = serde_json::from_str::<serde_json::Value>(metadata);

    if metadata_json.is_err() {
        return "Erro ao adicionar projeto".to_string();
    }

    let metadata_json = metadata_json.unwrap();
    let metadata_path = format!("{}/metadata.json", &project_path);
    fs::create_dir_all(&project_path).unwrap();
    fs::write(metadata_path, metadata_json.to_string()).unwrap();
    "Operação Executada Com Sucesso!".to_string()
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
    let real_origin: &str;
    let real_dest: &str;

    if origin == "02 - DIGITACAO" || origin == "03 - REVISAO" || origin == "04 - CONFERENCIA" {
        real_origin = "01 - PROJETO";
    } else {
        real_origin = origin;
    }

    if dest == "02 - DIGITACAO" || dest == "03 - REVISAO" || dest == "04 - CONFERENCIA" {
        real_dest = "01 - PROJETO";
    } else {
        real_dest = dest;
    }

    let origin_path = format!("{}/{}/{}", basepath, real_origin, path);
    let dest_path = format!("{}/{}/{}", basepath, real_dest, path);

    let orign_metadata_path = format!("{}/{}/{}/{}", basepath, real_origin, path, "metadata.json");
    let dest_metadata_path = format!("{}/{}/{}/{}", basepath, real_dest, path, "/metadata.json");

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
fn edit_project<'a>(
    path: &'a str,
    fase: &'a str,
    cliente: &'a str,
    descricao: &'a str,
    campo: &'a str,
    valor: serde_json::Value,
) -> String {
    let real_fase: &str;

    if fase == "02 - DIGITACAO" || fase == "03 - REVISAO" || fase == "04 - CONFERENCIA" {
        real_fase = "01 - PROJETO";
    } else {
        real_fase = fase;
    }

    let cliente = cliente.replace(" ", "_");
    let descricao = descricao.replace(" ", "_");
    let cliente_descricao = format!("{}-{}", cliente, descricao);
    let path = format!("{}/{}/{}", path, real_fase, cliente_descricao);
    let metadata = fs::read_to_string(format!("{}/metadata.json", &path));
    if metadata.is_err() {
        return "Erro ao encontrar metadata".to_string();
    }
    let metadata = metadata.unwrap();
    let metadata_json = serde_json::from_str::<serde_json::Value>(&metadata);
    if metadata_json.is_err() {
        return "Erro ao parsear metadata".to_string();
    }
    let mut metadata_json = metadata_json.unwrap();
    metadata_json[campo] = valor;
    fs::write(
        format!("{}/metadata.json", &path),
        metadata_json.to_string(),
    )
    .unwrap();
    "Operação Executada Com Sucesso!".to_string()
}
#[tauri::command]
fn get_number_of_projects(path: String) -> [i32; 8] {
    let mut projects: [i32; 8] = [0, 0, 0, 0, 0, 0, 0, 0];

    let dir = fs::read_dir(path);
    if dir.is_err() {
        return projects;
    }

    let dir = dir.unwrap();
    for entry in dir {
        if let Ok(entry) = entry {
            if entry.path().is_dir() {
                let sub_dir = fs::read_dir(entry.path());
                if let Ok(sub_dir) = sub_dir {
                    for sub_entry in sub_dir {
                        if let Ok(sub_entry) = sub_entry {
                            if sub_entry.path().is_dir() {
                                let metadata_path = sub_entry.path().join("metadata.json");
                                if metadata_path.exists() {
                                    let metadata = fs::read_to_string(metadata_path);
                                    if let Ok(metadata) = metadata {
                                        let parsed_metadata: serde_json::Value =
                                            serde_json::from_str(&metadata).unwrap();
                                        
                                        match parsed_metadata["fase"].as_str() {
                                            Some("01 - PROJETO") => projects[1] += 1,
                                            Some("02 - DIGITACAO") => projects[2] += 1,
                                            Some("03 - REVISAO") => projects[3] += 1,
                                            Some("04 - CONFERENCIA") => projects[4] += 1,
                                            Some("05 - NEGOCIACAO") => projects[5] += 1,
                                            Some("06 - FINANCIAMENTO") => projects[6] += 1,
                                            Some("07 - FECHADO") => projects[7] += 1,
                                            _ => (),
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

   
    projects[0] = projects[1] + projects[2] + projects[3] + projects[4] + projects[5] + projects[6];
    projects
}

#[tauri::command]
fn get_dead_line(path: &str) -> String {
    let dir = fs::read_dir(path);
    if dir.is_err() {
        return "401".to_string();
    }

    let dead_line = fs::read_to_string(format!("{}/dead_line.json", path));
    if dead_line.is_err() {
        return "401".to_string();
    }

    let dead_line = dead_line.unwrap();
    let dead_line_json = serde_json::from_str::<serde_json::Value>(&dead_line);
    if dead_line_json.is_err() {
        return "401".to_string();
    }

    return dead_line_json.unwrap().to_string();
}
#[tauri::command]
fn set_dead_line(path: &str, dead_line: &str) -> String {
    let dir = fs::read_dir(path);
    if dir.is_err() {
        return "Erro ao encontrar diretorio".to_string();
    }

    let dead_line_json = serde_json::from_str::<serde_json::Value>(dead_line);
    if dead_line_json.is_err() {
        return "Erro ao parsear dead_line".to_string();
    }
    //tente achar dead_line.json
    let dead_line = fs::read_to_string(format!("{}/dead_line.json", path));

    if dead_line.is_err() {
        //se não achar, crie um novo arquivo
        fs::write(
            format!("{}/dead_line.json", path),
            dead_line_json.unwrap().to_string(),
        )
        .unwrap();
    } else {
        //se achar, sobrescreva o arquivo
        fs::write(
            format!("{}/dead_line.json", path),
            dead_line_json.unwrap().to_string(),
        )
        .unwrap();
    }

    "Operação Executada Com Sucesso!".to_string()
}

fn main() {
    tauri::Builder::default()
        .setup(setup_handler)
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
            get_number_of_projects,
            get_dead_line,
            set_dead_line
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
fn setup_handler(app: &mut tauri::App) -> Result<(), Box<(dyn std::error::Error + 'static)>> {
    let app_handle = app.handle();
    let config_path = app_handle
        .path_resolver()
        .app_local_data_dir()
        .unwrap_or(std::path::PathBuf::new());
    let config_path_file = config_path.join("config.json");
    let config = fs::read_to_string(&config_path_file);
    if config.is_err() {
        println!("config.json not found, creating a new one");
        return Ok(());
    }
    let config = config.unwrap();
    let config_json = serde_json::from_str::<serde_json::Value>(&config);
    if config_json.is_err() {
        println!("config.json is invalid, creating a new one");
        return Ok(());
    }

    let config_json = config_json.unwrap();
    let stored_dead_line = get_dead_line(config_json["BASE_FOLDER"].as_str().unwrap());
    if stored_dead_line == "401" {
        println!("invalid dead_line.json");
        return Ok(());
    }
    let new_config = json!({
        "BASE_FOLDER": config_json["BASE_FOLDER"],
        "DEAD_LINE": stored_dead_line
    });
    if fs::write(config_path_file, new_config.to_string()).is_err() {
        println!("error while writing config.json");
        return Ok(());
    }
    else{
        println!("config.json updated");
    }


    Ok(())
}
