use axum::{Router, routing::get};

use crate::routes::{compile::compile_routes, health, home::home};

pub fn create_app() -> Router {
    Router::new()
        .merge(compile_routes())
        .route("/", get(home))
        .route("/health", axum::routing::get(health::health))
}
