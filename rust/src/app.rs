
use axum::{Router, routing::get};

use crate::run::ws_handler;
pub fn compiler_routes() -> Router{
    Router::new()
    .route("/ws/{lang}", get(ws_handler))
}

pub fn other_routes() -> Router {
    Router::new()
        // .route("/", get(ws_handler))
        // .route("/health", axum::routing::get(health::health))
        
}
