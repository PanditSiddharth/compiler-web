use serde::Deserialize;

#[derive(Deserialize)]
pub struct CompileRequest {
    pub language: String,
    pub code: String,
    pub input: Option<String>,
}
