use tokio::net::TcpListener;
use axum;
use tokio;
mod app;
mod routes;
mod handlers;
mod services;
mod models;

#[tokio::main]
async fn main() {
    let new_app = app::create_app();

 let listener = TcpListener::bind("127.0.0.1:4000")
        .await
        .unwrap();

    axum::serve(listener,new_app)
    .await.unwrap();
}
