use axum::{Json};
use crate::models::{compile_request::CompileRequest, compile_response::CompileResponse};
use crate::services::compiler_service;

pub async fn compile(
    Json(payload): Json<CompileRequest>
) -> Json<CompileResponse> {
    let result = compiler_service::compile_and_run(payload).await;
    Json(result)
}
