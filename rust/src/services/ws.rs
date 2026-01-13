use axum::extract::ws::{WebSocket, WebSocketUpgrade, Message};
use tokio::{
    process::Command,
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
};
use std::process::Stdio;
use futures_util::{SinkExt, stream::{SplitSink, SplitStream, StreamExt}};
use tokio::io::AsyncReadExt;

pub async fn ws_handler(ws: WebSocketUpgrade) -> impl axum::response::IntoResponse {

    ws.on_upgrade(handle_socket)

}

async fn handle_socket(socket: WebSocket) {
    // 🔹 socket split
    let (mut sender, mut receiver): (
    SplitSink<WebSocket, Message>,
    SplitStream<WebSocket>
) = socket.split();


    // 1️⃣ First message = python code
    let code = match receiver.next().await {
        Some(Ok(Message::Text(code))) => code,
        _ => return,
    };

    // 2️⃣ Python process start
    let mut child = Command::new("python3")
        .arg("-u") // unbuffered
        .arg("-c")
        .arg(code.as_str())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    let mut stdin = child.stdin.take().unwrap();
    let stdout = child.stdout.take().unwrap();
    // let mut stdout_reader = BufReader::new(stdout).lines();

tokio::spawn(async move {
    let mut stdout = stdout;
    let mut buf = [0u8; 1024];

    loop {
        let n = stdout.read(&mut buf).await.unwrap();
        if n == 0 { break; }

        let text = String::from_utf8_lossy(&buf[..n]);
        let _ = sender.send(Message::Text(text.to_string().into())).await;
    }
});

    // 4️⃣ websocket → stdin
    while let Some(Ok(msg)) = receiver.next().await {
        if let Message::Text(input) = msg {
            stdin.write_all(input.as_bytes()).await.unwrap();
            stdin.write_all(b"\n").await.unwrap();
        }
    }

    let _ = child.wait().await;


    
}
