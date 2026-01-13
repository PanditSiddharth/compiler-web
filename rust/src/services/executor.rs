use crate::{models::{compile_request::CompileRequest, compile_response::CompileResponse}, services::sandbox::execute_python_code};

pub async fn run_cpp(req: CompileRequest) -> CompileResponse {
    // Placeholder implementation for running C++ code
    execute_python_code(req).await
}

pub async fn run_python(req: CompileRequest) -> CompileResponse {
    execute_python_code(req).await
}
