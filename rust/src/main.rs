use std::env;

use axum::{Router};
use tokio::net::TcpListener;
mod ws; mod run;
mod app;
mod lang;
use crate::app::{compiler_routes, other_routes};

#[tokio::main]
async fn main() {
    let new_app = Router::new()
    .merge(compiler_routes())
    .merge(other_routes());
    let host = format!("0.0.0.0:{}", env::var("PORT").unwrap_or("4000".into()));
    let listener = TcpListener::bind(host)
        .await
        .unwrap();
    axum::serve(listener, new_app).await.unwrap();
}
