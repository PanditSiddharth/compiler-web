use crate::models::{compile_request::CompileRequest, compile_response::CompileResponse};
use crate::services::executor;

pub async fn compile_and_run(req: CompileRequest) -> CompileResponse {
    match req.language.as_str() {
        "cpp" => executor::run_cpp(req).await,
        "python" => executor::run_python(req).await,
        _ => CompileResponse {
            stdout: "".into(),
            stderr: "Unsupported language".into(),
            time_ms: 0,
            success: false,
        }
    }
}
