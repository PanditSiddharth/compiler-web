use std::{ process::Stdio, time::Duration };

use axum::{
    extract::{ Path, WebSocketUpgrade, ws::{ Message, WebSocket } },
    http::Uri,
    response::IntoResponse,
};
use futures_util::{ SinkExt, StreamExt, stream::{ SplitSink, SplitStream } };
use tokio::{
    io::{ AsyncReadExt, AsyncWriteExt },
    process::{ ChildStderr, ChildStdout, Command },
    sync::mpsc::{ self, UnboundedSender },
    time::sleep,
};

use crate::lang::get_lang;
pub async fn ws_handler(ws: WebSocketUpgrade, Path(lang): Path<String>) -> impl IntoResponse {
    ws.on_upgrade(move |socket: WebSocket| handle_socket(socket, lang))
}

async fn handle_socket(mut socket: WebSocket, lang: String) {
    let text = socket.recv().await.unwrap().unwrap();
    println!("Lang {}", lang);
    let ntext = text.to_text().unwrap();
    let (image, args) = get_lang(&lang, ntext.to_owned());

    let mut result_child = Command::new("docker")
        .arg("run")
        .arg("--rm") // auto delete container
        .arg("-i") // stdin
        .arg("--memory=256m") // RAM limit
        .arg("--cpus=0.5") // CPU limit
        .arg(image) // lightweight image
        .args(args)
        .stdout(Stdio::piped())
        .stdin(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();

    let mut stdout: ChildStdout = result_child.stdout.take().unwrap();
    let mut stderr: ChildStderr = result_child.stderr.take().unwrap();
    let mut stdin = result_child.stdin.take().unwrap();

    let (mut sender, mut receiver): (
        SplitSink<WebSocket, Message>,
        SplitStream<WebSocket>,
    ) = socket.split();

    let stdin_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    println!("WS INPUT >>> {:?}", text.to_string());
                    if
                        let Err(e) = stdin.write_all(
                            format!("{}\n", text.to_string()).as_bytes()
                        ).await
                    {
                        // stdin closed → process ended
                        println!("stdin closed: {}", e);
                        break;
                    }

                    if let Err(_) = stdin.flush().await {
                        break;
                    }
                }
                Message::Ping(p) => println!("{:?}", p),
                _ => println!("Nothing"),
            }
        }
    });

    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    let tx_out: UnboundedSender<String> = tx.clone();
    let stdout_task = tokio::spawn(async move {
        let mut buffer = Vec::with_capacity(256);

        loop {
            buffer.clear();
            let n = stdout.read_buf(&mut buffer).await.unwrap();
            if n == 0 {
                break;
            }

            let out: String = String::from_utf8_lossy(&buffer[..n]).to_string();
            tx_out.send(out).unwrap();
        }

        // stdin_task.abort();
        // 🔴 IMPORTANT: close websocket
        // let _ = sender.send(Message::Close(None)).await;
    });

    let tx_err = tx.clone();
    let stderr_task = tokio::spawn(async move {
        let mut buffer = Vec::with_capacity(256);

        loop {
            buffer.clear();
            let n = stderr.read_buf(&mut buffer).await.unwrap();
            if n == 0 {
                break;
            }

            let err = String::from_utf8_lossy(&buffer[..n]).to_string();

            // 🔴 tag error
            tx_err.send(format!("[stderr] {}", err)).unwrap();
        }
    });

    let ws_sender_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }

        print!("Program close");
        let _ = sender.send(Message::Close(None)).await;
    });

    let timeout = sleep(Duration::from_secs(60));
    tokio::pin!(timeout);
    tokio::select! {
    _ = ws_sender_task => {
        stdin_task.abort();
        let _ = result_child.kill().await; // 🔥 kill docker
    },
    _ = stdout_task => { stdin_task.abort();
        let _ = result_child.kill().await; // 🔥 kill docker
    },
    _= stderr_task => { stdin_task.abort();
        let _ = result_child.kill().await; // 🔥 kill docker
    
    },
// _= stdin_task => {
        // let _ = result_child.kill().await; // 🔥 kill docker
// },
        _ = &mut timeout => {
        // ⏱️ TIMEOUT HIT
        println!("⏱️ Execution timeout");

        stdin_task.abort();
        let _ = result_child.kill().await; // 🔥 kill docker
    }
}
}
