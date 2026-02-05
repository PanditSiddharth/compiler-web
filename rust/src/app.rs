
use axum::{Json, Router, response::IntoResponse, routing::get};
use serde_json::json;

use crate::ws::ws_handler;
pub fn compiler_routes() -> Router{
    Router::new()
    .route("/ws/{lang}", get(ws_handler))
}

async fn home() -> impl IntoResponse {
    Json(json!({
        "service": "Compiler Backend API",
        "status": "running",
        "version": "1.0.0"
    }))
}

async fn health() -> impl IntoResponse {
    Json(json!({
        "ok": true,
        "uptime": "healthy"
    }))
}


pub fn other_routes() -> Router {
    Router::new()
        .route("/", get(home))
        .route("/health", axum::routing::get(health))
        
}
