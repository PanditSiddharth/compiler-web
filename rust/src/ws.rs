use std::{ time::Duration };

use axum::{
    extract::{ Path, WebSocketUpgrade, ws::{ Message, WebSocket } },
    response::IntoResponse,
};
use futures_util::{ SinkExt, StreamExt, stream::{ SplitSink, SplitStream } };
use tokio::{
    sync::mpsc, time::sleep
};

use crate::run::{pty_run, pty_run_command};
pub async fn ws_handler(ws: WebSocketUpgrade, Path(lang): Path<String>) -> impl IntoResponse {
    ws.on_upgrade(move |socket: WebSocket| handle_socket(socket, lang))
}

async fn handle_socket(mut socket: WebSocket, lang: String) {
    let text = socket.recv().await.unwrap().unwrap();
    let ntext = text.to_text().unwrap().to_owned();
    let (mut sender,mut receiver): (
        SplitSink<WebSocket, Message>,
        SplitStream<WebSocket>,
    ) = socket.split();

    let (out_tx, mut out_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    // channel: async → PTY
    let (in_tx, in_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    let mut pty_handle = pty_run_command(lang, ntext).await.unwrap();
    
    pty_run(pty_handle.pair, out_tx, in_rx).await;

        let ws_sender_task = tokio::spawn(async move {
        while let Some(msg) = out_rx.recv().await {
            let text = String::from_utf8_lossy(&msg).into_owned();
            if sender.send(Message::Text(text.into())).await.is_err() {
                break;
            }
        }

        print!("Program close");
        let _ = sender.send(Message::Close(None)).await;
    });

            let stdin_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    println!("WS INPUT >>> {:?}", text.to_string());
                    if
                        let Err(e) = in_tx.send(
                            // dt
                            text.to_string().into_bytes()
                        )
                    {
                        // stdin closed → process ended
                        println!("stdin closed: {}", e);
                        break;
                    }

                }
                Message::Ping(p) => println!("{:?}", p),
                _ => println!("Nothing"),
            }
        }
    });

    let timeout = sleep(Duration::from_secs(40));
    tokio::pin!(timeout);
    tokio::select! {
    _ = ws_sender_task => {
        stdin_task.abort();
        let _ = pty_handle.child.kill();
    },
        _ = &mut timeout => {
        // ⏱️ TIMEOUT HIT
        println!("⏱️ Execution timeout");

        stdin_task.abort();
        let _ = pty_handle.child.kill(); // 🔥 kill docker
    }
}
}
