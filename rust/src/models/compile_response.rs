use serde::Serialize;

#[derive(Serialize)]
pub struct CompileResponse {
    pub stdout: String,
    pub stderr: String,
    pub time_ms: u128,
    pub success: bool,
}
