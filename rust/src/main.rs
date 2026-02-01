use axum::{Router};
use tokio::net::TcpListener;
mod run;
mod app;
mod lang;
use crate::app::{compiler_routes, other_routes};

#[tokio::main]
async fn main() {
    let new_app = Router::new()
    .merge(compiler_routes())
    .merge(other_routes());
    let listener = TcpListener::bind("127.0.0.1:4000")
        .await
        .unwrap();
    axum::serve(listener, new_app).await.unwrap();
}