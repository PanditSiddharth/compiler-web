use axum::extract::ws::{WebSocket, WebSocketUpgrade, Message};
use tokio::{
    process::Command,
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
};
use std::{process::Stdio};
use futures_util::{SinkExt, stream::{SplitSink, SplitStream, StreamExt}};
use tokio::io::AsyncReadExt;
use wait_timeout::ChildExt;
use tokio::time::{timeout, Duration};

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

let mut child = Command::new("docker")
    .arg("run")
    .arg("--rm")                 // auto delete container
    .arg("-i")                   // stdin
    .arg("--memory=256m")        // RAM limit
    .arg("--cpus=0.5")           // CPU limit
    .arg("python:3.9-slim")   // lightweight image
    .arg("python3")
    .arg("-u")
    .arg("-c")
    .arg(code.as_str())
    .stdin(Stdio::piped())
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
    .expect("Failed to start docker container");

// ⏱️ max execution time
let time_limit = Duration::from_secs(60);

match timeout(time_limit, child.wait()).await {
    Ok(status) => {
        println!("✅ Program exited: {:?}", status);
    }
    Err(_) => {
        println!("⏱️ Time limit exceeded");
        let _ = child.kill().await;
    }
}
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
