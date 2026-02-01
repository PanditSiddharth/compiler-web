use regex::Regex;
fn escape_quotes(s: &str) -> String {
    s.replace('"', "\\\"")
}

pub fn find_class(code: &str) -> String {
    // public class X OR class X
    let re = Regex::new(r"\b(public\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)")
        .unwrap();

    if let Some(caps) = re.captures(code) {
        caps.get(2).unwrap().as_str().to_string()
    } else {
        // fallback
        "Main".to_string()
    }
}


pub fn get_lang(lang: &str, ntext: String) -> (&'static str, Vec<String>) {
    match lang {
        // 🐍 Python
        "py" | "python" => (
            "python:3.9-slim",
            vec![
                "python3".into(),
                "-u".into(),
                "-c".into(),
                ntext,
            ],
        ),

        // 🟢 Node.js
        "js" | "node" | "javascript" => (
            "node:23.4-slim",
            vec![
                "node".into(),
                "-e".into(),
                ntext,
            ],
        ),

        // 🐚 Shell
        "sh" | "bash" => (
            "ubuntu:24.10",
            vec![
                "bash".into(),
                "-c".into(),
                ntext,
            ],
        ),

        // ☕ Java
        "jv" | "java" => {
            let class_name = find_class(&ntext); // tumhara existing fn
            let escaped = escape_quotes(&ntext);

            (
                "openjdk:25-slim",
                vec![
                    "sh".into(),
                    "-c".into(),
                    format!(
                        "echo \"{}\" > {1}.java && javac {1}.java && java {1}",
                        escaped,
                        class_name
                    ),
                ],
            )
        }

        // 🦀 Rust
        "rs" | "rust" => {
            let escaped = escape_quotes(&ntext);

            (
                "rust:1.83-slim",
                vec![
                    "sh".into(),
                    "-c".into(),
                    format!(
                        "echo \"{}\" > main.rs && rustc main.rs && ./main",
                        escaped
                    ),
                ],
            )
        }

        _ => panic!("Unsupported language: {}", lang),
    }
}
