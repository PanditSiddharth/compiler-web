
use tokio::{sync::mpsc::{ UnboundedReceiver, UnboundedSender }, task
};

use portable_pty::{CommandBuilder, PtyPair, PtySize, native_pty_system};
use crate::lang::get_lang;
use tokio::sync::oneshot;

pub struct PtyHandle {
     pub child: Box<dyn portable_pty::Child + Send>,
    pub pair: PtyPair,
}

pub async fn pty_run_command(
    lang: String,
    ntext: String,
) -> anyhow::Result<PtyHandle> {

    let (image, args) = get_lang(&lang, ntext.to_owned());

    let (tx, rx) = oneshot::channel::<PtyHandle>();

    task::spawn_blocking(move || {
        let pty_system = native_pty_system();

        let pair = pty_system.openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        }).unwrap();

let mut cmd = CommandBuilder::new("docker"); 
cmd.arg("run"); 
cmd.arg("--rm"); // auto delete container 
cmd.arg("--network");
cmd.arg("none");
cmd.arg("-it"); // stdin 
cmd.arg("--init");  
cmd.arg("--memory=256m"); // RAM limit 
cmd.arg("--cpus=0.5"); // CPU limit 
cmd.arg(image);
cmd.args(args);


        let child = pair.slave.spawn_command(cmd).unwrap();

        let handle = PtyHandle {
            child,
            pair,
        };

        let _ = tx.send(handle);
    });

    // 🔥 async side waits here
    let handle = rx.await?;

    Ok(handle)
}


pub async fn pty_run(
    pair: PtyPair,
    out_tx: UnboundedSender<Vec<u8>>,
    mut in_rx: UnboundedReceiver<Vec<u8>>,
) {
    task::spawn_blocking(move || {
        let mut reader = pair.master.try_clone_reader().unwrap();
        let mut writer = pair.master.take_writer().unwrap();

        // 🔹 stdout thread
        let tx = out_tx.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 1024];
            loop {
                
                match reader.read(&mut buf) {
                    Ok(0) => break, // EOF
                    Ok(n) => {
                        let _ = tx.send(buf[..n].to_vec());
                    }
                    Err(_) => break,
                }
            }
        });

        // 🔹 stdin thread
        let _stdin_thread = std::thread::spawn(move || {
            while let Some(data) = in_rx.blocking_recv() {
                if writer.write_all(&data).is_err() {
                    break;
                }
                let _ = writer.flush();
            }
            // 🔥 stdin CLOSED → Node ko EOF
            drop(writer);
        });
    });
}
