use axum::{Router, routing::{get, post}};
use crate::{handlers::compile_handler::compile, services::ws::ws_handler};

pub fn compile_routes() -> Router {
    Router::new()
    .route("/compile", post(compile))
    .route("/ws", get(ws_handler))
}
