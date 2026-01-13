use std::{io::{Read, Write}, process::{Command, Stdio}};
use crate::models::{compile_request::CompileRequest, compile_response::CompileResponse};

pub async fn execute_python_code(req: CompileRequest) -> CompileResponse {
    let mut child = Command::new("python3")
        .arg("-c")
        .arg(req.code)
        .stdout(Stdio::piped())   // 👈 REQUIRED
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();

    let mut stdout = String::new();
    let mut stderr = String::new();

    child
        .stdout
        .as_mut()
        .unwrap()
        .read_to_string(&mut stdout)
        .unwrap();

    child
        .stderr
        .as_mut()
        .unwrap()
        .read_to_string(&mut stderr)
        .unwrap();

    let status = child.wait().unwrap();

    CompileResponse {
        stdout,
        stderr,
        time_ms: 50,
        success: status.success(),
    }
}
